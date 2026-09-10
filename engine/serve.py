"""Kernel HTTP API. Graph is the brain. Does not touch data/raw/."""

from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from engine.analytics import build as build_analytics
from engine.cut import arrest
from engine.graph import from_payload
from engine.paths import INSIGHTS, KERNEL
from engine.rag import ask

CORS_ORIGIN = "http://localhost:5173"
HOST = os.environ.get("GOTHAM_HOST", "127.0.0.1")
PORT = int(os.environ.get("GOTHAM_PORT", "8000"))

_KERNEL = None


def _kernel():
    global _KERNEL
    if _KERNEL is None:
        from engine.pipeline import build_kernel

        _KERNEL = build_kernel()
    return _KERNEL


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", CORS_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "600")

    def _send(self, code: int, payload, content_type: str = "application/json") -> None:
        if isinstance(payload, (dict, list)):
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        elif isinstance(payload, bytes):
            body = payload
        else:
            body = str(payload).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", content_type + "; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path: Path) -> None:
        if not path.exists() or path.stat().st_size < 2:
            self._send(404, {"error": f"missing {path.name}"})
            return
        data = path.read_bytes()
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        if path == "/health":
            self._send(200, {"ok": True})
            return
        if path == "/graph":
            self._send_file(KERNEL)
            return
        if path == "/insights":
            self._send_file(INSIGHTS)
            return
        if path == "/analytics":
            self._send(200, build_analytics())
            return
        if path == "/cut":
            node_id = (parse_qs(parsed.query).get("id") or [""])[0].strip()
            if not node_id:
                self._send(400, {"error": "missing id"})
                return
            if not KERNEL.exists() or KERNEL.stat().st_size < 8:
                self._send(404, {"error": "missing graph.json"})
                return
            G = from_payload(json.loads(KERNEL.read_text(encoding="utf-8")))
            impact = arrest(G, node_id)
            self._send(
                200,
                {
                    "node_id": node_id,
                    "residual_path": list(impact.get("residual_path") or []),
                    "pairs_before": impact.get("pairs_before"),
                    "pairs_after": impact.get("pairs_after"),
                },
            )
            return
        self._send(404, {"error": "not found"})

    def do_POST(self) -> None:
        path = urlparse(self.path).path.rstrip("/") or "/"
        if path != "/ask":
            self._send(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._send(400, {"error": "invalid json"})
            return
        question = (body.get("question") or "").strip() if isinstance(body, dict) else ""
        if not question:
            self._send(400, {"error": "missing question"})
            return
        result = ask(question, kernel=_kernel())
        self._send(200, result)


def main() -> None:
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"serving http://{HOST}:{PORT}  CORS {CORS_ORIGIN}", flush=True)
    print("start: python -m engine.serve", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()

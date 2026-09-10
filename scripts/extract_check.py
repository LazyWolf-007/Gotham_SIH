"""Gold-label gate for FIR narrative extraction. Never edits data/raw/."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from engine.extract import run
from engine.paths import EXTRACTED


def _fail(msg: str) -> None:
    print(f"FAIL {msg}")
    raise SystemExit(1)


def _by_id(payload: dict) -> dict:
    return {r["fir_id"]: r for r in (payload.get("records") or []) if r.get("fir_id")}


def _engine_hardcodes_accountant() -> Path | None:
    engine = ROOT / "engine"
    for path in sorted(engine.rglob("*")):
        if not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        if "person:naveen_bhatia" in text:
            return path
    return None


def main() -> None:
    payload = run()
    records = _by_id(payload)
    print("extract_check:", EXTRACTED)

    r014 = records.get("FIR-2026-014")
    if not r014:
        _fail("FIR-2026-014 missing from extracted.json")
    print("FIR-2026-014")
    print(json.dumps(r014, indent=2, ensure_ascii=False))
    blob014 = json.dumps(r014)
    if "farhan_lodhi" not in blob014 and "phone:ph03" not in blob014:
        _fail("FIR-2026-014 → need farhan_lodhi OR phone:ph03")
    print("PASS FIR-2026-014 → farhan_lodhi OR phone:ph03")

    r010 = records.get("FIR-2026-010")
    if not r010:
        _fail("FIR-2026-010 missing from extracted.json")
    print("FIR-2026-010")
    print(json.dumps(r010, indent=2, ensure_ascii=False))
    blob010 = json.dumps(r010)
    if "naveen_bhatia" not in blob010:
        _fail("FIR-2026-010 → need naveen_bhatia")
    print("PASS FIR-2026-010 → naveen_bhatia")

    hit = _engine_hardcodes_accountant()
    if hit is not None:
        _fail(f"engine/ contains person:naveen_bhatia ({hit.relative_to(ROOT)})")
    print("PASS engine/ does not contain person:naveen_bhatia")
    print("extract_check: ALL PASS")


if __name__ == "__main__":
    main()

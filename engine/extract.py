"""FIR narrative reader. LLM is a mouth; graph ids are matched locally."""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

from engine.ingest import _parse_firs
from engine.paths import EXTRACTED, KERNEL, PACKS, PROCESSED, RAW
from engine.rag import GROQ_URL, _groq_headers, _message_text, _resolve_model

KEYS = ("people", "phones", "orgs", "amounts", "relations")
_ID_RE = re.compile(
    r"\b(?:person|phone|acc|org|loc|cam|veh|FIR)[:\-][A-Za-z0-9_]+\b",
    re.I,
)
_PHONE_RE = re.compile(r"(?<!\d)([6-9](?:[\s\-]?\d){9})(?!\d)")
_AMOUNT_RE = re.compile(
    r"(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)",
    re.I,
)
_MIN_NAME = 6


def _norm(value: str) -> str:
    return " ".join(re.sub(r"[^a-z0-9]+", " ", (value or "").lower()).split())


def _digits(value: str) -> str:
    return "".join(ch for ch in (value or "") if ch.isdigit())


def strip_named_ids(text: str) -> str:
    """Narrative only — drop frozen graph ids if a feed leaked them."""
    return _ID_RE.sub("", text or "").strip()


def _load_firs() -> list[dict]:
    pack = {}
    pack_path = PACKS / "fir.pack.yaml"
    if pack_path.exists():
        import yaml

        pack = yaml.safe_load(pack_path.read_text(encoding="utf-8")) or {}
    source = (pack.get("source") or "data/raw/firs.md").replace("\\", "/")
    path = RAW / Path(source).name
    return _parse_firs(path)


def _load_nodes() -> dict[str, dict]:
    if KERNEL.exists() and KERNEL.stat().st_size > 8:
        payload = json.loads(KERNEL.read_text(encoding="utf-8"))
        return {n["id"]: n for n in (payload.get("nodes") or []) if n.get("id")}
    from engine.ingest import load

    nodes, _edges, _universe = load()
    return nodes


def build_index(nodes: dict[str, dict]) -> dict:
    person_by_norm: dict[str, str] = {}
    org_by_norm: dict[str, str] = {}
    phone_by_digits: dict[str, str] = {}
    person_names: list[tuple[str, str]] = []
    org_names: list[tuple[str, str]] = []
    for nid, node in nodes.items():
        typ = node.get("type")
        attrs = node.get("attributes") or {}
        if typ == "Person":
            name = str(attrs.get("name") or node.get("label") or "")
            key = _norm(name)
            if key:
                person_by_norm[key] = nid
                person_names.append((name, nid))
        elif typ == "Organization":
            name = str(attrs.get("name") or node.get("label") or "")
            key = _norm(name)
            if key:
                org_by_norm[key] = nid
                org_names.append((name, nid))
        elif typ == "Phone":
            d = _digits(str(attrs.get("msisdn") or node.get("label") or nid))
            if d:
                phone_by_digits[d] = nid
                if len(d) > 10:
                    phone_by_digits[d[-10:]] = nid
    person_names.sort(key=lambda row: len(row[0]), reverse=True)
    org_names.sort(key=lambda row: len(row[0]), reverse=True)
    return {
        "person_by_norm": person_by_norm,
        "org_by_norm": org_by_norm,
        "phone_by_digits": phone_by_digits,
        "person_names": person_names,
        "org_names": org_names,
    }


def _snippet_for(narrative: str, text: str, width: int = 180) -> str:
    hay = narrative or ""
    needle = (text or "").strip()
    if not needle:
        return hay[:width]
    low = hay.lower()
    i = low.find(needle.lower())
    if i < 0:
        n = _norm(needle)
        nlow = _norm(hay)
        j = nlow.find(n) if n else -1
        if j >= 0:
            # Map approx char index; fall back to a prefix window.
            ratio = j / max(len(nlow), 1)
            i = int(ratio * len(hay))
        else:
            d = _digits(needle)
            if d:
                i = _digits(hay).find(d)
                if i >= 0:
                    # Locate first digit run start in original text.
                    seen = 0
                    for idx, ch in enumerate(hay):
                        if ch.isdigit():
                            if seen == i:
                                i = idx
                                break
                            seen += 1
    if i < 0:
        return hay[:width].replace("\n", " ").strip()
    start = max(0, i - 50)
    end = min(len(hay), i + max(len(needle), 8) + 90)
    return hay[start:end].replace("\n", " ").strip()[:240]


def _empty() -> dict:
    return {k: [] for k in KEYS}


def _coerce(raw) -> dict:
    out = _empty()
    if not isinstance(raw, dict):
        return out
    for key in KEYS:
        items = raw.get(key)
        if isinstance(items, dict):
            items = [items]
        if not isinstance(items, list):
            continue
        for item in items:
            if isinstance(item, str):
                text, snippet = item.strip(), ""
            elif isinstance(item, dict):
                text = str(item.get("text") or item.get("name") or item.get("value") or "").strip()
                snippet = str(item.get("snippet") or item.get("span") or "").strip()
            else:
                continue
            if not text:
                continue
            out[key].append({"text": text, "snippet": snippet[:240]})
    return out


def _parse_json_obj(text: str) -> dict | None:
    if not text:
        return None
    blob = text.strip()
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", blob, re.S)
    if fence:
        blob = fence.group(1)
    else:
        start, end = blob.find("{"), blob.rfind("}")
        if start >= 0 and end > start:
            blob = blob[start : end + 1]
    try:
        data = json.loads(blob)
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def _groq_mentions(narrative: str, key: str, model: str) -> dict | None:
    system = (
        "Extract entities from this FIR narrative. Return JSON only with keys "
        "people, phones, orgs, amounts, relations. Each value is a list of "
        "{text, snippet}. snippet is a short quote copied from the narrative. "
        "people = person names; phones = mobile numbers; orgs = firm names; "
        "amounts = money as written; relations = who uses/owns/paid/works-at whom. "
        "Do not invent. Do not emit graph ids. Narrative is the only source."
    )
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": narrative},
        ],
        "temperature": 0,
        "max_tokens": 900,
        "response_format": {"type": "json_object"},
    }
    req = urllib.request.Request(
        GROQ_URL,
        data=json.dumps(body).encode("utf-8"),
        headers=_groq_headers(key, json_body=True),
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
        return None
    parsed = _parse_json_obj(_message_text(raw) or "")
    return _coerce(parsed) if parsed else None


def _find_name_hits(narrative: str, names: list[tuple[str, str]]) -> list[dict]:
    hits = []
    occupied = [False] * len(narrative)
    low = narrative.lower()
    for name, nid in names:
        if len(_norm(name)) < _MIN_NAME:
            continue
        nlow = name.lower()
        start = 0
        while True:
            i = low.find(nlow, start)
            if i < 0:
                break
            j = i + len(nlow)
            start = i + 1
            if i > 0 and low[i - 1].isalnum():
                continue
            if j < len(low) and low[j].isalnum():
                continue
            if any(occupied[i:j]):
                continue
            for k in range(i, j):
                occupied[k] = True
            span = narrative[i:j]
            hits.append(
                {
                    "text": span,
                    "snippet": _snippet_for(narrative, span),
                    "id": nid,
                }
            )
    return hits


def _local_mentions(narrative: str, index: dict) -> dict:
    out = _empty()
    out["people"] = [
        {"text": h["text"], "snippet": h["snippet"]}
        for h in _find_name_hits(narrative, index["person_names"])
    ]
    out["orgs"] = [
        {"text": h["text"], "snippet": h["snippet"]}
        for h in _find_name_hits(narrative, index["org_names"])
    ]
    seen_phones: set[str] = set()
    for m in _PHONE_RE.finditer(narrative):
        raw = m.group(1)
        d = _digits(raw)
        if d in seen_phones:
            continue
        seen_phones.add(d)
        out["phones"].append({"text": d, "snippet": _snippet_for(narrative, raw)})
    seen_amt: set[str] = set()
    for m in _AMOUNT_RE.finditer(narrative):
        raw = m.group(0).strip()
        key = _digits(raw)
        if not key or key in seen_amt:
            continue
        seen_amt.add(key)
        out["amounts"].append({"text": raw, "snippet": _snippet_for(narrative, raw)})
    return out


def _best_name_id(text: str, by_norm: dict[str, str]) -> str | None:
    n = _norm(text)
    if not n:
        return None
    if n in by_norm:
        return by_norm[n]
    tokens = n.split()
    best_id, best_len = None, 0
    for gname, gid in by_norm.items():
        if gname == n:
            return gid
        if len(gname) >= _MIN_NAME and gname in n and len(gname) > best_len:
            best_id, best_len = gid, len(gname)
        elif (
            len(tokens) >= 2
            and len(n) >= _MIN_NAME
            and n in gname
            and len(n) > best_len
        ):
            best_id, best_len = gid, len(n)
    return best_id


def _match_phone(text: str, phone_by_digits: dict[str, str]) -> str | None:
    d = _digits(text)
    if not d:
        return None
    if d in phone_by_digits:
        return phone_by_digits[d]
    if len(d) >= 10 and d[-10:] in phone_by_digits:
        return phone_by_digits[d[-10:]]
    for m in re.finditer(r"\d{10}", d):
        hit = phone_by_digits.get(m.group())
        if hit:
            return hit
    return None


def _match_item(kind: str, text: str, index: dict) -> str | None:
    if kind == "people":
        return _best_name_id(text, index["person_by_norm"])
    if kind == "orgs":
        return _best_name_id(text, index["org_by_norm"])
    if kind == "phones":
        return _match_phone(text, index["phone_by_digits"])
    if kind == "relations":
        return _best_name_id(text, index["person_by_norm"]) or _match_phone(
            text, index["phone_by_digits"]
        ) or _best_name_id(text, index["org_by_norm"])
    return None


def _merge(parts: list[dict]) -> dict:
    out = _empty()
    seen: set[tuple[str, str]] = set()
    for part in parts:
        if not part:
            continue
        for key in KEYS:
            for item in part.get(key) or []:
                text = (item.get("text") or "").strip()
                if not text:
                    continue
                sig = (key, _norm(text) or _digits(text) or text.lower())
                if sig in seen:
                    continue
                seen.add(sig)
                out[key].append(
                    {
                        "text": text,
                        "snippet": (item.get("snippet") or "")[:240],
                    }
                )
    return out


def _bind(mentions: dict, narrative: str, index: dict) -> dict:
    bound = _empty()
    for key in KEYS:
        for item in mentions.get(key) or []:
            text = (item.get("text") or "").strip()
            if not text:
                continue
            snippet = (item.get("snippet") or "").strip() or _snippet_for(narrative, text)
            row = {"text": text, "snippet": snippet[:240]}
            nid = _match_item(key, text, index)
            if nid:
                row["id"] = nid
            bound[key].append(row)
    return bound


def _matched_ids(record: dict) -> list[str]:
    ids: list[str] = []
    for key in KEYS:
        for item in record.get(key) or []:
            nid = item.get("id")
            if nid and nid not in ids:
                ids.append(nid)
    return ids


def extract_fir(
    fir: dict,
    index: dict,
    groq_key: str = "",
    model: str = "",
    groq_mentions: dict | None = None,
) -> dict:
    narrative = strip_named_ids(fir.get("narrative") or "")
    groq = groq_mentions
    if groq is None and groq_key and narrative:
        groq = _groq_mentions(narrative, groq_key, model)
    local = _local_mentions(narrative, index)
    mentions = _merge([groq or {}, local])
    bound = _bind(mentions, narrative, index)
    fid = fir.get("id")
    return {
        "fir_id": fid,
        "people": bound["people"],
        "phones": bound["phones"],
        "orgs": bound["orgs"],
        "amounts": bound["amounts"],
        "relations": bound["relations"],
        "matched_ids": _matched_ids(bound),
    }


def _prefetch_groq(firs: list[dict], key: str, model: str) -> dict[str, dict]:
    out: dict[str, dict] = {}
    if not key:
        return out

    def one(fir: dict) -> tuple[str, dict | None]:
        fid = fir.get("id") or ""
        narrative = strip_named_ids(fir.get("narrative") or "")
        if not fid or not narrative:
            return fid, None
        return fid, _groq_mentions(narrative, key, model)

    workers = min(4, max(1, len(firs)))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futs = [pool.submit(one, fir) for fir in firs]
        for fut in as_completed(futs):
            try:
                fid, mentions = fut.result()
            except Exception:
                continue
            if fid and mentions:
                out[fid] = mentions
    return out


def run(path=None) -> dict:
    firs = _load_firs()
    nodes = _load_nodes()
    index = build_index(nodes)
    key = (os.environ.get("GROQ_API_KEY") or "").strip()
    model = ""
    if key:
        model = (os.environ.get("GROQ_MODEL") or "").strip() or _resolve_model(key)
    groq_map = _prefetch_groq(firs, key, model)
    records = []
    for fir in firs:
        rec = extract_fir(
            fir,
            index,
            groq_key="",
            model=model,
            groq_mentions=groq_map.get(fir.get("id")),
        )
        records.append(rec)
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "records": records,
    }
    out = path or EXTRACTED
    PROCESSED.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return payload


def attach_mentions(nodes: dict[str, dict], edges: list[dict]) -> tuple[dict[str, dict], list[dict]]:
    """Fold extracted.json people onto the graph as MENTIONED_IN. Does not drop CALLED/PAID."""
    if not EXTRACTED.exists() or EXTRACTED.stat().st_size < 8:
        return nodes, edges
    try:
        payload = json.loads(EXTRACTED.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return nodes, edges
    existing = {(e.get("type"), e.get("source"), e.get("target")) for e in edges}
    for rec in payload.get("records") or []:
        fid = rec.get("fir_id")
        if not fid or fid not in nodes:
            continue
        if nodes[fid].get("type") != "FIR":
            continue
        for person in rec.get("people") or []:
            pid = person.get("id")
            if not pid or pid not in nodes:
                continue
            if nodes[pid].get("type") != "Person":
                continue
            key = ("MENTIONED_IN", pid, fid)
            if key in existing:
                continue
            snippet = (person.get("snippet") or person.get("text") or "")[:240]
            edges.append(
                {
                    "type": "MENTIONED_IN",
                    "source": pid,
                    "target": fid,
                    "attributes": {
                        "source_type": "extract",
                        "source_id": str(fid),
                        "snippet": snippet,
                        "role": "extracted",
                        "text": person.get("text") or "",
                    },
                }
            )
            existing.add(key)
    return nodes, edges


def main() -> None:
    payload = run()
    print(f"wrote {EXTRACTED} firs={len(payload.get('records') or [])}")


if __name__ == "__main__":
    main()

"""FIR narrative reader. LLM is a mouth; graph ids are matched locally."""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

from engine.ingest import _parse_firs
from engine.paths import EXTRACTED, KERNEL, PACKS, PROCESSED, RAW
from engine.rag import GROQ_URL, _groq_headers, _message_text, _resolve_model

KEYS = ("people", "phones", "orgs", "amounts", "relations")
REL_TYPES = ("OWNS", "USES", "PAID", "MEMBER_OF")
_ID_RE = re.compile(
    r"\b(?:person|phone|acc|org|loc|cam|veh|FIR)[:\-][A-Za-z0-9_]+\b",
    re.I,
)
_PHONE_RE = re.compile(r"(?<!\d)([6-9](?:[\s\-]?\d){9})(?!\d)")
_AMOUNT_RE = re.compile(
    r"(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d+)?)",
    re.I,
)
_ACC_TOKEN = re.compile(
    r"\b(?:(?:BOB|HDFC|SBI|ICICI|PNB|AXIS|YES|UCO|IDFC|CANARA)\s+)?A/?c\s+([A-Z]{2,6}\d{6,})\b"
    r"|(\b[A-Z]{2,6}\d{9,}\b)",
    re.I,
)
_MIN_NAME = 6
_REL_CUE = {
    "OWNS": re.compile(r"\bowns?\b|\bowned\b|\bown (?:handset|prepaid|mobile|phone|number)\b", re.I),
    "USES": re.compile(r"\buses\b|\bused\b|\busing\b", re.I),
    "PAID": re.compile(r"\bpaid\b|\bpays\b|\bneft", re.I),
    "MEMBER_OF": re.compile(
        r"\bmember of\b|\bmanager\b|\bclerk\b|\bemployee\b|\bworks at\b|\b of \b|\bat\b",
        re.I,
    ),
}


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
    acc_by_digits: dict[str, str] = {}
    acc_by_norm: dict[str, str] = {}
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
        elif typ == "Account":
            number = str(attrs.get("number") or node.get("label") or "")
            d = _digits(number)
            if d:
                acc_by_digits[d] = nid
            key = _norm(number)
            if key:
                acc_by_norm[key] = nid
    person_names.sort(key=lambda row: len(row[0]), reverse=True)
    org_names.sort(key=lambda row: len(row[0]), reverse=True)
    return {
        "person_by_norm": person_by_norm,
        "org_by_norm": org_by_norm,
        "phone_by_digits": phone_by_digits,
        "acc_by_digits": acc_by_digits,
        "acc_by_norm": acc_by_norm,
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


def _rel_cued(rel: str, sentence: str) -> bool:
    cue = _REL_CUE.get(rel)
    return bool(cue and sentence and cue.search(sentence))


def _accounts_in(text: str) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for m in _ACC_TOKEN.finditer(text or ""):
        raw = (m.group(1) or m.group(2) or "").upper()
        if raw and raw not in seen:
            seen.add(raw)
            out.append(raw)
    return out


def _sentences(narrative: str) -> list[str]:
    parts = re.split(r"(?<=[.!?;])\s+", (narrative or "").strip())
    return [p.strip() for p in parts if p.strip()]


def _person_for_lastname(last: str, index: dict, prefer: list[str] | None = None) -> str:
    lastn = _norm(last)
    if not lastn:
        return ""
    for name in prefer or []:
        parts = _norm(name).split()
        if parts and parts[-1] == lastn:
            return name
    hits = [
        name
        for name, _nid in index.get("person_names") or []
        if _norm(name).split()[-1:] == [lastn]
    ]
    if len(hits) == 1:
        return hits[0]
    return ""


def _parse_relation_text(text: str, snippet: str) -> dict | None:
    m = re.search(
        r"(.+?)\s+(OWNS|USES|PAID|MEMBER_OF|owns|uses|paid|member[_ ]of)\s+(.+)",
        text or "",
        re.I,
    )
    if not m:
        return None
    rel = re.sub(r"[\s]+", "_", m.group(2).strip().upper())
    if rel not in REL_TYPES:
        return None
    src, dst = m.group(1).strip(), m.group(3).strip()
    if not src or not dst:
        return None
    return {"src": src, "rel": rel, "dst": dst, "snippet": (snippet or "")[:240]}


def _coerce_relation(item) -> dict | None:
    if isinstance(item, str):
        return _parse_relation_text(item, "")
    if not isinstance(item, dict):
        return None
    src = str(item.get("src") or item.get("source") or item.get("from") or "").strip()
    dst = str(item.get("dst") or item.get("target") or item.get("to") or "").strip()
    rel = str(item.get("rel") or item.get("type") or item.get("relation") or "").strip().upper()
    rel = re.sub(r"[\s]+", "_", rel)
    snippet = str(item.get("snippet") or item.get("span") or "").strip()
    if rel in REL_TYPES and src and dst:
        return {"src": src, "rel": rel, "dst": dst, "snippet": snippet[:240]}
    text = str(item.get("text") or "").strip()
    if text:
        return _parse_relation_text(text, snippet)
    return None


def _surface_in(text: str, hay: str) -> bool:
    if not text or not hay:
        return False
    if text.lower() in hay.lower():
        return True
    d = _digits(text)
    return bool(len(d) >= 6 and d in _digits(hay))


def _relation_row(src: str, rel: str, dst: str, snippet: str) -> dict | None:
    src, dst = (src or "").strip(), (dst or "").strip()
    rel = (rel or "").strip().upper()
    if rel not in REL_TYPES or not src or not dst:
        return None
    if _norm(src) == _norm(dst) or (_digits(src) and _digits(src) == _digits(dst)):
        return None
    hay = snippet or f"{src} {rel} {dst}"
    if not _rel_cued(rel, hay):
        return None
    return {"src": src, "rel": rel, "dst": dst, "snippet": (snippet or "")[:240]}


def _coerce(raw) -> dict:
    out = _empty()
    if not isinstance(raw, dict):
        return out
    for key in ("people", "phones", "orgs", "amounts"):
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
    items = raw.get("relations")
    if isinstance(items, dict):
        items = [items]
    if isinstance(items, list):
        for item in items:
            row = _coerce_relation(item)
            if row:
                out["relations"].append(row)
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
        "people, phones, orgs, amounts, relations. "
        "people, phones, orgs, amounts are lists of {text, snippet}. "
        "snippet is a short quote copied from the narrative. "
        "people = person names; phones = mobile numbers; orgs = firm names; "
        "amounts = money as written. "
        "relations MUST be a list of {src, rel, dst, snippet}. "
        "rel is OWNS, USES, PAID, or MEMBER_OF only if that sentence says so. "
        "Do not emit CALLED, SEEN_AT, MENTIONED_IN, SAME_AS, or any other rel. "
        "src and dst are names or numbers as written, not graph ids. "
        "Do not invent. Narrative is the only source."
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


def _local_relations(narrative: str, index: dict) -> list[dict]:
    rels: list[dict] = []
    seen: set[tuple[str, str, str]] = set()
    last_person = ""
    last_phone = ""
    last_prepaid = ""
    seen_people: list[str] = []

    def add(src: str, rel: str, dst: str, sentence: str) -> None:
        row = _relation_row(src, rel, dst, sentence.replace("\n", " ").strip())
        if not row:
            return
        sig = (_norm(row["src"]), row["rel"], _norm(row["dst"]) or _digits(row["dst"]))
        if sig in seen:
            return
        seen.add(sig)
        rels.append(row)

    for sent in _sentences(narrative):
        people = _find_name_hits(sent, index["person_names"])
        orgs = _find_name_hits(sent, index["org_names"])
        phones: list[str] = []
        for m in _PHONE_RE.finditer(sent):
            d = _digits(m.group(1))
            if d and d not in phones:
                phones.append(d)
        accs = _accounts_in(sent)
        low = sent.lower()
        if people:
            last_person = people[0]["text"]
            for p in people:
                if p["text"] not in seen_people:
                    seen_people.append(p["text"])
        if phones:
            last_phone = phones[-1]
        for m in re.finditer(r"prepaid\s+([6-9](?:[\s\-]?\d){9})", sent, re.I):
            last_prepaid = _digits(m.group(1))
        if "prepaid" in low and phones and not last_prepaid:
            last_prepaid = phones[0]

        for p in people:
            for o in orgs:
                pt, ot = p["text"], o["text"]
                if re.search(
                    rf"{re.escape(pt)}.{{0,80}}(?:\bof\b|\bmanager\b|\bclerk\b|\bat\b).{{0,80}}{re.escape(ot)}",
                    sent,
                    re.I,
                ):
                    add(pt, "MEMBER_OF", ot, sent)

        used = re.search(
            r"(?:that prepaid|the prepaid|prepaid|mobile|handset|phone)?.{0,24}\bis used by\s+([^,;]+)",
            sent,
            re.I,
        )
        if used:
            who = used.group(1).strip()
            who = re.split(r"\s+who\s+", who, maxsplit=1)[0].strip()
            phone = last_prepaid or last_phone or (phones[0] if phones else "")
            if who and phone:
                add(who, "USES", phone, sent)
        uses = re.search(
            r"\buses\s+(?:mobile|prepaid|handset|phone)?\s*([6-9](?:[\s\-]?\d){9})",
            sent,
            re.I,
        )
        if uses:
            who = people[0]["text"] if people else last_person
            add(who, "USES", _digits(uses.group(1)), sent)

        own = re.search(
            r"\b([A-Z][A-Za-z]{2,})'s own (?:handset|prepaid|mobile|phone|number)\s+is\s+([6-9](?:[\s\-]?\d){9})",
            sent,
        )
        if own:
            who = _person_for_lastname(
                own.group(1),
                index,
                [p["text"] for p in people] + seen_people,
            )
            if who:
                add(who, "OWNS", _digits(own.group(2)), sent)
        own2 = re.search(
            r"\bown (?:prepaid|handset|mobile|phone)\s+([6-9](?:[\s\-]?\d){9})",
            sent,
            re.I,
        )
        if own2:
            who = people[0]["text"] if people else last_person
            add(who, "OWNS", _digits(own2.group(1)), sent)
        owns = re.search(r"\bowns\s+(.+)", sent, re.I)
        if owns and people:
            clause = owns.group(1)
            dsts = [_digits(m.group(1)) for m in _PHONE_RE.finditer(clause)] + _accounts_in(clause)
            for dst in dsts:
                add(people[0]["text"], "OWNS", dst, sent)

        if re.search(r"\b(?:paid|neft)", low) and len(accs) >= 2:
            add(accs[0], "PAID", accs[1], sent)

    return rels


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
    out["relations"] = _local_relations(narrative, index)
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
    return None


def _match_endpoint(text: str, index: dict) -> str | None:
    return (
        _best_name_id(text, index["person_by_norm"])
        or _match_phone(text, index["phone_by_digits"])
        or _best_name_id(text, index["org_by_norm"])
        or index.get("acc_by_digits", {}).get(_digits(text) or "")
        or _best_name_id(text, index.get("acc_by_norm") or {})
    )


def _merge(parts: list[dict]) -> dict:
    out = _empty()
    seen: set[tuple[str, str]] = set()
    seen_rel: set[tuple[str, str, str]] = set()
    for part in parts:
        if not part:
            continue
        for key in ("people", "phones", "orgs", "amounts"):
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
        for item in part.get("relations") or []:
            row = _relation_row(
                str(item.get("src") or ""),
                str(item.get("rel") or ""),
                str(item.get("dst") or ""),
                str(item.get("snippet") or ""),
            )
            if not row:
                continue
            sig = (_norm(row["src"]), row["rel"], _norm(row["dst"]) or _digits(row["dst"]))
            if sig in seen_rel:
                continue
            seen_rel.add(sig)
            out["relations"].append(row)
    return out


def _bind(mentions: dict, narrative: str, index: dict) -> dict:
    bound = _empty()
    for key in ("people", "phones", "orgs", "amounts"):
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
    for item in mentions.get("relations") or []:
        snippet = (item.get("snippet") or "").strip()
        if not snippet:
            snippet = _snippet_for(narrative, str(item.get("src") or item.get("dst") or ""))
        row = _relation_row(
            str(item.get("src") or ""),
            str(item.get("rel") or ""),
            str(item.get("dst") or ""),
            snippet,
        )
        if not row:
            continue
        if not _surface_in(row["src"], narrative) or not _surface_in(row["dst"], narrative):
            continue
        bound["relations"].append(row)
    return bound


def _matched_ids(record: dict, index: dict | None = None) -> list[str]:
    ids: list[str] = []
    for key in KEYS:
        for item in record.get(key) or []:
            nid = item.get("id")
            if nid and nid not in ids:
                ids.append(nid)
            if key == "relations" and index:
                for field in ("src", "dst"):
                    hit = _match_endpoint(str(item.get(field) or ""), index)
                    if hit and hit not in ids:
                        ids.append(hit)
    return ids


def _reject_empty_relations(record: dict) -> None:
    people_n = len(record.get("people") or [])
    rels = record.get("relations") or []
    fid = record.get("fir_id") or "?"
    if people_n >= 3 and not rels:
        raise SystemExit(f"{fid}: empty relations with {people_n} people")
    for row in rels:
        missing = {"src", "rel", "dst", "snippet"} - set(row)
        if missing:
            raise SystemExit(f"{fid}: relation missing {sorted(missing)}")
        if row.get("rel") not in REL_TYPES:
            raise SystemExit(f"{fid}: bad rel {row.get('rel')}")


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
    record = {
        "fir_id": fid,
        "people": bound["people"],
        "phones": bound["phones"],
        "orgs": bound["orgs"],
        "amounts": bound["amounts"],
        "relations": bound["relations"],
        "matched_ids": _matched_ids(bound, index),
    }
    _reject_empty_relations(record)
    return record


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


def _load_extracted(path: Path | None = None) -> dict:
    src = path or EXTRACTED
    if not src.exists() or src.stat().st_size < 8:
        return {"records": []}
    try:
        data = json.loads(src.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"records": []}
    if not isinstance(data, dict):
        return {"records": []}
    data.setdefault("records", [])
    return data


def run(path=None, fir_id: str | None = None, use_groq: bool = True) -> dict:
    out = path or EXTRACTED
    firs = _load_firs()
    if fir_id:
        firs = [f for f in firs if f.get("id") == fir_id]
        if not firs:
            raise SystemExit(f"unknown fir {fir_id}")
    elif use_groq and (os.environ.get("GROQ_API_KEY") or "").strip():
        cached = _load_extracted(out)
        if cached.get("records"):
            return cached
    nodes = _load_nodes()
    index = build_index(nodes)
    key = (os.environ.get("GROQ_API_KEY") or "").strip() if use_groq else ""
    model = ""
    if key:
        model = (os.environ.get("GROQ_MODEL") or "").strip() or _resolve_model(key)
    groq_map = _prefetch_groq(firs, key, model)
    fresh = []
    for fir in firs:
        rec = extract_fir(
            fir,
            index,
            groq_key="",
            model=model,
            groq_mentions=groq_map.get(fir.get("id")),
        )
        fresh.append(rec)
    if fir_id:
        records = []
        seen = False
        for rec in _load_extracted(out).get("records") or []:
            if rec.get("fir_id") == fir_id:
                records.append(fresh[0])
                seen = True
            else:
                records.append(rec)
        if not seen:
            records.append(fresh[0])
    else:
        records = fresh
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "records": records,
    }
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


def _cli_fir(argv: list[str]) -> str | None:
    for i, arg in enumerate(argv):
        if arg == "--fir" and i + 1 < len(argv):
            return argv[i + 1]
        if arg.startswith("--fir="):
            return arg.split("=", 1)[1]
    return None


def main() -> None:
    fir_id = _cli_fir(sys.argv[1:])
    t0 = time.perf_counter()
    payload = run(fir_id=fir_id)
    dt = time.perf_counter() - t0
    records = payload.get("records") or []
    if fir_id:
        rec = next((r for r in records if r.get("fir_id") == fir_id), None)
        print(f"extract {fir_id}  {dt:.2f}s", flush=True)
        print(json.dumps(rec, indent=2, ensure_ascii=False), flush=True)
        return
    print(f"wrote {EXTRACTED} firs={len(records)}  {dt:.2f}s", flush=True)


if __name__ == "__main__":
    main()

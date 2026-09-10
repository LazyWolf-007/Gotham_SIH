"""Ingest frozen raw feeds through packs. Provenance on every edge."""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path

import yaml

from engine.gold import frozen_gold, with_derived
from engine.paths import KERNEL, LINK_TYPES, PACKS, RAW, UNIVERSE


def _prov(source_type: str, source_id: str, snippet: str) -> dict:
    return {
        "source_type": source_type,
        "source_id": str(source_id),
        "snippet": (snippet or "")[:240],
    }


def _edge(typ: str, source: str, target: str, attrs: dict) -> dict:
    if typ not in LINK_TYPES:
        raise ValueError(f"forbidden link type {typ}")
    if typ == "ASSOCIATED":
        raise ValueError("ASSOCIATED is forbidden")
    payload = dict(attrs)
    if "source_type" not in payload:
        raise ValueError("edge missing provenance")
    return {"type": typ, "source": source, "target": target, "attributes": payload}


def _load_pack(name: str) -> dict:
    return yaml.safe_load((PACKS / f"{name}.pack.yaml").read_text(encoding="utf-8"))


def _parse_firs(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8")
    chunks = re.split(r"\n(?=## FIR-)", text.strip())
    out = []
    for chunk in chunks:
        if not chunk.strip():
            continue
        fields = {}
        for m in re.finditer(r"^- (\w+): (.*)$", chunk, re.M):
            fields[m.group(1)] = m.group(2).strip()
        narr_m = re.search(r"- narrative: \|\n((?:    .*\n?)*)", chunk)
        narrative = ""
        if narr_m:
            narrative = "\n".join(line[4:] for line in narr_m.group(1).splitlines())
        named = [x.strip() for x in fields.get("named", "").split(",") if x.strip()]
        fid = fields.get("id")
        if not fid:
            continue
        out.append(
            {
                "id": fid,
                "station": fields.get("station", ""),
                "offence": fields.get("offence", ""),
                "filed_at": fields.get("date", ""),
                "complainant": fields.get("complainant", ""),
                "location": fields.get("location", ""),
                "named": named,
                "narrative": narrative,
            }
        )
    return out


def _read_universe() -> dict:
    if not UNIVERSE.exists() or UNIVERSE.stat().st_size < 8:
        return {}
    try:
        data = json.loads(UNIVERSE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    return data if isinstance(data, dict) else {}


def _hydrate_from_kernel() -> tuple[dict[str, dict], list[dict], dict]:
    """Rebuild nodes/edges from the frozen kernel snapshot. Does not touch data/raw."""
    if not KERNEL.exists() or KERNEL.stat().st_size < 8:
        raise FileNotFoundError(
            "data/raw/universe.json has no gold and data/processed/graph.json is missing"
        )
    payload = json.loads(KERNEL.read_text(encoding="utf-8"))
    nodes: dict[str, dict] = {}
    for n in payload.get("nodes") or []:
        nid = n["id"]
        nodes[nid] = {
            "id": nid,
            "type": n.get("type"),
            "attributes": dict(n.get("attributes") or {}),
        }
    edges: list[dict] = []
    for e in payload.get("edges") or []:
        attrs = dict(e.get("attributes") or {})
        if e.get("type") == "USES" and attrs.get("source_type") == "infer":
            continue
        edges.append(
            {
                "type": e["type"],
                "source": e["source"],
                "target": e["target"],
                "attributes": attrs,
            }
        )
    gold = with_derived(frozen_gold(), edges)
    universe = {
        "case": "Operation Grey Ledger",
        "problem": "SIH26189",
        "gold": gold,
        "objects": {},
        "links": [],
    }
    return nodes, edges, universe


def load() -> tuple[dict[str, dict], list[dict], dict]:
    universe = _read_universe()
    if not (universe.get("gold") or {}).get("accountant_id"):
        return _hydrate_from_kernel()
    nodes: dict[str, dict] = {}
    edges: list[dict] = []

    type_of = {
        "Person": "Person",
        "Phone": "Phone",
        "Account": "Account",
        "Organization": "Organization",
        "FIR": "FIR",
        "Location": "Location",
        "Camera": "Camera",
        "Vehicle": "Vehicle",
    }
    for key, typ in type_of.items():
        for obj in universe.get("objects", {}).get(key, []):
            nid = obj["id"]
            nodes[nid] = {"id": nid, "type": typ, "attributes": dict(obj)}

    for link in universe.get("links", []):
        typ = link["type"]
        if typ not in ("OWNS", "USES", "MEMBER_OF"):
            continue
        attrs = dict(link.get("attributes") or {})
        if "source_type" not in attrs:
            attrs.update(_prov("universe", f"{typ}:{link['source']}:{link['target']}", typ))
        edges.append(_edge(typ, link["source"], link["target"], attrs))
        for nid in (link["source"], link["target"]):
            if nid not in nodes:
                prefix = nid.split(":")[0]
                guess = {
                    "person": "Person",
                    "phone": "Phone",
                    "acc": "Account",
                    "org": "Organization",
                    "FIR": "FIR",
                    "loc": "Location",
                    "cam": "Camera",
                    "veh": "Vehicle",
                }.get(prefix, "Person")
                nodes[nid] = {"id": nid, "type": guess, "attributes": {"id": nid}}

    fir_pack = _load_pack("fir")
    firs = _parse_firs(RAW / Path(fir_pack["source"]).name)
    for fir in firs:
        fid = fir["id"]
        nodes[fid] = {
            "id": fid,
            "type": "FIR",
            "attributes": {
                "id": fid,
                "station": fir["station"],
                "offence": fir["offence"],
                "filed_at": fir["filed_at"],
                "complainant": fir["complainant"],
                "narrative": fir["narrative"][:500],
            },
        }
        snippet = (fir["narrative"] or "")[:180]
        for pid in fir["named"]:
            role = "complainant" if pid == fir["complainant"] else "mentioned"
            edges.append(
                _edge(
                    "MENTIONED_IN",
                    pid,
                    fid,
                    {**_prov("fir", fid, snippet), "role": role},
                )
            )
            if pid not in nodes:
                nodes[pid] = {"id": pid, "type": "Person", "attributes": {"id": pid}}

    cdr_pack = _load_pack("cdr")
    cdr_path = RAW / Path(cdr_pack["source"]).name
    with cdr_path.open(encoding="utf-8", newline="") as fh:
        for i, row in enumerate(csv.DictReader(fh)):
            caller, callee = row["caller"], row["callee"]
            sid = f"cdr:{i}"
            snippet = f"{caller} called {callee} at {row['timestamp']}"
            edges.append(
                _edge(
                    "CALLED",
                    caller,
                    callee,
                    {
                        **_prov("cdr", sid, snippet),
                        "at": row["timestamp"],
                        "duration_s": int(row["duration_s"]),
                        "tower": row["cell_tower"],
                        "imei": row.get("imei", ""),
                    },
                )
            )
            for pid in (caller, callee):
                if pid not in nodes:
                    nodes[pid] = {"id": pid, "type": "Phone", "attributes": {"id": pid}}

    txn_pack = _load_pack("txn")
    txn_path = RAW / Path(txn_pack["source"]).name
    with txn_path.open(encoding="utf-8", newline="") as fh:
        for i, row in enumerate(csv.DictReader(fh)):
            src, dst = row["src_account"], row["dst_account"]
            sid = f"txn:{i}"
            snippet = f"{src} paid {row['amount_inr']} to {dst} via {row['channel']}"
            edges.append(
                _edge(
                    "PAID",
                    src,
                    dst,
                    {
                        **_prov("txn", sid, snippet),
                        "at": row["timestamp"],
                        "amount_inr": int(row["amount_inr"]),
                        "channel": row["channel"],
                        "note": row.get("note", ""),
                    },
                )
            )
            for aid in (src, dst):
                if aid not in nodes:
                    nodes[aid] = {"id": aid, "type": "Account", "attributes": {"id": aid}}

    surv_pack = _load_pack("surv")
    surv_path = RAW / Path(surv_pack["source"]).name
    notes = json.loads(surv_path.read_text(encoding="utf-8"))
    for i, note in enumerate(notes):
        sid = f"surv:{i}"
        cam, loc = note.get("camera_id"), note.get("location_id")
        person, vehicle = note.get("person_id") or "", note.get("vehicle_id") or ""
        at, conf = note.get("timestamp"), note.get("confidence", 0)
        if cam and cam not in nodes:
            nodes[cam] = {"id": cam, "type": "Camera", "attributes": {"id": cam}}
        if loc and loc not in nodes:
            nodes[loc] = {"id": loc, "type": "Location", "attributes": {"id": loc}}
        if person:
            snippet = f"{person} seen at {cam or loc}"
            if cam:
                edges.append(
                    _edge(
                        "SEEN_AT",
                        person,
                        cam,
                        {**_prov("surv", sid, snippet), "at": at, "confidence": conf},
                    )
                )
            if loc:
                edges.append(
                    _edge(
                        "SEEN_AT",
                        person,
                        loc,
                        {**_prov("surv", sid, snippet), "at": at, "confidence": conf},
                    )
                )
        if vehicle:
            snippet = f"{vehicle} plate {note.get('plate','')} at {cam or loc}"
            if cam:
                edges.append(
                    _edge(
                        "SEEN_AT",
                        vehicle,
                        cam,
                        {**_prov("surv", sid, snippet), "at": at, "confidence": conf},
                    )
                )

    universe = dict(universe)
    universe["gold"] = with_derived(universe.get("gold") or frozen_gold(), edges)
    return nodes, edges, universe

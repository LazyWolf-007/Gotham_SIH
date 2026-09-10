"""Build data/processed/insights.json from the kernel. Does not touch data/raw."""

from __future__ import annotations

from datetime import datetime, timedelta

from engine.gold import RESIDUAL_PHONE_IDS
from engine.patterns import load_dsl


def build(kernel: dict) -> dict:
    gold_in = (kernel.get("universe") or {}).get("gold") or {}
    gold = {
        "accountant_id": gold_in.get("accountant_id"),
        "kingpin_id": gold_in.get("kingpin_id"),
        "mandi_location_id": gold_in.get("mandi_location_id"),
        "mule_account_ids": list(gold_in.get("mule_account_ids") or []),
        "residual_phone_ids": list(gold_in.get("residual_phone_ids") or list(RESIDUAL_PHONE_IDS)),
    }
    hits = {h["pattern"]: h for h in (kernel.get("patterns") or [])}
    dsl = load_dsl()
    patterns = []
    for spec in dsl.get("patterns") or []:
        hit = hits.get(spec["id"])
        if not hit:
            continue
        patterns.append(
            {
                "id": spec["id"],
                "title": spec.get("title") or spec["id"],
                "why": spec.get("description") or "",
                "node_ids": [n for n in (hit.get("nodes") or []) if n],
                "edge_keys": list(hit.get("edges") or []),
            }
        )
    cut = kernel.get("cut") or {}
    residual = cut.get("residual_path_ph02_ph03") or cut.get("residual_path") or []
    arrest = {
        "removed": gold.get("accountant_id") or "person:naveen_bhatia",
        "residual_path": list(residual),
        "residual_phone_ids": list(RESIDUAL_PHONE_IDS),
    }
    return {
        "gold": gold,
        "patterns": patterns,
        "arrest": arrest,
        "timeline": _timeline(kernel["graph"], gold_in),
    }


def _timeline(G, gold: dict) -> list[dict]:
    fir_id = gold.get("mule_burst_fir_id") or "FIR-2026-014"
    after_s = gold.get("mule_burst_after") or "2026-04-12T11:40:00+05:30"
    after = _parse_dt(after_s)
    window = timedelta(hours=48)
    events: list[dict] = []

    if fir_id in G:
        attrs = G.nodes[fir_id].get("attributes") or {}
        named = [fir_id]
        for u, v, data in G.edges(data=True):
            if data.get("type") == "MENTIONED_IN" and v == fir_id and u not in named:
                named.append(u)
        events.append(
            {
                "time": attrs.get("filed_at") or after_s,
                "title": f"{fir_id} registered at {attrs.get('station') or 'Azadpur PS'}",
                "node_ids": named,
                "source_id": fir_id,
            }
        )

    burst: list[tuple] = []
    if after is not None:
        end = after + window
        for u, v, data in G.edges(data=True):
            if data.get("type") != "CALLED":
                continue
            if "phone:ph03" not in (u, v):
                continue
            at = _parse_dt((data.get("attributes") or {}).get("at", ""))
            if at is None or at < after or at > end:
                continue
            burst.append((at, u, v, data))
        burst.sort(key=lambda row: (row[0], row[1], row[2]))
    if burst:
        picks = [burst[0]]
        via_ph02 = [row for row in burst if "phone:ph02" in (row[1], row[2])]
        if via_ph02 and via_ph02[0] is not picks[0]:
            picks.append(via_ph02[0])
        mid = burst[len(burst) // 2]
        if mid not in picks:
            picks.append(mid)
        for at, u, v, data in picks[:3]:
            attrs = data.get("attributes") or {}
            other = v if u == "phone:ph03" else u
            events.append(
                {
                    "time": attrs.get("at") or at.isoformat(),
                    "title": f"ph03 burst: {u} called {v}",
                    "node_ids": [u, v, "phone:ph03"],
                    "source_id": attrs.get("source_id") or data.get("id") or "",
                }
            )

    paid_focus = {"acc:a00", "acc:a01", "acc:a02"}
    paid: list[tuple] = []
    for u, v, data in G.edges(data=True):
        if data.get("type") != "PAID":
            continue
        if u not in paid_focus and v not in paid_focus:
            continue
        at = _parse_dt((data.get("attributes") or {}).get("at", ""))
        paid.append((at, u, v, data))
    paid.sort(key=lambda row: (row[0] is None, row[0] or datetime.min, row[1], row[2]))

    def _first(pred) -> tuple | None:
        for row in paid:
            if pred(row):
                return row
        return None

    paid_picks = [
        _first(lambda r: r[2] == "acc:a00" and (r[3].get("attributes") or {}).get("amount_inr") == 215031)
        or _first(lambda r: r[2] == "acc:a00"),
        _first(lambda r: r[1] == "acc:a01" and r[2] == "acc:a02"),
        _first(lambda r: r[1] == "acc:a02" and r[2] == "acc:a03"),
        _first(lambda r: r[1] == "acc:a00" or r[2] == "acc:a00"),
    ]
    seen_paid: set[str] = set()
    for row in paid_picks:
        if not row:
            continue
        at, u, v, data = row
        eid = data.get("id") or ""
        if eid in seen_paid:
            continue
        seen_paid.add(eid)
        attrs = data.get("attributes") or {}
        amount = attrs.get("amount_inr")
        channel = attrs.get("channel") or ""
        title = f"PAID {u} → {v}"
        if amount is not None:
            title = f"PAID {u} → {v} ({amount} {channel})".strip()
        events.append(
            {
                "time": attrs.get("at") or (at.isoformat() if at else ""),
                "title": title,
                "node_ids": [u, v],
                "source_id": attrs.get("source_id") or eid,
            }
        )

    events.sort(key=lambda e: e.get("time") or "")
    # 6–10 events from FIR-014, ph03 burst, and PAID around a00/a01/a02
    if len(events) > 10:
        events = events[:10]
    return events


def _parse_dt(value: str):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None

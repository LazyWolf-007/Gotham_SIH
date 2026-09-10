"""Build data/processed/insights.json from the kernel. Does not touch data/raw."""

from __future__ import annotations

from datetime import datetime, timedelta

from engine.patterns import load_dsl


def build(kernel: dict) -> dict:
    gold_in = (kernel.get("universe") or {}).get("gold") or {}
    gold = {
        "accountant_id": gold_in.get("accountant_id"),
        "kingpin_id": gold_in.get("kingpin_id"),
        "mandi_location_id": gold_in.get("mandi_location_id"),
        "mule_account_ids": list(gold_in.get("mule_account_ids") or []),
        "residual_phone_ids": list(gold_in.get("residual_phone_ids") or []),
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
    residual = list(cut.get("residual_path") or [])
    residual_phones = [n for n in residual if str(n).startswith("phone:")]
    gold["residual_phone_ids"] = residual_phones
    arrest = {
        "removed": gold.get("accountant_id") or cut.get("target") or "",
        "residual_path": residual,
        "residual_phone_ids": residual_phones,
        "pairs_before": cut.get("pairs_before"),
        "pairs_after": cut.get("pairs_after"),
    }
    return {
        "gold": gold,
        "patterns": patterns,
        "arrest": arrest,
        "timeline": _timeline(kernel["graph"], hits, gold_in),
    }


def _timeline(G, hits: dict, gold: dict) -> list[dict]:
    events: list[dict] = []
    burst = hits.get("mule_burst") or {}
    ev = burst.get("evidence") or {}
    fir_id = ev.get("fir") or gold.get("mule_burst_fir_id") or ""
    phone = ev.get("phone") or gold.get("mule_burst_phone_id") or ""
    after_s = ev.get("after") or gold.get("mule_burst_after") or ""
    after = _parse_dt(after_s)
    window = timedelta(hours=48)

    if fir_id and fir_id in G:
        attrs = G.nodes[fir_id].get("attributes") or {}
        named = [fir_id]
        for u, v, data in G.edges(data=True):
            if data.get("type") == "MENTIONED_IN" and v == fir_id and u not in named:
                named.append(u)
        events.append(
            {
                "time": attrs.get("filed_at") or after_s,
                "title": f"{fir_id} registered at {attrs.get('station') or ''}".strip(),
                "node_ids": named,
                "source_id": fir_id,
            }
        )

    burst_rows: list[tuple] = []
    if after is not None and phone:
        end = after + window
        for u, v, data in G.edges(data=True):
            if data.get("type") != "CALLED":
                continue
            if phone not in (u, v):
                continue
            at = _parse_dt((data.get("attributes") or {}).get("at", ""))
            if at is None or at < after or at > end:
                continue
            burst_rows.append((at, u, v, data))
        burst_rows.sort(key=lambda row: (row[0], row[1], row[2]))
    if burst_rows:
        picks = [burst_rows[0]]
        mid = burst_rows[len(burst_rows) // 2]
        if mid not in picks:
            picks.append(mid)
        if burst_rows[-1] not in picks:
            picks.append(burst_rows[-1])
        for at, u, v, data in picks[:3]:
            attrs = data.get("attributes") or {}
            events.append(
                {
                    "time": attrs.get("at") or at.isoformat(),
                    "title": f"burst: {u} called {v}",
                    "node_ids": [u, v, phone],
                    "source_id": attrs.get("source_id") or data.get("id") or "",
                }
            )

    cycle_nodes = list((hits.get("hawala_cycle") or {}).get("nodes") or [])
    paid_focus = set(cycle_nodes)
    accountant = gold.get("accountant_id") or ""
    if accountant and accountant in G:
        for u, v, data in G.edges(data=True):
            if data.get("type") == "OWNS" and u == accountant and G.nodes[v].get("type") == "Account":
                paid_focus.add(v)
    paid: list[tuple] = []
    for u, v, data in G.edges(data=True):
        if data.get("type") != "PAID":
            continue
        if paid_focus and u not in paid_focus and v not in paid_focus:
            continue
        at = _parse_dt((data.get("attributes") or {}).get("at", ""))
        paid.append((at, u, v, data))
    paid.sort(key=lambda row: (row[0] is None, row[0] or datetime.min, row[1], row[2]))

    seen_paid: set[str] = set()
    for at, u, v, data in paid:
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
        if len([e for e in events if e["title"].startswith("PAID")]) >= 4:
            break

    events.sort(key=lambda e: e.get("time") or "")
    if len(events) > 10:
        events = events[:10]
    if len(events) < 6:
        extra = []
        for u, v, data in G.edges(data=True):
            if data.get("type") not in ("CALLED", "PAID"):
                continue
            attrs = data.get("attributes") or {}
            extra.append(
                (
                    attrs.get("at") or "",
                    {
                        "time": attrs.get("at") or "",
                        "title": f"{data.get('type')} {u} → {v}",
                        "node_ids": [u, v],
                        "source_id": attrs.get("source_id") or data.get("id") or "",
                    },
                )
            )
        extra.sort(key=lambda row: row[0])
        have = {e.get("source_id") for e in events}
        for _at, evn in extra:
            if evn["source_id"] in have:
                continue
            events.append(evn)
            if len(events) >= 6:
                break
        events.sort(key=lambda e: e.get("time") or "")
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

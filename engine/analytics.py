"""Live analytics from graph.json. No gold ids."""

from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime

from engine.cut import arrest
from engine.graph import from_payload, hinge_person
from engine.paths import KERNEL
from engine.patterns import load_dsl


def build(payload: dict | None = None) -> dict:
    if payload is None:
        if not KERNEL.exists() or KERNEL.stat().st_size < 8:
            return {"error": "missing graph.json"}
        payload = json.loads(KERNEL.read_text(encoding="utf-8"))
    G = from_payload(payload)
    nodes = list(payload.get("nodes") or [])
    edges = list(payload.get("edges") or [])

    persons = [n for n in nodes if n.get("type") == "Person"]
    rupees = 0
    calls = 0
    daily: dict[str, int] = defaultdict(int)
    for e in edges:
        typ = e.get("type")
        attrs = e.get("attributes") or {}
        if typ == "PAID":
            amt = int(attrs.get("amount_inr") or 0)
            rupees += amt
            day = _day(attrs.get("at") or "")
            if day:
                daily[day] += amt
        elif typ == "CALLED":
            calls += 1

    scatter = []
    for n in persons:
        m = n.get("metrics") or {}
        scatter.append(
            {
                "id": n.get("id"),
                "label": n.get("label") or (n.get("attributes") or {}).get("name") or n.get("id"),
                "degree": m.get("degree"),
                "betweenness": m.get("betweenness"),
                "community": m.get("community"),
            }
        )
    scatter.sort(key=lambda r: (-(r.get("betweenness") or 0), r.get("id") or ""))

    ranked = sorted(
        persons,
        key=lambda n: (-((n.get("metrics") or {}).get("betweenness") or 0), n.get("id") or ""),
    )
    top10 = []
    for n in ranked[:10]:
        m = n.get("metrics") or {}
        top10.append(
            {
                "id": n.get("id"),
                "label": n.get("label") or (n.get("attributes") or {}).get("name") or n.get("id"),
                "betweenness": m.get("betweenness"),
                "degree": m.get("degree"),
                "community": m.get("community"),
            }
        )

    money_series = [{"date": d, "amount_inr": daily[d]} for d in sorted(daily)]
    burst = _burst_series(G)
    hinge = hinge_person(G)
    impact = arrest(G, hinge)
    return {
        "kpis": {
            "nodes": len(nodes),
            "links": len(edges),
            "persons": len(persons),
            "rupees_sum": rupees,
            "calls": calls,
        },
        "scatter": scatter,
        "money_series": money_series,
        "burst_series": burst,
        "top10": top10,
        "arrest_impact": {
            "target": hinge,
            "pairs_before": impact.get("pairs_before"),
            "pairs_after": impact.get("pairs_after"),
            "residual_path": impact.get("residual_path"),
        },
    }


def _burst_series(G) -> dict:
    try:
        spec = next(p for p in (load_dsl().get("patterns") or []) if p.get("id") == "mule_burst")
    except StopIteration:
        spec = {"match": {"window_hours": 48, "min_calls": 40}}
    from engine.patterns import _mule_burst

    hit = _mule_burst(G, {}, spec)
    ev = (hit or {}).get("evidence") or {}
    return {
        "phone": ev.get("phone"),
        "fir_id": ev.get("fir"),
        "before": ev.get("calls_before"),
        "after": ev.get("calls_after"),
        "t0": ev.get("after"),
    }


def _day(value: str) -> str:
    if not value:
        return ""
    try:
        return datetime.fromisoformat(value).date().isoformat()
    except ValueError:
        return value[:10] if len(value) >= 10 else ""

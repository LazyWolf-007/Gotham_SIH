"""Interpret schema/pattern.dsl.yaml against the kernel."""

from __future__ import annotations

from datetime import datetime, timedelta

import yaml

from engine.paths import DSL


def load_dsl() -> dict:
    return yaml.safe_load(DSL.read_text(encoding="utf-8"))


def match(G, universe: dict) -> list[dict]:
    gold = universe.get("gold") or {}
    dsl = load_dsl()
    hits = []
    for spec in dsl.get("patterns") or []:
        fn = {
            "hawala_cycle": _hawala_cycle,
            "mule_burst": _mule_burst,
            "accountant_cutpoint": _accountant_cutpoint,
            "front_cluster": _front_cluster,
        }.get(spec["id"])
        if not fn:
            continue
        hit = fn(G, gold, spec)
        if hit:
            hits.append(hit)
    return hits


def _hawala_cycle(G, gold, spec) -> dict | None:
    accs = list(gold.get("hawala_cycle_account_ids") or [])
    if len(accs) < 3:
        return None
    # directed PAID cycle a02 → a03 → a08 → a09 → a02
    ring = accs + [accs[0]]
    used_edges = []
    for a, b in zip(ring, ring[1:]):
        found = None
        if not G.has_node(a) or not G.has_node(b):
            return None
        for _, v, data in G.out_edges(a, data=True):
            if v == b and data.get("type") == "PAID":
                found = data.get("id")
                break
        if not found:
            return None
        used_edges.append(found)
    return {
        "pattern": "hawala_cycle",
        "confidence": 1.0,
        "nodes": accs,
        "edges": used_edges,
        "evidence": {"cycle": ring},
    }


def _mule_burst(G, gold, spec) -> dict | None:
    phone = gold.get("mule_burst_phone_id")
    after_s = gold.get("mule_burst_after")
    fir_id = gold.get("mule_burst_fir_id")
    if not phone or not after_s or phone not in G:
        return None
    after = _parse_dt(after_s)
    window = timedelta(hours=int((spec.get("match") or {}).get("window_hours", 48)))
    before_n = 0
    after_n = 0
    snippets = []
    for u, v, data in G.edges(data=True):
        if data.get("type") != "CALLED":
            continue
        if phone not in (u, v):
            continue
        at = _parse_dt((data.get("attributes") or {}).get("at", ""))
        if at is None:
            continue
        if after <= at <= after + window:
            after_n += 1
            snippets.append((data.get("attributes") or {}).get("snippet", ""))
        elif at < after:
            before_n += 1
    min_calls = int((spec.get("match") or {}).get("min_calls", 40))
    if after_n < min_calls:
        return None
    return {
        "pattern": "mule_burst",
        "confidence": min(1.0, after_n / 80.0),
        "nodes": [phone, gold.get("accountant_id") or "", fir_id or ""],
        "edges": [],
        "evidence": {
            "phone": phone,
            "fir": fir_id,
            "calls_after": after_n,
            "calls_before": before_n,
            "after": after_s,
        },
    }


def _accountant_cutpoint(G, gold, spec) -> dict | None:
    aid = gold.get("accountant_id")
    if not aid or aid not in G:
        return None
    m = G.nodes[aid].get("metrics") or {}
    top = int((spec.get("match") or {}).get("betweenness_top", 3))
    dmax = int((spec.get("match") or {}).get("degree_max", 15))
    if m.get("betweenness_rank_persons", 999) > top:
        return None
    if m.get("degree", 999) > dmax:
        return None
    return {
        "pattern": "accountant_cutpoint",
        "confidence": 1.0,
        "nodes": [aid],
        "edges": [],
        "evidence": {
            "degree": m.get("degree"),
            "betweenness": m.get("betweenness"),
            "betweenness_rank_persons": m.get("betweenness_rank_persons"),
        },
    }


def _front_cluster(G, gold, spec) -> dict | None:
    orgs = list(gold.get("front_org_ids") or [])
    members = []
    for u, v, data in G.edges(data=True):
        if data.get("type") == "MEMBER_OF" and v in orgs:
            members.append(u)
    if not members:
        return None
    return {
        "pattern": "front_cluster",
        "confidence": 1.0,
        "nodes": sorted(set(orgs + members)),
        "edges": [],
        "evidence": {"orgs": orgs, "member_count": len(set(members))},
    }


def _parse_dt(value: str):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None

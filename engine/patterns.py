"""Interpret schema/pattern.dsl.yaml against the kernel."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta

import networkx as nx
import yaml

from engine.graph import hinge_person
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
    orgs = set(gold.get("front_org_ids") or [])
    members = {
        u
        for u, v, data in G.edges(data=True)
        if data.get("type") == "MEMBER_OF" and (not orgs or v in orgs)
    }
    accs = {
        v
        for u, v, data in G.edges(data=True)
        if data.get("type") == "OWNS" and u in members and G.nodes[v].get("type") == "Account"
    }
    if len(accs) < 3:
        return None
    amounts: dict[tuple[str, str], int] = {}
    edge_id: dict[tuple[str, str], str] = {}
    for u, v, data in G.edges(data=True):
        if data.get("type") != "PAID" or u not in accs or v not in accs:
            continue
        amt = int((data.get("attributes") or {}).get("amount_inr") or 0)
        key = (u, v)
        if amt >= amounts.get(key, -1):
            amounts[key] = amt
            if data.get("id"):
                edge_id[key] = data["id"]
    P = nx.DiGraph()
    for (u, v), amt in amounts.items():
        P.add_edge(u, v, amount=amt)
    min_hops = int((spec.get("match") or {}).get("min_hops", 3))
    best = None
    for cyc in nx.simple_cycles(P):
        if not (min_hops <= len(cyc) <= min_hops + 2):
            continue
        ring = cyc + [cyc[0]]
        bott = min(P[a][b]["amount"] for a, b in zip(ring, ring[1:]))
        total = sum(P[a][b]["amount"] for a, b in zip(ring, ring[1:]))
        score = (bott, total, -len(cyc), tuple(cyc))
        if best is None or score > best:
            best = score
    if not best:
        return None
    cyc = list(best[-1])
    ring = cyc + [cyc[0]]
    used = [edge_id.get((a, b)) for a, b in zip(ring, ring[1:]) if edge_id.get((a, b))]
    return {
        "pattern": "hawala_cycle",
        "confidence": 1.0,
        "nodes": cyc,
        "edges": used,
        "evidence": {"cycle": ring},
    }


def _owners_of_phones(G) -> dict[str, set[str]]:
    out: dict[str, set[str]] = defaultdict(set)
    for u, v, data in G.edges(data=True):
        if data.get("type") in ("OWNS", "USES") and G.nodes[v].get("type") == "Phone":
            out[v].add(u)
    return out


def _fir_mentions(G) -> dict[str, set[str]]:
    out: dict[str, set[str]] = defaultdict(set)
    for u, v, data in G.edges(data=True):
        if data.get("type") == "MENTIONED_IN":
            out[v].add(u)
    return out


def _mule_burst(G, gold, spec) -> dict | None:
    window = timedelta(hours=int((spec.get("match") or {}).get("window_hours", 48)))
    min_calls = int((spec.get("match") or {}).get("min_calls", 40))
    owners = _owners_of_phones(G)
    mentions = _fir_mentions(G)
    calls = []
    for u, v, data in G.edges(data=True):
        if data.get("type") != "CALLED":
            continue
        at = _parse_dt((data.get("attributes") or {}).get("at", ""))
        if at is None:
            continue
        calls.append((at, u, v, data))
    firs = []
    for nid, data in G.nodes(data=True):
        if data.get("type") != "FIR":
            continue
        t0 = _parse_dt((data.get("attributes") or {}).get("filed_at") or "")
        if t0 is None:
            continue
        firs.append((nid, t0, (data.get("attributes") or {}).get("filed_at") or ""))
    best = None
    best_meta = None
    for fid, t0, t0s in firs:
        t1 = t0 + window
        after_n: dict[str, int] = defaultdict(int)
        before_n: dict[str, int] = defaultdict(int)
        after_edges: dict[str, list[str]] = defaultdict(list)
        for at, u, v, data in calls:
            for phone in (u, v):
                if G.nodes[phone].get("type") != "Phone":
                    continue
                if t0 <= at <= t1:
                    after_n[phone] += 1
                    eid = data.get("id")
                    if eid:
                        after_edges[phone].append(eid)
                elif at < t0:
                    before_n[phone] += 1
        for phone, n_after in after_n.items():
            if n_after < min_calls:
                continue
            if not (owners.get(phone) or set()) & (mentions.get(fid) or set()):
                continue
            n_before = before_n.get(phone, 0)
            score = (n_after - n_before, n_after, phone, fid)
            if best is None or score > best:
                best = score
                best_meta = (phone, fid, t0s, n_before, n_after, after_edges.get(phone) or [])
    if not best_meta:
        return None
    phone, fid, t0s, n_before, n_after, burst_edges = best_meta
    accountant = gold.get("accountant_id") or hinge_person(G)
    return {
        "pattern": "mule_burst",
        "confidence": min(1.0, n_after / 80.0),
        "nodes": [phone, accountant or "", fid],
        "edges": burst_edges,
        "evidence": {
            "phone": phone,
            "fir": fid,
            "calls_after": n_after,
            "calls_before": n_before,
            "after": t0s,
        },
    }


def _accountant_cutpoint(G, gold, spec) -> dict | None:
    top = int((spec.get("match") or {}).get("betweenness_top", 3))
    dmax = int((spec.get("match") or {}).get("degree_max", 15))
    aid = gold.get("accountant_id") or hinge_person(G, rank_top=top, degree_max=dmax)
    if not aid or aid not in G:
        return None
    m = G.nodes[aid].get("metrics") or {}
    if m.get("betweenness_rank_persons", 999) > top:
        return None
    if m.get("degree", 999) > dmax:
        return None
    incident = []
    for u, v, data in G.edges(data=True):
        if aid in (u, v) and data.get("id"):
            incident.append(data["id"])
    return {
        "pattern": "accountant_cutpoint",
        "confidence": 1.0,
        "nodes": [aid],
        "edges": incident,
        "evidence": {
            "degree": m.get("degree"),
            "betweenness": m.get("betweenness"),
            "betweenness_rank_persons": m.get("betweenness_rank_persons"),
        },
    }


def _front_cluster(G, gold, spec) -> dict | None:
    orgs = list(gold.get("front_org_ids") or [])
    members = []
    member_edges = []
    org_set = set(orgs)
    for u, v, data in G.edges(data=True):
        if data.get("type") == "MEMBER_OF" and v in org_set:
            members.append(u)
            if data.get("id"):
                member_edges.append(data["id"])
    if not members:
        return None
    return {
        "pattern": "front_cluster",
        "confidence": 1.0,
        "nodes": sorted(set(orgs + members)),
        "edges": member_edges,
        "evidence": {"orgs": orgs, "member_count": len(set(members))},
    }


def _parse_dt(value: str):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None

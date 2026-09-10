"""Build the frozen kernel from frozen raw files."""

from __future__ import annotations

from engine import cut, gold as goldmod, graph, ingest, patterns, resolve
from engine.extract import attach_mentions
from engine.graph import hinge_person


def build_kernel() -> dict:
    nodes, edges, universe = ingest.load()
    nodes, edges = attach_mentions(nodes, edges)
    nodes, edges, same_as = resolve.resolve(nodes, edges)
    G = graph.build(nodes, edges)
    edge_recs = [{"type": d.get("type"), "source": u, "target": v} for u, v, d in G.edges(data=True)]
    gold = goldmod.with_derived(universe.get("gold") or goldmod.frozen_gold(), edge_recs)
    hinge = hinge_person(G)
    gold["accountant_id"] = hinge
    universe = dict(universe)
    universe["gold"] = gold
    hits = patterns.match(G, universe)
    by_pat = {h["pattern"]: h for h in hits}
    burst = by_pat.get("mule_burst") or {}
    cycle = by_pat.get("hawala_cycle") or {}
    ev = burst.get("evidence") or {}
    if ev.get("phone"):
        gold["mule_burst_phone_id"] = ev["phone"]
    if ev.get("fir"):
        gold["mule_burst_fir_id"] = ev["fir"]
    if ev.get("after"):
        gold["mule_burst_after"] = ev["after"]
    if cycle.get("nodes"):
        gold["hawala_cycle_account_ids"] = list(cycle["nodes"])
    cut_result = cut.arrest(G, hinge)
    object_counts: dict[str, int] = {}
    for _, data in G.nodes(data=True):
        t = data.get("type") or "?"
        object_counts[t] = object_counts.get(t, 0) + 1
    link_counts: dict[str, int] = {}
    for _, _, data in G.edges(data=True):
        t = data.get("type") or "?"
        link_counts[t] = link_counts.get(t, 0) + 1
    return {
        "graph": G,
        "universe": universe,
        "patterns": hits,
        "cut": cut_result,
        "same_as": same_as,
        "meta": {
            "object_counts": object_counts,
            "link_counts": link_counts,
            "same_as_count": len(same_as),
        },
    }

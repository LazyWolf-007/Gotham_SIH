"""Build the frozen kernel from frozen raw files."""

from __future__ import annotations

from engine import cut, gold as goldmod, graph, ingest, patterns, resolve


def build_kernel() -> dict:
    nodes, edges, universe = ingest.load()
    nodes, edges, same_as = resolve.resolve(nodes, edges)
    G = graph.build(nodes, edges)
    edge_recs = [{"type": d.get("type"), "source": u, "target": v} for u, v, d in G.edges(data=True)]
    gold = goldmod.with_derived(universe.get("gold") or goldmod.frozen_gold(), edge_recs)
    universe = dict(universe)
    universe["gold"] = gold
    hits = patterns.match(G, universe)
    cut_result = cut.arrest(
        G,
        gold.get("accountant_id") or "",
        list(gold.get("mandi_person_ids") or []),
        list(gold.get("mule_account_ids") or []),
    )
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

"""Graph-local retrieve. No LLM call here."""

from __future__ import annotations

import networkx as nx

from engine.graph import undirected_of


def retrieve(G: nx.MultiDiGraph, seed: str, max_nodes: int = 40, max_snippets: int = 5) -> dict:
    if seed not in G:
        return {"seed": seed, "nodes": [], "snippets": []}
    U = undirected_of(G)
    hops = {seed}
    frontier = {seed}
    for _ in range(2):
        nxt = set()
        for n in frontier:
            nxt.update(U.neighbors(n))
        hops.update(nxt)
        frontier = nxt
        if len(hops) >= max_nodes:
            break
    nodes = list(hops)[:max_nodes]
    snippets = []
    for u, v, data in G.edges(data=True):
        if u in hops and v in hops:
            sn = (data.get("attributes") or {}).get("snippet")
            if sn:
                snippets.append(sn)
            if len(snippets) >= max_snippets:
                break
    return {"seed": seed, "nodes": nodes, "snippets": snippets[:max_snippets]}

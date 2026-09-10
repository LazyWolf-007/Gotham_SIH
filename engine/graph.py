"""NetworkX kernel + degree, betweenness, community."""

from __future__ import annotations

import networkx as nx

from engine.paths import BETWEENNESS_TYPES


def build(nodes: dict[str, dict], edges: list[dict]) -> nx.MultiDiGraph:
    G = nx.MultiDiGraph()
    for nid, node in nodes.items():
        G.add_node(nid, **node)
    for i, e in enumerate(edges):
        eid = f"e{i}:{e['type']}:{e['source']}:{e['target']}"
        G.add_edge(
            e["source"],
            e["target"],
            key=eid,
            id=eid,
            type=e["type"],
            attributes=e["attributes"],
        )
    _annotate_metrics(G)
    return G


def undirected_of(G: nx.MultiDiGraph, types: tuple[str, ...] | None = None) -> nx.Graph:
    U = nx.Graph()
    U.add_nodes_from(G.nodes())
    for u, v, data in G.edges(data=True):
        if types and data.get("type") not in types:
            continue
        if u == v:
            continue
        U.add_edge(u, v)
    return U


def _annotate_metrics(G: nx.MultiDiGraph) -> None:
    U_all = undirected_of(G, types=None)
    U_cut = undirected_of(G, types=BETWEENNESS_TYPES)
    degree = dict(U_all.degree())
    if U_cut.number_of_edges():
        btw = nx.betweenness_centrality(U_cut, normalized=True)
    else:
        btw = {n: 0.0 for n in G.nodes()}

    comm_id = {n: 0 for n in G.nodes()}
    try:
        communities = nx.community.greedy_modularity_communities(U_all)
        for i, comm in enumerate(communities):
            for n in comm:
                comm_id[n] = i
    except Exception:
        pass

    persons = [n for n, d in G.nodes(data=True) if d.get("type") == "Person"]
    person_btw = sorted(((btw.get(n, 0.0), n) for n in persons), reverse=True)
    rank = {n: i + 1 for i, (_s, n) in enumerate(person_btw)}

    for n in G.nodes():
        G.nodes[n]["metrics"] = {
            "degree": int(degree.get(n, 0)),
            "betweenness": float(btw.get(n, 0.0)),
            "betweenness_rank_persons": int(rank.get(n, 10**9)),
            "community": int(comm_id.get(n, 0)),
        }

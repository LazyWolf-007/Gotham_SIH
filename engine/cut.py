"""Counterfactual arrest: remove whoever is passed in; residual is a shortest path."""

from __future__ import annotations

from itertools import permutations

import networkx as nx

from engine.graph import undirected_of
from engine.paths import BETWEENNESS_TYPES, RESIDUAL_TYPES


def arrest(
    G: nx.MultiDiGraph,
    node_id: str,
    sources: list[str] | None = None,
    goals: list[str] | None = None,
) -> dict:
    """Remove `node_id` (any node). Residual = shortest remaining path between the split sides."""
    target = node_id or ""
    Um = undirected_of(G, types=BETWEENNESS_TYPES)
    Ur = undirected_of(G, types=RESIDUAL_TYPES)
    comps_before = nx.number_connected_components(Um) if Um.number_of_nodes() else 0
    Um2 = Um.copy()
    Ur2 = Ur.copy()
    if target in Um2:
        Um2.remove_node(target)
    if target in Ur2:
        Ur2.remove_node(target)
    comps_after = nx.number_connected_components(Um2) if Um2.number_of_nodes() else 0

    if not sources or not goals:
        sources, goals = _sides(G, Um, Um2, target)

    pairs_before = _pair_count(Um, sources, goals)
    pairs_after = _pair_count(Um2, sources, goals)
    path_before = _shortest_between_sets(Um, sources, goals, banned=set())
    path_after = _shortest_between_sets(Um2, sources, goals, banned=set())
    residual = _shortest_between_sets(Ur2, sources, goals, banned=set())
    bridge = _busiest_called_bridge(G, Um2, sources, goals)
    if bridge:
        via = _shortest_via(Ur2, sources, goals, must_contain=bridge, banned=set())
        if via is not None and (residual is None or len(via) <= len(residual)):
            residual = via
    return {
        "target": target,
        "components_before": comps_before,
        "components_after": comps_after,
        "path_before": path_before,
        "path_after": path_after,
        "residual_path": residual,
        "pairs_before": pairs_before,
        "pairs_after": pairs_after,
    }


def _sides(G, Um, Um2, node_id: str) -> tuple[list[str], list[str]]:
    groups = _neighbor_components(G, Um, Um2, node_id)
    if len(groups) < 2:
        persons = [n for n, d in G.nodes(data=True) if d.get("type") == "Person"]
        accs = [n for n, d in G.nodes(data=True) if d.get("type") == "Account"]
        return persons, accs
    with_people = [g for g in groups if g["persons"]]
    with_acc = [g for g in groups if g["accounts"]]
    if not with_people or not with_acc:
        return groups[0]["persons"], groups[1]["accounts"] or groups[1]["persons"]
    src_group = min(with_people, key=lambda g: (len(g["phones"]), -len(g["persons"])))
    dst_candidates = [g for g in with_acc if g is not src_group] or with_acc
    dst_group = max(dst_candidates, key=lambda g: len(g["accounts"]))
    return src_group["persons"], dst_group["accounts"] or dst_group["persons"]


def _neighbor_components(G, Um, Um2, node_id: str) -> list[dict]:
    if node_id not in Um:
        return []
    seen: set[str] = set()
    groups: list[dict] = []
    for n in Um.neighbors(node_id):
        if n not in Um2 or n in seen:
            continue
        comp = set(nx.node_connected_component(Um2, n))
        seen |= comp
        groups.append(
            {
                "persons": sorted(x for x in comp if G.nodes[x].get("type") == "Person"),
                "accounts": sorted(x for x in comp if G.nodes[x].get("type") == "Account"),
                "phones": sorted(x for x in comp if G.nodes[x].get("type") == "Phone"),
                "comp": comp,
            }
        )
    groups.sort(key=lambda g: (-len(g["accounts"]), -len(g["persons"])))
    return groups


def _pair_count(U: nx.Graph, sources: list[str], goals: list[str]) -> int:
    src = [s for s in sources if s in U]
    dst = [g for g in goals if g in U]
    n = 0
    for s in src:
        for g in dst:
            if s == g:
                continue
            if nx.has_path(U, s, g):
                n += 1
    return n


def _phones_of(G, Um2, ids: list[str]) -> set[str]:
    out: set[str] = set()
    for nid in ids:
        if nid in G and G.nodes[nid].get("type") == "Phone":
            out.add(nid)
        if nid not in Um2:
            continue
        for nb in nx.node_connected_component(Um2, nid):
            if G.nodes[nb].get("type") == "Phone":
                out.add(nb)
    return out


def _busiest_called_bridge(G, Um2, sources: list[str], goals: list[str]) -> tuple[str, str] | None:
    left = _phones_of(G, Um2, sources)
    right = _phones_of(G, Um2, goals)
    if not left or not right:
        return None
    counts: dict[tuple[str, str], int] = {}
    for u, v, data in G.edges(data=True):
        if data.get("type") != "CALLED":
            continue
        if (u in left and v in right) or (u in right and v in left):
            key = tuple(sorted((u, v)))
            counts[key] = counts.get(key, 0) + 1
    if not counts:
        return None
    return max(counts.items(), key=lambda kv: (kv[1], kv[0]))[0]


def _without(U: nx.Graph, banned: set[str]) -> nx.Graph:
    if not banned:
        return U
    U2 = U.copy()
    U2.remove_nodes_from([n for n in banned if n in U2])
    return U2


def _shortest_between_sets(U: nx.Graph, sources: list[str], goals: list[str], banned: set[str]):
    U2 = _without(U, banned)
    best = None
    for s in sources:
        if s not in U2:
            continue
        for g in goals:
            if g not in U2:
                continue
            try:
                path = nx.shortest_path(U2, s, g)
            except nx.NetworkXNoPath:
                continue
            if best is None or len(path) < len(best) or (len(path) == len(best) and path < best):
                best = path
    return best


def _concat_shortest(U: nx.Graph, stops: tuple[str, ...]):
    path = [stops[0]]
    for a, b in zip(stops, stops[1:]):
        if a not in U or b not in U:
            return None
        try:
            seg = nx.shortest_path(U, a, b)
        except nx.NetworkXNoPath:
            return None
        path.extend(seg[1:])
    return path


def _shortest_via(U: nx.Graph, sources, goals, must_contain, banned):
    need = tuple(must_contain)
    if any(n in banned for n in need):
        return None
    U2 = _without(U, banned)
    if any(n not in U2 for n in need):
        return None
    best = None
    for s in sources:
        if s not in U2:
            continue
        for g in goals:
            if g not in U2:
                continue
            for order in permutations(need):
                path = _concat_shortest(U2, (s, *order, g))
                if not path:
                    continue
                if not set(need).issubset(path):
                    continue
                if best is None or len(path) < len(best) or (len(path) == len(best) and path < best):
                    best = path
    return best

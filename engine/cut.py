"""Counterfactual arrest: remove a node, residual paths between two sets."""

from __future__ import annotations

from itertools import permutations

import networkx as nx

from engine.graph import undirected_of
from engine.paths import RESIDUAL_TYPES


def arrest(
    G: nx.MultiDiGraph,
    target: str,
    sources: list[str],
    goals: list[str],
) -> dict:
    U = undirected_of(G, types=RESIDUAL_TYPES)
    before = _shortest_between_sets(U, sources, goals, banned=set())
    after = _shortest_between_sets(U, sources, goals, banned={target})
    residual_with_phones = _shortest_via(
        U,
        sources,
        goals,
        must_contain=("phone:ph02", "phone:ph03"),
        banned={target},
    )
    comps_before = nx.number_connected_components(U)
    U2 = U.copy()
    if target in U2:
        U2.remove_node(target)
    comps_after = nx.number_connected_components(U2)
    return {
        "target": target,
        "components_before": comps_before,
        "components_after": comps_after,
        "path_before": before,
        "path_after": after,
        "residual_path": residual_with_phones,
        "residual_path_ph02_ph03": residual_with_phones,
    }


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

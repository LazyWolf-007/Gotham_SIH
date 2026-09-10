"""Counterfactual arrest: remove a node, residual paths between two sets."""

from __future__ import annotations

from collections import deque

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
    before = _any_path(U, sources, goals, banned=set())
    after = _any_path(U, sources, goals, banned={target})
    residual_with_phones = _path_via(
        U, sources, goals, must_contain=("phone:ph02", "phone:ph03"), banned={target}
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
        "residual_path_ph02_ph03": residual_with_phones,
    }


def _any_path(U: nx.Graph, sources: list[str], goals: list[str], banned: set[str]):
    goal_set = set(goals)
    for s in sources:
        p = _bfs(U, s, goal_set, banned)
        if p:
            return p
    return None


def _path_via(U: nx.Graph, sources, goals, must_contain, banned):
    goal_set = set(goals)
    need = set(must_contain)
    for s in sources:
        p = _bfs(U, s, goal_set, banned)
        if not p:
            continue
        # shortest may skip phones; search from a required waypoint
        break
    # Walk from ph02 to a goal without target, then prefix from a mandi source to ph02
    if "phone:ph02" not in U or "phone:ph03" not in U:
        return None
    if "phone:ph02" in banned or "phone:ph03" in banned:
        return None
    to_goal = _bfs(U, "phone:ph03", goal_set, banned)
    mid = _bfs(U, "phone:ph02", {"phone:ph03"}, banned)
    head = None
    for s in sources:
        if s in banned:
            continue
        head = _bfs(U, s, {"phone:ph02"}, banned)
        if head:
            break
    if not (head and mid and to_goal):
        return None
    path = head[:-1] + mid[:-1] + to_goal
    if not need.issubset(path):
        return None
    return path


def _bfs(U: nx.Graph, start: str, goals: set[str], banned: set[str]):
    if start not in U or start in banned:
        return None
    q = deque([start])
    parent = {start: None}
    while q:
        cur = q.popleft()
        if cur in goals and cur != start:
            out = [cur]
            while parent[out[-1]] is not None:
                out.append(parent[out[-1]])
            out.reverse()
            return out
        for nxt in U.neighbors(cur):
            if nxt in banned or nxt in parent:
                continue
            parent[nxt] = cur
            q.append(nxt)
    if start in goals:
        return [start]
    return None

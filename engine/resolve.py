"""SAME_AS only. Never merge Nilesh/Chirag Haleja with person:vikram_haleja."""

from __future__ import annotations

from engine.paths import HALEJA_CANON, HALEJA_DO_NOT_MERGE


def _digits(value: str) -> str:
    return "".join(ch for ch in (value or "") if ch.isdigit())


def resolve(
    nodes: dict[str, dict], edges: list[dict]
) -> tuple[dict[str, dict], list[dict], list[dict]]:
    same_as: list[dict] = []

    phones_by_msisdn: dict[str, list[str]] = {}
    acc_by_number: dict[str, list[str]] = {}
    for nid, node in nodes.items():
        attrs = node.get("attributes") or {}
        if node["type"] == "Phone":
            key = _digits(str(attrs.get("msisdn") or nid))
            if key:
                phones_by_msisdn.setdefault(key, []).append(nid)
        if node["type"] == "Account":
            key = str(attrs.get("number") or nid)
            if key:
                acc_by_number.setdefault(key, []).append(nid)

    def emit_pairs(groups: dict[str, list[str]], reason: str) -> None:
        for _key, ids in groups.items():
            uniq = sorted(set(ids))
            if len(uniq) < 2:
                continue
            for other in uniq[1:]:
                if _blocked(uniq[0], other):
                    continue
                same_as.append(
                    {
                        "type": "SAME_AS",
                        "source": uniq[0],
                        "target": other,
                        "attributes": {
                            "source_type": "resolve",
                            "source_id": f"same:{uniq[0]}:{other}",
                            "snippet": reason,
                            "reason": reason,
                        },
                    }
                )

    emit_pairs(phones_by_msisdn, "identical msisdn")
    emit_pairs(acc_by_number, "identical account number")

    # Persons are never merged by surname. Haleja namesakes stay distinct.
    for nid, node in nodes.items():
        if node["type"] != "Person":
            continue
        if nid in HALEJA_DO_NOT_MERGE or nid == HALEJA_CANON:
            continue

    edges = list(edges) + same_as
    return nodes, edges, same_as


def _blocked(a: str, b: str) -> bool:
    pair = {a, b}
    if HALEJA_CANON in pair and pair & set(HALEJA_DO_NOT_MERGE):
        return True
    if HALEJA_CANON in pair and any("haleja" in x.lower() for x in pair if x != HALEJA_CANON):
        return True
    return False


def haleja_not_merged(edges: list[dict]) -> bool:
    for e in edges:
        if e["type"] != "SAME_AS":
            continue
        pair = {e["source"], e["target"]}
        if HALEJA_CANON in pair and pair & set(HALEJA_DO_NOT_MERGE):
            return False
        names = " ".join(pair).lower()
        if HALEJA_CANON in pair and ("p46" in names or "p76" in names):
            return False
    return True

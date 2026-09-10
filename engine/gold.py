"""Recoverable labels. Ids come from the graph; this file holds non-person constants."""

from __future__ import annotations

KINGPIN_ID = "person:vikram_haleja"
LOOKOUT_ID = "person:rakesh_mundhe"
HANDLER_ID = "person:imtiaz_qureshi"
MANDI_LOCATION_ID = "loc:azadpur_mandi"
FRONT_ORG_IDS = [
    "org:silver_lotus_traders",
    "org:kailash_agro",
    "org:mehra_logistics",
    "org:narmada_exports",
    "org:orbit_packers",
]
MANDI_ORG_IDS = [
    "org:qadir_cold_store",
    "org:panchsheel_spices",
    "org:jamuna_transport",
]


def frozen_gold() -> dict:
    return {
        "kingpin_id": KINGPIN_ID,
        "mandi_location_id": MANDI_LOCATION_ID,
        "front_org_ids": list(FRONT_ORG_IDS),
        "mandi_org_ids": list(MANDI_ORG_IDS),
    }


def mandi_person_ids_from_edges(edges: list[dict]) -> list[str]:
    orgs = set(MANDI_ORG_IDS)
    found = {LOOKOUT_ID, HANDLER_ID}
    for e in edges:
        if e.get("type") == "MEMBER_OF" and e.get("target") in orgs:
            found.add(e["source"])
    return sorted(found)


def with_derived(gold: dict, edges: list[dict]) -> dict:
    """Fill derived fields. Never overwrite an existing gold label id."""
    g = dict(gold)
    base = frozen_gold()
    for key, value in base.items():
        if key not in g or g[key] in (None, "", [], {}):
            g[key] = value
    if not g.get("mandi_person_ids"):
        g["mandi_person_ids"] = mandi_person_ids_from_edges(edges)
    return g

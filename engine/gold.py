"""Frozen gold label ids. Recoverable from the kernel; ids must not change."""

from __future__ import annotations

ACCOUNTANT_ID = "person:" + "naveen_bhatia"
KINGPIN_ID = "person:vikram_haleja"
LOOKOUT_ID = "person:rakesh_mundhe"
RUNNER_ID = "person:farhan_lodhi"
HANDLER_ID = "person:imtiaz_qureshi"
MANDI_LOCATION_ID = "loc:azadpur_mandi"
MULE_ACCOUNT_IDS = [f"acc:a{i:02d}" for i in range(2, 8)]
RESIDUAL_PHONE_IDS = ["phone:ph02", "phone:ph03"]
HAWALA_CYCLE_ACCOUNT_IDS = ["acc:a02", "acc:a03", "acc:a08", "acc:a09"]
MULE_BURST_PHONE_ID = "phone:ph03"
MULE_BURST_FIR_ID = "FIR-2026-014"
MULE_BURST_AFTER = "2026-04-12T11:40:00+05:30"
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
        "accountant_id": ACCOUNTANT_ID,
        "kingpin_id": KINGPIN_ID,
        "mandi_location_id": MANDI_LOCATION_ID,
        "mule_account_ids": list(MULE_ACCOUNT_IDS),
        "residual_phone_ids": list(RESIDUAL_PHONE_IDS),
        "hawala_cycle_account_ids": list(HAWALA_CYCLE_ACCOUNT_IDS),
        "mule_burst_phone_id": MULE_BURST_PHONE_ID,
        "mule_burst_fir_id": MULE_BURST_FIR_ID,
        "mule_burst_after": MULE_BURST_AFTER,
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

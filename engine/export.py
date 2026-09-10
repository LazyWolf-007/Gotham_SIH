"""Write data/processed/graph.json. Does not touch data/raw/."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from engine.paths import KERNEL, PROCESSED
from engine.pipeline import build_kernel


def serialize(kernel: dict) -> dict:
    G = kernel["graph"]
    nodes = []
    for nid, data in G.nodes(data=True):
        attrs = dict(data.get("attributes") or {})
        label = attrs.get("name") or attrs.get("msisdn") or attrs.get("number") or attrs.get("code") or nid
        nodes.append(
            {
                "id": nid,
                "type": data.get("type"),
                "label": label,
                "attributes": attrs,
                "metrics": data.get("metrics") or {},
            }
        )
    edges = []
    for u, v, data in G.edges(data=True):
        edges.append(
            {
                "id": data.get("id"),
                "type": data.get("type"),
                "source": u,
                "target": v,
                "attributes": data.get("attributes") or {},
            }
        )
    return {
        "ontology_version": "1.0.0",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "nodes": nodes,
        "edges": edges,
        "patterns": kernel.get("patterns") or [],
        "cut": kernel.get("cut") or {},
        "same_as": kernel.get("same_as") or [],
        "meta": kernel.get("meta") or {},
    }


def write(path=None) -> dict:
    payload = serialize(build_kernel())
    out = path or KERNEL
    PROCESSED.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


def main() -> None:
    payload = write()
    print(f"wrote {KERNEL} nodes={len(payload['nodes'])} edges={len(payload['edges'])}")


if __name__ == "__main__":
    main()

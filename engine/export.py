"""Write data/processed/graph.json and insights.json. Does not touch data/raw/."""

from __future__ import annotations

import json
from datetime import datetime, timezone

from engine.insights import build as build_insights
from engine.paths import INSIGHTS, KERNEL, PROCESSED
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
    edges.extend(_inferred_uses(G))
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


def _inferred_uses(G) -> list[dict]:
    """If a person OWNS a phone and USES is missing, add inferred USES in the export only."""
    owns: set[tuple[str, str]] = set()
    uses: set[tuple[str, str]] = set()
    for u, v, data in G.edges(data=True):
        if G.nodes[u].get("type") != "Person" or G.nodes[v].get("type") != "Phone":
            continue
        typ = data.get("type")
        if typ == "OWNS":
            owns.add((u, v))
        elif typ == "USES":
            uses.add((u, v))
    extra = []
    for src, tgt in sorted(owns - uses):
        extra.append(
            {
                "id": f"infer:USES:{src}:{tgt}",
                "type": "USES",
                "source": src,
                "target": tgt,
                "attributes": {
                    "source_type": "infer",
                    "source_id": f"owns:{src}:{tgt}",
                    "snippet": "inferred USES from OWNS",
                    "inferred": True,
                },
            }
        )
    return extra


def write(path=None, *, root=None, extra=None) -> dict:
    kernel = build_kernel(root=root, extra=extra)
    payload = serialize(kernel)
    out = path or KERNEL
    PROCESSED.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    insights = build_insights(kernel)
    INSIGHTS.write_text(json.dumps(insights, indent=2), encoding="utf-8")
    return payload


def main() -> None:
    payload = write()
    print(f"wrote {KERNEL} nodes={len(payload['nodes'])} edges={len(payload['edges'])}")
    print(f"wrote {INSIGHTS}")


if __name__ == "__main__":
    main()

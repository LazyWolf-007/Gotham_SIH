"""Build the frozen kernel from frozen raw files."""

from __future__ import annotations

import json
import time

from engine import cut, gold as goldmod, graph, ingest, patterns, resolve
from engine.extract import attach_mentions
from engine.graph import hinge_person
from engine.paths import EXTRACTED


def build_kernel(root=None, extra=None) -> dict:
    nodes, edges, universe = ingest.load(root=root, extra=extra)
    nodes, edges = attach_mentions(nodes, edges)
    nodes, edges, same_as = resolve.resolve(nodes, edges)
    G = graph.build(nodes, edges)
    edge_recs = [{"type": d.get("type"), "source": u, "target": v} for u, v, d in G.edges(data=True)]
    gold = goldmod.with_derived(universe.get("gold") or goldmod.frozen_gold(), edge_recs)
    hinge = hinge_person(G)
    gold["accountant_id"] = hinge
    universe = dict(universe)
    universe["gold"] = gold
    hits = patterns.match(G, universe)
    by_pat = {h["pattern"]: h for h in hits}
    burst = by_pat.get("mule_burst") or {}
    cycle = by_pat.get("hawala_cycle") or {}
    ev = burst.get("evidence") or {}
    if ev.get("phone"):
        gold["mule_burst_phone_id"] = ev["phone"]
    if ev.get("fir"):
        gold["mule_burst_fir_id"] = ev["fir"]
    if ev.get("after"):
        gold["mule_burst_after"] = ev["after"]
    if cycle.get("nodes"):
        gold["hawala_cycle_account_ids"] = list(cycle["nodes"])
    cut_result = cut.arrest(G, hinge)
    object_counts: dict[str, int] = {}
    for _, data in G.nodes(data=True):
        t = data.get("type") or "?"
        object_counts[t] = object_counts.get(t, 0) + 1
    link_counts: dict[str, int] = {}
    for _, _, data in G.edges(data=True):
        t = data.get("type") or "?"
        link_counts[t] = link_counts.get(t, 0) + 1
    return {
        "graph": G,
        "universe": universe,
        "patterns": hits,
        "cut": cut_result,
        "same_as": same_as,
        "meta": {
            "object_counts": object_counts,
            "link_counts": link_counts,
            "same_as_count": len(same_as),
        },
    }


def _reader_payload() -> tuple[dict, str]:
    """Reuse extracted.json so Groq is not billed for all ~60 FIRs."""
    if EXTRACTED.exists() and EXTRACTED.stat().st_size >= 8:
        try:
            data = json.loads(EXTRACTED.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            data = {}
        if isinstance(data, dict) and data.get("records"):
            return data, "cached"
    from engine.extract import run

    return run(use_groq=False), "read"


def _print_extract_oneliners(payload: dict) -> None:
    records = {r["fir_id"]: r for r in (payload.get("records") or []) if r.get("fir_id")}
    r014 = records.get("FIR-2026-014")
    if not r014:
        print("FAIL FIR-2026-014 missing from extracted.json", flush=True)
    else:
        blob014 = json.dumps(r014)
        ok = "farhan_lodhi" in blob014 or "phone:ph03" in blob014
        print(
            ("PASS" if ok else "FAIL") + " FIR-2026-014 → farhan_lodhi OR phone:ph03",
            flush=True,
        )
    r010 = records.get("FIR-2026-010")
    if not r010:
        print("FAIL FIR-2026-010 missing from extracted.json", flush=True)
    else:
        blob010 = json.dumps(r010)
        ok = "naveen_bhatia" in blob010
        print(
            ("PASS" if ok else "FAIL") + " FIR-2026-010 → naveen_bhatia",
            flush=True,
        )


def run(root=None, extra=None) -> dict:
    """Compile data/raw (optional extra case pack) into graph.json. Does not touch data/raw."""
    log: list[str] = []
    t0 = time.perf_counter()
    _nodes, edges, _universe = ingest.load(root=root, extra=extra)
    called = sum(1 for e in edges if e.get("type") == "CALLED")
    paid = sum(1 for e in edges if e.get("type") == "PAID")
    log.append(f"CALLED {called}")
    log.append(f"PAID {paid}")
    print(
        f"compile CALLED {called} / PAID {paid}  {time.perf_counter() - t0:.2f}s",
        flush=True,
    )

    t1 = time.perf_counter()
    extracted, fir_status = _reader_payload()
    n = len(extracted.get("records") or [])
    log.append(f"FIRs {fir_status} {n}")
    print(f"reader {n} FIRs {fir_status}  {time.perf_counter() - t1:.2f}s", flush=True)
    _print_extract_oneliners(extracted)

    t2 = time.perf_counter()
    from engine.export import write

    payload = write(root=root, extra=extra)
    log.append("wrote graph")
    print(f"wrote graph.json  {time.perf_counter() - t2:.2f}s", flush=True)

    t3 = time.perf_counter()
    from engine.analytics import build as build_analytics

    kpis = build_analytics(payload).get("kpis") or {}
    log.append(f"kpis {json.dumps(kpis)}")
    print(f"analytics kpis {json.dumps(kpis)}  {time.perf_counter() - t3:.2f}s", flush=True)
    meta = payload.get("meta") or {}
    return {
        "log": log,
        "kpis": kpis,
        "meta": meta,
        "object_counts": meta.get("object_counts") or {},
        "link_counts": meta.get("link_counts") or {},
    }


def main() -> None:
    run()


if __name__ == "__main__":
    main()

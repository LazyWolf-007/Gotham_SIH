"""Gold-label gate. Reads frozen universe.json + kernel. Never edits data/raw/."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from engine.export import write
from engine.paths import HALEJA_CANON, HALEJA_DO_NOT_MERGE, KERNEL, UNIVERSE
from engine.pipeline import build_kernel
from engine.resolve import haleja_not_merged


def _fail(msg: str) -> None:
    print(f"FAIL {msg}")
    raise SystemExit(1)


def main() -> None:
    universe = json.loads(UNIVERSE.read_text(encoding="utf-8"))
    gold = universe["gold"]
    kernel = build_kernel()
    payload = write()
    G = kernel["graph"]
    hits = {h["pattern"]: h for h in kernel["patterns"]}
    cut = kernel["cut"]

    print("demo_check: kernel", KERNEL)
    print("meta", json.dumps(kernel["meta"], indent=2))

    acc = gold["accountant_id"]
    if acc != "person:naveen_bhatia":
        _fail(f"accountant_id {acc}")
    if acc not in G:
        _fail("accountant missing from graph")
    m = G.nodes[acc]["metrics"]
    print("accountant metrics", m)
    if m["betweenness_rank_persons"] > 3:
        _fail(f"accountant betweenness rank {m['betweenness_rank_persons']} not top 3")
    if m["degree"] > 15:
        _fail(f"accountant degree {m['degree']} not low")
    print("PASS accountant_id = person:naveen_bhatia, betweenness top 3, low degree")

    king = gold["kingpin_id"]
    if king != "person:vikram_haleja":
        _fail(f"kingpin_id {king}")
    if king not in G:
        _fail("kingpin missing")
    print("PASS kingpin_id = person:vikram_haleja")

    residual = cut.get("residual_path_ph02_ph03")
    print("residual_path", residual)
    if not residual:
        _fail("no residual path after arrest(Bhatia)")
    if "phone:ph02" not in residual or "phone:ph03" not in residual:
        _fail(f"residual path missing ph02/ph03: {residual}")
    print("PASS arrest(Bhatia) leaves a path using phone:ph02 and phone:ph03")

    if "hawala_cycle" not in hits:
        _fail("hawala PAID cycle not found")
    cycle_nodes = hits["hawala_cycle"]["nodes"]
    print("hawala_cycle", hits["hawala_cycle"]["evidence"])
    need = {"acc:a02", "acc:a03", "acc:a08", "acc:a09"}
    if not need.issubset(set(cycle_nodes)):
        _fail(f"cycle missing accounts {need - set(cycle_nodes)}")
    print("PASS hawala PAID cycle exists")

    if "mule_burst" not in hits:
        _fail("mule_burst not found")
    ev = hits["mule_burst"]["evidence"]
    print("mule_burst", ev)
    if ev.get("phone") != "phone:ph03":
        _fail(f"mule_burst phone {ev.get('phone')}")
    if ev.get("fir") != "FIR-2026-014":
        _fail(f"mule_burst fir {ev.get('fir')}")
    print("PASS mule_burst on Lodhi/ph03 after FIR-2026-014")

    if not haleja_not_merged(list(kernel["same_as"]) + [
        {"type": e[2].get("type"), "source": e[0], "target": e[1]}
        for e in G.edges(data=True)
        if e[2].get("type") == "SAME_AS"
    ]):
        _fail("vikram_haleja SAME_AS Nilesh or Chirag")
    for u, v, data in G.edges(data=True):
        if data.get("type") != "SAME_AS":
            continue
        pair = {u, v}
        if HALEJA_CANON in pair and pair & set(HALEJA_DO_NOT_MERGE):
            _fail(f"SAME_AS {pair}")
    print("PASS person:vikram_haleja not SAME_AS Nilesh or Chirag")

    print(f"wrote {payload and KERNEL}")
    print("demo_check: ALL PASS")


if __name__ == "__main__":
    main()

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"
PACKS = ROOT / "packs"
SCHEMA = ROOT / "schema"
KERNEL = PROCESSED / "graph.json"
INSIGHTS = PROCESSED / "insights.json"
EXTRACTED = PROCESSED / "extracted.json"
UNIVERSE = RAW / "universe.json"
DSL = SCHEMA / "pattern.dsl.yaml"

LINK_TYPES = (
    "CALLED",
    "PAID",
    "OWNS",
    "USES",
    "SEEN_AT",
    "MEMBER_OF",
    "MENTIONED_IN",
    "SAME_AS",
)
RESIDUAL_TYPES = ("CALLED", "PAID", "OWNS", "USES", "MEMBER_OF", "SEEN_AT")
BETWEENNESS_TYPES = ("OWNS", "USES", "PAID", "MEMBER_OF")
HALEJA_CANON = "person:vikram_haleja"
HALEJA_DO_NOT_MERGE = ("person:p46", "person:p76")  # Nilesh, Chirag

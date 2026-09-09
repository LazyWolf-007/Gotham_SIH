"""Stub. Later reads gold labels from data/raw/universe.json
and asserts engine/patterns.py and engine/cut.py recover them.
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GOLD = ROOT / "data" / "raw" / "universe.json"


def main() -> None:
    # TODO: load GOLD, check hawala_cycle, mule_burst, accountant_cutpoint, front_cluster
    print(f"demo_check: stub — will read gold labels from {GOLD}")


if __name__ == "__main__":
    main()

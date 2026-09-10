"""Three demo copilot questions against the frozen kernel. Does not touch data/raw/."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from engine.pipeline import build_kernel
from engine.rag import ask

QUESTIONS = [
    "Who is the accountant / cut-point?",
    "If we arrest Naveen Bhatia, who still connects the mandi to the mules?",
    "What happened after FIR-2026-014?",
]


def main() -> None:
    kernel = build_kernel()
    for i, question in enumerate(QUESTIONS, 1):
        result = ask(question, kernel=kernel)
        print(f"=== Q{i}: {question}")
        print(json.dumps(result, indent=2, ensure_ascii=False))
        print()


if __name__ == "__main__":
    main()

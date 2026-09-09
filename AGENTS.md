# AGENTS

Read `CONTEXT.md` first, every session, before any edit. It is product law. Never violate it.

You are Grok working on **Gotham_SIH (SIH26189)** — a Palantir-lite investigation workbench for one synthetic case: **Operation Grey Ledger** (NCRB/MHA criminal network analysis).

## Bindings (do not drift)

- Graph is the brain. LLM is a mouth. If the model is down, the map still answers.
- Typed edges are frozen at these 8. Do not invent new link types: `CALLED`, `PAID`, `OWNS`, `USES`, `SEEN_AT`, `MEMBER_OF`, `MENTIONED_IN`, `SAME_AS`.
- Put extra meaning in edge attributes only (see `CONTEXT.md`). Never add a 9th type.
- `ASSOCIATED` is forbidden unless `scripts/demo_check.py` fails without it — and you ask the user first.
- Every edge has provenance: `{source_type, source_id, snippet}`.
- Do not use Neo4j, LangChain, Microsoft GraphRAG, blockchain, or a vector DB.
- Do not scrape real FIRs or name living people.
- Generate the universe ONCE (`scripts/generate_universe.py`). Never regenerate during UI work.
- Gold labels in `data/raw/universe.json` must be recoverable by `engine/cut.py` and `engine/patterns.py`.
- Pattern logic lives in `schema/pattern.dsl.yaml`, not in UI ifs.
- Copilot is graph-local RAG only: seed entity → 2-hop (max 40 nodes) + 5 snippets → one LLM call → citations highlight on canvas.
- Counterfactual arrest: remove a node, list residual paths between two sets. Do not mutate `data/raw/` or the frozen kernel.
- UI is one screen: canvas | dossier | timeline | copilot.
- Demo script is sacred: hairball → communities → accountant → PAID cycle → arrest sim → copilot.
- Stack: Python 3.11 + networkx + pydantic | Vite + React + cytoscape.js | swap-able copilot (GROQ_API_KEY / Gemini / ollama), default groq llama.

## Where to change what

| Concern | Path |
| --- | --- |
| Product law | `CONTEXT.md` |
| Object / link types | `schema/ontology.ts` |
| The four patterns | `schema/pattern.dsl.yaml` |
| Source field maps | `packs/*.pack.yaml` |
| Graph, cut, RAG | `engine/` |
| UI surfaces | `app/src/{canvas,dossier,timeline,copilot}` |
| Universe (once) | `scripts/generate_universe.py` |
| Gold gate | `scripts/demo_check.py` |

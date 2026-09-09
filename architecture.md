# Architecture

Gotham_SIH (SIH26189) is a Palantir-lite investigation workbench for one synthetic case: Operation Grey Ledger. NCRB/MHA criminal network analysis.

Product law is `CONTEXT.md`. This file is the map of that law onto the repo.

## Graph is the brain. LLM is a mouth.

If the model is down, the map still answers. The frozen kernel `data/processed/graph.json` is the source of truth. Canvas, dossier, and timeline read it. Copilot is optional speech over a 2-hop neighbourhood.

## Typed graph

Object types and the frozen 8 link types live in `schema/ontology.ts`.

Link types (do not invent a 9th): `CALLED`, `PAID`, `OWNS`, `USES`, `SEEN_AT`, `MEMBER_OF`, `MENTIONED_IN`, `SAME_AS`.

Extra meaning goes in edge attributes only. Every edge has provenance `{source_type, source_id, snippet}`.

`ASSOCIATED` is forbidden unless `scripts/demo_check.py` fails without it, and the user agrees first.

Forbidden: Neo4j, LangChain, Microsoft GraphRAG, blockchain, vector DB. Do not scrape real FIRs or name living people.

## Pipeline

```
data/raw/          packs/*.pack.yaml         engine                    UI
firs.md       →    fir.pack.yaml      ─┐
cdr.csv       →    cdr.pack.yaml      ─┤  ingest → resolve → graph
txn.csv       →    txn.pack.yaml      ─┤                 ↓
surveillance  →    surv.pack.yaml     ─┘         patterns + metrics
universe.json (gold labels only)                  cut (overlay)
                                                  rag (2-hop)
                                                  export
                                                      ↓
                                          data/processed/graph.json
                                                      ↓
                                      canvas | dossier | timeline | copilot
```

Generate the universe ONCE (`scripts/generate_universe.py`). Never regenerate during UI work.

## Counterfactual cut

`engine/cut.py` is innovation #2: arrest simulation.

- Input: a node id, plus two sets (source set, target set).
- Operation: remove the node (and incident edges) in memory.
- Output: residual paths that still connect the two sets, plus component delta.
- The scenario is an overlay. It must not mutate `data/raw/` or `data/processed/graph.json`.

Gold `accountant_cutpoint` in `universe.json` must be recoverable by `cut.py`.

## Patterns

Declared in `schema/pattern.dsl.yaml`, executed in `engine/patterns.py`. Not hardcoded ifs in the UI.

Stubs: `hawala_cycle`, `mule_burst`, `accountant_cutpoint`, `front_cluster`.

Gold labels in `universe.json` must be recoverable by `patterns.py`.

## Graph-local RAG

`engine/rag.py`: seed entity → 2-hop (max 40 nodes) + 5 snippets → one LLM call → citations highlight on canvas.

No entity, edge, or fact may appear unless it is in that 2-hop set.

## UI

One screen: canvas | dossier | timeline | copilot.

- Color by type, size by betweenness, hulls by community.
- Filters: money only, calls only, after time T.

Demo script is sacred: hairball → communities → accountant → PAID cycle → arrest sim → copilot.

## Stack

- engine: Python 3.11, networkx, pydantic
- app: Vite, React, cytoscape.js
- copilot: swap-able (GROQ_API_KEY / Gemini / ollama). Default groq llama.

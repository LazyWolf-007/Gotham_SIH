# Gotham_SIH — SIH26189

We are building a Palantir-lite investigation workbench for ONE synthetic case:
Operation Grey Ledger. NCRB/MHA criminal network analysis.

LAW
- Graph is the brain. LLM is a mouth. If the model is down, the map still answers.
- Typed edges only: CALLED, PAID, OWNS, USES, SEEN_AT, MEMBER_OF, MENTIONED_IN, SAME_AS.
- Every edge has provenance: {source_type, source_id, snippet}.
- Do not use Neo4j, LangChain, Microsoft GraphRAG, blockchain, vector DB.
- Do not scrape real FIRs or name living people.
- Generate the universe ONCE. Never regenerate during UI work.
- Gold labels in universe.json must be recoverable by cut.py and patterns.py.

INNOVATION (must exist in code, not just slides)
1. Ontology + provenance
2. Counterfactual arrest: remove node, list residual paths between two sets
3. Pattern DSL (yaml), not hardcoded ifs scattered in UI
4. Graph-local RAG: seed entity → 2-hop (max 40 nodes) + 5 snippets → one LLM call → citations highlight on canvas

UI
- One screen: canvas | dossier | timeline | copilot
- Color by type, size by betweenness, hulls by community
- Filters: money only, calls only, after time T
- Demo script is sacred: hairball → communities → accountant → PAID cycle → arrest sim → copilot

STACK
- engine: Python 3.11, networkx, pydantic
- app: Vite, React, cytoscape.js
- copilot model: swap-able (GROQ_API_KEY / Gemini / ollama). Default groq llama.

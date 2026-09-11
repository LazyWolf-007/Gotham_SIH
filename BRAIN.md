# Gotham_SIH — Brain Architecture & Specification

> **SIH26189 — Palantir-Lite Investigation Workbench**  
> Synthetic Case Study: **Operation Grey Ledger** (NCRB / MHA Criminal Network Analysis)

---

## 1. Prime Directive & Core Laws

1. **Graph is the Brain. LLM is a Mouth.**  
   If the LLM is down, unconfigured, or unreachable, the map still answers every query deterministically. The frozen graph kernel `data/processed/graph.json` is the single source of truth. Canvas, dossier, timeline, and pattern matchers read directly from it.
2. **Frozen 8 Link Types (Zero Drift):**  
   Only 8 edge types are permitted. Never introduce a 9th edge type.
   - `CALLED`
   - `PAID`
   - `OWNS`
   - `USES`
   - `SEEN_AT`
   - `MEMBER_OF`
   - `MENTIONED_IN`
   - `SAME_AS`
   - *(Note: `ASSOCIATED` is strictly forbidden).*
3. **Mandatory Provenance:**  
   Every edge in the universe carries provenance metadata: `{ source_type, source_id, snippet }`.
4. **Clean Tech Stack & Zero Bloat:**  
   No Neo4j, no LangChain, no Microsoft GraphRAG, no vector DBs, and no blockchain.
5. **Synthetic & Safe Data:**  
   Zero real-world FIR scraping. Zero naming of living public figures.

---

## 2. System Architecture & Pipeline

```
┌─────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│  data/raw/      │       │  packs/*.pack.yaml   │       │  engine/               │
│  - firs.md      │ ───►  │  - fir.pack.yaml     │ ───►  │  - ingest.py           │
│  - cdr.csv      │       │  - cdr.pack.yaml     │       │  - resolve.py          │
│  - txn.csv      │       │  - txn.pack.yaml     │       │  - graph.py (NetworkX) │
│  - surv.json    │       │  - surv.pack.yaml    │       │  - patterns.py (DSL)   │
│  - universe.json│       └──────────────────────┘       │  - cut.py (Sim)        │
└─────────────────┘                                      │  - rag.py (2-Hop)      │
                                                         └──────────┬─────────────┘
                                                                    │
                                                                    ▼
                                                         ┌────────────────────────┐
                                                         │ data/processed/        │
                                                         │ graph.json (Kernel)    │
                                                         └──────────┬─────────────┘
                                                                    │
                                                                    ▼
                                                         ┌────────────────────────┐
                                                         │ UI Workbench (app/)    │
                                                         │ Canvas | Dossier |     │
                                                         │ Timeline | Copilot     │
                                                         └────────────────────────┘
```

---

## 3. Strict Ontology Specification

### 3.1 Object Types (8 Entities)
| Object Type | Primary Identifier | Core Attributes |
| :--- | :--- | :--- |
| **`Person`** | `person:<slug>` | `id`, `name` |
| **`Phone`** | `phone:<ph_id>` | `id`, `msisdn`, `imei`, `prepaid` |
| **`Account`** | `acc:<acc_id>` | `id`, `number`, `bank` |
| **`Organization`** | `org:<slug>` | `id`, `name` |
| **`Location`** | `loc:<slug>` | `id`, `name`, `area` |
| **`Camera`** | `cam:<slug>` | `id`, `code`, `location_id` |
| **`Vehicle`** | `veh:<veh_id>` | `id`, `plate`, `kind`, `color` |
| **`FIR`** | `FIR-YYYY-NNN` | `id`, `station`, `offence`, `sections`, `filed_at`, `narrative` |

### 3.2 Link Types & Attribute Rules
| Link Type | Source Object | Target Object | Edge Attributes |
| :--- | :--- | :--- | :--- |
| **`CALLED`** | `Phone` | `Phone` | `at`, `duration_s`, `tower`, `source_type`, `source_id`, `snippet` |
| **`PAID`** | `Account` | `Account` | `at`, `amount_inr`, `channel`, `note`, `source_type`, `source_id`, `snippet` |
| **`OWNS`** | `Person` | `Phone`, `Account`, `Vehicle` | `source_type`, `source_id`, `snippet` |
| **`USES`** | `Person` | `Phone`, `Vehicle` | `at`, `source_type`, `source_id`, `snippet` |
| **`SEEN_AT`** | `Person`, `Vehicle` | `Location`, `Camera` | `at`, `confidence`, `source_type`, `source_id`, `snippet` |
| **`MEMBER_OF`**| `Person` | `Organization` | `role`, `source_type`, `source_id`, `snippet` |
| **`MENTIONED_IN`**| `Person` | `FIR` | `role` (`complainant` \| `mentioned`), `source_type`, `source_id`, `snippet` |
| **`SAME_AS`** | *Any* | *Any* | `reason`, `source_type`, `source_id`, `snippet` |

---

## 4. Case Bible: Operation Grey Ledger

- **Context:** Unregulated agricultural produce skimming at Azadpur Sabzi Mandi funneled into NCR-based corporate shell entities and mule accounts.
- **Key Characters & Roles:**
  - **Kingpin (`person:vikram_haleja`):** Owner of *Haleja Holdings LLP*. Insulated, zero direct financial signings, near-zero phone calls.
  - **Accountant / Cut-point (`person:naveen_bhatia`):** Proprietor of *Bhatia Associates*. Maintains split ledgers: inbound (`acc:a00`) receiving Mandi collections, and outbound (`acc:a01`) disbursing to mules (`acc:a02`–`acc:a07`). Top betweenness centrality, low degree.
  - **Mandi Handler (`person:imtiaz_qureshi`):** Manager at *Qadir Cold Store*, collects mandi proceeds and directs them to Bhatia's inbound account.
  - **Mandi Lookout (`person:rakesh_mundhe`):** Supervisor at *Panchsheel Spices* (`phone:ph02`).
  - **Mule Runner (`person:farhan_lodhi`):** Operates burner handset (`phone:ph03`) and controls primary mule account `acc:a02`.
- **The Trigger Event:**
  - `FIR-2026-014` registered at Azadpur PS on 12 April 2026 for cheating & GST invoice fabrication.
  - Triggers an immediate 140+ call burst on Lodhi's burner phone (`phone:ph03`).

---

## 5. Pattern Engine (`schema/pattern.dsl.yaml`)

Patterns are declared declaratively via DSL and evaluated in `engine/patterns.py`:

1. **`hawala_cycle`:**
   - **Type:** Directed cycle of `PAID` links among shell organizations and mule accounts (`acc:a02` &rarr; `acc:a03` &rarr; `acc:a08` &rarr; `acc:a09` &rarr; `acc:a02`).
2. **`mule_burst`:**
   - **Type:** CDR frequency spike on suspect burner phones within 48 hours following a critical FIR event (`phone:ph03` following `FIR-2026-014`).
3. **`accountant_cutpoint`:**
   - **Type:** Graph bottleneck entity exhibiting Top 3 Betweenness Centrality among Persons alongside low structural degree (&le; 15).
4. **`front_cluster`:**
   - **Type:** Clustered shell corporations connected by `MEMBER_OF` links across puppet directors and nominees.

---

## 6. Innovation Pillars

### 6.1 Counterfactual Arrest Simulation (`engine/cut.py`)
- **Mechanism:** In-memory graph surgery. Temporarily removes target node (e.g., `person:naveen_bhatia`) and incident edges without mutating disk storage.
- **Residual Path Analysis:** Computes surviving BFS paths between Mandi actors and mule accounts.
- **Key Finding:** Removing Bhatia cuts the direct financial pipeline, but exposes the secondary covert liaison channel: `person:rakesh_mundhe` (`ph02`) &harr; `person:farhan_lodhi` (`ph03`).

### 6.2 Graph-Local Copilot RAG (`engine/rag.py`)
- **Strict 2-Hop Bounding:** Seed entity &rarr; sub-graph extraction capped at &le; 40 nodes + top 5 provenance snippets.
- **Anti-Hallucination Law:** The LLM is prohibited from stating any entity, transaction, or relationship not present in the extracted 2-hop neighborhood.
- **Canvas Citation Highlighting:** Citations returned by the model map 1:1 with node IDs on the visual canvas.

---

## 7. Demo Script & Golden Verification

The golden standard execution path for demonstrations:
1. **Hairball View:** Total universe visualization (80 Persons, 40 Phones, 30 Accounts, 3k CDRs, 800 Txns).
2. **Community Partition:** Louvain clustering revealing Mandi vs Front clusters.
3. **Accountant Identification:** Filter by Betweenness centrality highlighting Naveen Bhatia.
4. **Hawala Cycle Discovery:** Highlighting the 4-hop circular `PAID` loop.
5. **Arrest Simulation:** Executing `cut.py` on Bhatia and exposing the surviving `ph02` &harr; `ph03` residual phone bridge.
6. **Copilot Query:** Natural language synthesis with interactive canvas pin-pointing.

### Verification Gate Command
```powershell
python -X utf8 scripts/demo_check.py
```
*Expected: 100% PASS on all gold invariant checks.*

# Gotham_SIH (SIH26189)

> **Palantir-lite Investigation Workbench for Operation Grey Ledger**  
> Synthetic Case Study: NCRB / MHA Criminal Network Analysis.

---

## 🚀 How to Run

### Option 1: One-Click Startup (Windows)
Double-click [`start.bat`](file:///c:/Users/Krishna%20Singh/Desktop/SIH/Gotham_SIH/start.bat) or run in terminal:
```powershell
.\start.bat
```

---

### Option 2: Standard Startup (2 Terminals)

#### **1. Backend Server** (Terminal 1)
```powershell
python server.py
```
- Runs at: `http://127.0.0.1:8000`

#### **2. Frontend Workbench** (Terminal 2)
```powershell
npm run dev
```
- Runs at: `http://localhost:5173`

---

## 🧪 Verification Check
Run the golden invariant tests:
```powershell
python -X utf8 scripts/demo_check.py
```
Expected output: `demo_check: ALL PASS`

---

## 🗺️ Sacred Demo Script (In UI)
1. **Hairball View:** Total universe (80 Persons, 40 Phones, 30 Accounts, 3.8k Links).
2. **Community Partition:** Louvain clustering of Mandi vs Front clusters.
3. **Accountant Identification:** Naveen Bhatia (Top 1 Betweenness, low degree).
4. **Hawala Cycle:** 4-hop circular PAID loop (`acc:a02` → `acc:a03` → `acc:a08` → `acc:a09` → `acc:a02`).
5. **Counterfactual Arrest:** Cuts financial flow, exposes surviving `ph02` ↔ `ph03` phone fallback.
6. **Copilot RAG:** Graph-local 2-hop bounded intelligence with canvas citation pins.

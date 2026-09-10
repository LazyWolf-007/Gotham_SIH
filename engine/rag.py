"""Graph-local RAG. LLM is a mouth; if the model is down, the map still answers."""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request

import networkx as nx

from engine.graph import undirected_of
from engine.patterns import load_dsl

MAX_HOPS = 2
MAX_NODES = 40
MAX_SNIPPETS = 5
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models"
GROQ_MODEL = "llama-3.3-70b-versatile"
_GROQ_UA = "GothamSIH/1.0"
_MODEL_CACHE: str | None = None
_PREFERRED_MODELS = (
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama-3.1-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "groq/compound-mini",
    "openai/gpt-oss-20b",
)

# Question phrases → gold keys already on the kernel. Not a 9th link type.
_GOLD_ALIASES = (
    (("accountant", "cut-point", "cutpoint", "cut point"), "accountant_id"),
    (("kingpin",), "kingpin_id"),
    (("mandi", "azadpur"), "mandi_location_id"),
    (("mule", "mules"), "mule_account_ids"),
    (("hawala",), "hawala_cycle_account_ids"),
)


def retrieve(G: nx.MultiDiGraph, seed: str, max_nodes: int = 40, max_snippets: int = 5) -> dict:
    if seed not in G:
        return {"seed": seed, "nodes": [], "snippets": []}
    nodes = _expand(G, [seed], max_hops=MAX_HOPS, max_nodes=max_nodes)
    snippets = _snippets(G, nodes, max_snippets=max_snippets)
    return {
        "seed": seed,
        "nodes": nodes,
        "snippets": [s["snippet"] for s in snippets],
    }


def ask(question: str, kernel: dict | None = None) -> dict:
    """Seed → 2-hop (max 40) + 5 FIR/txn snippets → one Groq call (or stub)."""
    if kernel is None:
        from engine.pipeline import build_kernel

        kernel = build_kernel()
    G = kernel["graph"]
    gold = (kernel.get("universe") or {}).get("gold") or {}
    cut = kernel.get("cut") or {}
    seeds = _seed_entities(question, G, gold, kernel.get("patterns") or [])
    if _is_arrest_question(question):
        extra = []
        target = cut.get("target") or gold.get("accountant_id")
        if target in G:
            extra.append(target)
        for nid in cut.get("residual_path_ph02_ph03") or cut.get("residual_path") or []:
            if nid in G:
                extra.append(nid)
        seeds = extra + seeds
    seeds = _dedupe_present(seeds, G)
    hops = _expand(G, seeds, max_hops=MAX_HOPS, max_nodes=MAX_NODES)
    snippets = _snippets(G, hops, max_snippets=MAX_SNIPPETS)
    known_ids = _source_ids(G)
    citations = [s for s in snippets if s["source_id"] in known_ids]
    highlights = [n for n in hops if n in G]
    answer = _one_model_call(
        question,
        G,
        highlights,
        citations,
        cut,
        kernel.get("patterns") or [],
    )
    if answer is None:
        answer = "model offline"
    return {
        "answer": answer,
        "citations": citations,
        "highlight_node_ids": highlights,
    }


def _node_label(G, nid: str) -> str:
    attrs = (G.nodes[nid].get("attributes") or {}) if nid in G else {}
    return str(
        attrs.get("name")
        or attrs.get("msisdn")
        or attrs.get("number")
        or attrs.get("code")
        or nid
    )


def _seed_entities(question: str, G, gold: dict, hits: list[dict]) -> list[str]:
    q = question or ""
    q_low = q.lower()
    seeds: list[str] = []

    def add(nid):
        if nid and nid in G and nid not in seeds:
            seeds.append(nid)

    # Exact id / label / name hits in the question (longest first).
    candidates = []
    for nid, data in G.nodes(data=True):
        attrs = data.get("attributes") or {}
        labels = [
            nid,
            nid.split(":", 1)[-1],
            _node_label(G, nid),
            str(attrs.get("name") or ""),
            str(attrs.get("msisdn") or ""),
            str(attrs.get("number") or ""),
            str(attrs.get("code") or ""),
            nid.split(":", 1)[-1].replace("_", " "),
        ]
        for lab in labels:
            if not lab or len(lab) < 4:
                continue
            if lab.lower() in q_low:
                candidates.append((len(lab), nid))
    for _n, nid in sorted(candidates, reverse=True):
        add(nid)

    for aliases, key in _GOLD_ALIASES:
        if any(_has_alias(q_low, a) for a in aliases):
            val = gold.get(key)
            if isinstance(val, list):
                for nid in val:
                    add(nid)
            else:
                add(val)

    if _has_alias(q_low, "mandi"):
        for nid in gold.get("mandi_person_ids") or []:
            add(nid)
        for pid in gold.get("residual_phone_ids") or []:
            add(pid)

    try:
        dsl = {p["id"]: p for p in (load_dsl().get("patterns") or [])}
    except Exception:
        dsl = {}
    pattern_markers = {
        "hawala_cycle": ("hawala", "hawala cycle"),
        "mule_burst": ("mule burst", "cdr spike", "burst"),
        "accountant_cutpoint": ("accountant", "cut-point", "cutpoint", "cut point"),
        "front_cluster": ("front cluster", "front firm"),
    }
    for hit in hits:
        pid = hit.get("pattern") or ""
        spec = dsl.get(pid, {})
        markers = pattern_markers.get(pid) or (spec.get("title") or pid.replace("_", " "),)
        if any(_has_alias(q_low, m) for m in markers):
            for nid in hit.get("nodes") or []:
                add(nid)

    return seeds


def _has_alias(q_low: str, alias: str) -> bool:
    alias = alias.lower().strip()
    if not alias:
        return False
    spaced = " " + re.sub(r"[^a-z0-9]+", " ", q_low) + " "
    alias_sp = re.sub(r"[^a-z0-9]+", " ", alias).strip()
    if alias_sp and re.search(rf"\b{re.escape(alias_sp)}s?\b", spaced):
        return True
    flat_q = re.sub(r"[^a-z0-9]+", "", q_low)
    flat_a = re.sub(r"[^a-z0-9]+", "", alias)
    if len(flat_a) >= 8 and flat_a in flat_q:
        return True
    return False


def _is_arrest_question(question: str) -> bool:
    q = (question or "").lower()
    return any(w in q for w in ("arrest", "remove", "counterfactual"))


def _dedupe_present(ids: list[str], G) -> list[str]:
    out = []
    for nid in ids:
        if nid in G and nid not in out:
            out.append(nid)
    return out


def _expand(G: nx.MultiDiGraph, seeds: list[str], max_hops: int, max_nodes: int) -> list[str]:
    U = undirected_of(G)
    ordered: list[str] = []
    seen: set[str] = set()

    def add(nid: str) -> bool:
        if nid in seen or nid not in G:
            return len(ordered) < max_nodes
        if len(ordered) >= max_nodes:
            return False
        seen.add(nid)
        ordered.append(nid)
        return True

    for s in seeds:
        if not add(s):
            return ordered
    frontier = [s for s in seeds if s in U]
    type_rank = {
        "Person": 0,
        "Account": 1,
        "Phone": 2,
        "FIR": 3,
        "Organization": 4,
        "Location": 5,
    }
    for _ in range(max_hops):
        nxt = []
        for n in frontier:
            neigh = []
            if n in U:
                neigh = list(U.neighbors(n))
            neigh.sort(
                key=lambda x: (
                    type_rank.get((G.nodes[x].get("type") if x in G else None) or "", 9),
                    x,
                )
            )
            for nb in neigh:
                if nb in seen:
                    continue
                nxt.append(nb)
                if not add(nb):
                    return ordered
        frontier = nxt
        if not frontier:
            break
    return ordered


def _source_ids(G) -> set[str]:
    out = set()
    for _, _, data in G.edges(data=True):
        sid = (data.get("attributes") or {}).get("source_id")
        if sid:
            out.add(str(sid))
    return out


def _snippets(G, node_ids: list[str], max_snippets: int) -> list[dict]:
    hops = set(node_ids)
    scored = []
    for u, v, data in G.edges(data=True):
        if u not in hops or v not in hops:
            continue
        attrs = data.get("attributes") or {}
        sid = attrs.get("source_id")
        snippet = (attrs.get("snippet") or "").strip()
        st = (attrs.get("source_type") or "").lower()
        etype = data.get("type")
        if not sid or not snippet:
            continue
        fir_or_txn = etype == "MENTIONED_IN" or st in {"fir", "txn"}
        if not fir_or_txn:
            continue
        rank = 0 if etype == "MENTIONED_IN" or st == "fir" else 1
        scored.append((rank, str(sid), st or ("fir" if etype == "MENTIONED_IN" else ""), snippet))
    scored.sort(key=lambda row: (row[0], row[1]))
    out = []
    seen = set()
    for _rank, sid, st, snippet in scored:
        if sid in seen:
            continue
        seen.add(sid)
        out.append({"source_id": sid, "source_type": st, "snippet": snippet[:240]})
        if len(out) >= max_snippets:
            break
    return out


def _groq_headers(key: str, json_body: bool = False) -> dict:
    headers = {
        "Authorization": f"Bearer {key}",
        "User-Agent": _GROQ_UA,
    }
    if json_body:
        headers["Content-Type"] = "application/json"
    return headers


def _list_model_ids(key: str) -> set[str]:
    req = urllib.request.Request(
        GROQ_MODELS_URL,
        headers=_groq_headers(key),
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
        return set()
    return {str(x.get("id")) for x in (raw.get("data") or []) if x.get("id")}


def _resolve_model(key: str) -> str:
    global _MODEL_CACHE
    env = (os.environ.get("GROQ_MODEL") or "").strip()
    if env:
        return env
    if _MODEL_CACHE:
        return _MODEL_CACHE
    ids = _list_model_ids(key)
    if not ids:
        _MODEL_CACHE = "groq/compound-mini"
        return _MODEL_CACHE
    for m in _PREFERRED_MODELS:
        if m in ids:
            _MODEL_CACHE = m
            return m
    for mid in sorted(ids):
        if "llama" in mid and "whisper" not in mid and "guard" not in mid:
            _MODEL_CACHE = mid
            return mid
    _MODEL_CACHE = "groq/compound-mini"
    return _MODEL_CACHE


def _message_text(raw: dict) -> str | None:
    try:
        msg = raw["choices"][0]["message"]
    except (KeyError, IndexError, TypeError):
        return None
    text = (msg.get("content") or "").strip()
    if text:
        return text
    for key in ("reasoning", "reasoning_content"):
        alt = (msg.get(key) or "").strip()
        if alt:
            return alt
    return None


def _one_model_call(
    question: str,
    G,
    node_ids: list[str],
    citations: list[dict],
    cut: dict,
    hits: list[dict] | None = None,
) -> str | None:
    key = (os.environ.get("GROQ_API_KEY") or "").strip()
    if not key:
        return None
    lines = []
    for nid in node_ids:
        data = G.nodes[nid]
        m = data.get("metrics") or {}
        lines.append(
            f"- {nid} type={data.get('type')} label={_node_label(G, nid)} "
            f"betweenness_rank_persons={m.get('betweenness_rank_persons')} degree={m.get('degree')}"
        )
    cite_lines = [
        f"- {c['source_id']} ({c.get('source_type') or ''}): {c.get('snippet') or ''}"
        for c in citations
    ]
    residual = cut.get("residual_path_ph02_ph03") or cut.get("residual_path") or []
    residual = [n for n in residual if n in set(node_ids)]
    payload = (
        f"Question: {question}\n\n"
        f"Subgraph nodes (2-hop, max {MAX_NODES}):\n"
        + "\n".join(lines)
        + "\n\nSnippets (cite only these source_ids):\n"
        + "\n".join(cite_lines or ["- (none)"])
    )
    if residual:
        payload += "\n\nResidual path after removing the arrest target:\n" + " → ".join(residual)
    hopset = set(node_ids)
    pattern_lines = []
    for hit in hits or []:
        nodes = [n for n in (hit.get("nodes") or []) if n in hopset]
        if not nodes:
            continue
        pattern_lines.append(
            f"- {hit.get('pattern')} nodes={nodes} evidence={json.dumps(hit.get('evidence') or {}, default=str)}"
        )
    if pattern_lines:
        payload += "\n\nPatterns whose nodes sit in this subgraph:\n" + "\n".join(pattern_lines)
    system = (
        "You are the copilot for Operation Grey Ledger. Graph is the brain. "
        "Answer ONLY from the provided subgraph and snippets. "
        "Do not invent entities, edges, or source_ids. "
        "If the subgraph is insufficient, say so. Keep the answer short."
    )
    body = {
        "model": _resolve_model(key),
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": payload},
        ],
        "temperature": 0.1,
        "max_tokens": 500,
    }
    req = urllib.request.Request(
        GROQ_URL,
        data=json.dumps(body).encode("utf-8"),
        headers=_groq_headers(key, json_body=True),
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
        return None
    text = _message_text(raw)
    return text or None

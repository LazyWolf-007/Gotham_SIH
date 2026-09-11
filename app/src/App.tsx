import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "./analytics/Analytics";
import { Canvas, type CanvasHandle } from "./canvas/Canvas";
import { Dossier } from "./dossier/Dossier";
import { fetchGraph } from "./lib/api";
import {
  type FocusKind,
  type ViewMode,
  capHighlightIds,
  findNodeByQuery,
  hingePerson,
  humanLabel,
  neighborsOf,
  provenanceFor,
  sumCounts,
} from "./lib/graphView";
import {
  KERNEL_OFFLINE,
  KernelError,
  type AnalyticsPayload,
  type AskPayload,
  type CutPayload,
  fetchAnalytics,
  fetchAsk,
  fetchCut,
  fetchHealth,
  kernelMessage,
  postExtract,
  postIngest,
  postPipeline,
} from "./lib/kernel";
import type { GraphNode, GraphPayload } from "./lib/types";

type DeskTab = "map" | "analytics";
type KernelAction =
  | "arrest"
  | "ask"
  | "analytics"
  | "pipeline"
  | "extract"
  | "ingest";

function firIdOf(node: GraphNode | null): string {
  if (node?.type === "FIR" && node.id) return node.id;
  if (node?.id && /^FIR-/i.test(node.id)) return node.id;
  return "FIR-2026-014";
}

export default function App() {
  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [focusKind, setFocusKind] = useState<FocusKind>("naveen");
  const [focusSeq, setFocusSeq] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [jumpToNodeId, setJumpToNodeId] = useState<string | null>(null);
  const [highlightIds, setHighlightIds] = useState<string[] | null>(null);
  const [tab, setTab] = useState<DeskTab>("map");
  const [askQuery, setAskQuery] = useState("");
  const [arrest, setArrest] = useState<CutPayload | null>(null);
  const [ask, setAsk] = useState<AskPayload | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [kernelUp, setKernelUp] = useState(true);
  const [kernelMsg, setKernelMsg] = useState<string | null>(null);
  const [kernelAction, setKernelAction] = useState<KernelAction | null>(null);
  const [deskLog, setDeskLog] = useState<string[]>([]);
  const [deskFlash, setDeskFlash] = useState<string | null>(null);
  const [caseName, setCaseName] = useState("");
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<CanvasHandle>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const askRef = useRef<HTMLInputElement>(null);

  const reloadGraph = useCallback(async () => {
    const payload = await fetchGraph();
    setGraph(payload);
    setLoading(false);
    setError(null);
    return payload;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchGraph()
      .then((payload) => {
        if (!cancelled) {
          setGraph(payload);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load graph");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchHealth()
      .then(() => {
        if (!cancelled) setKernelUp(true);
      })
      .catch(() => {
        if (!cancelled) setKernelUp(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const bumpFocus = (kind: FocusKind) => {
    setFocusKind(kind);
    setFocusSeq((s) => s + 1);
  };

  const showAll = () => {
    setViewMode("all");
    bumpFocus("none");
  };

  const showMoney = () => {
    setViewMode("money");
    bumpFocus("none");
  };

  const showCalls = () => {
    setViewMode("calls");
    bumpFocus("none");
  };

  const findAccountant = () => {
    setViewMode("all");
    setFocusKind("naveen");
    setFocusSeq((s) => s + 1);
  };

  const showPaidCycle = () => {
    setViewMode("money");
    setFocusKind("cycle");
    setFocusSeq((s) => s + 1);
  };

  const resetView = useCallback(() => {
    setJumpToNodeId(null);
    setHighlightIds(null);
    setViewMode("all");
    setFocusKind("fit-all");
    setFocusSeq((s) => s + 1);
  }, []);

  const runSearch = useCallback(() => {
    if (!graph) return;
    const match = findNodeByQuery(graph, searchQuery);
    if (!match) return;
    setSelectedId(match.id);
    setJumpToNodeId(match.id);
    setTab("map");
  }, [graph, searchQuery]);

  const markKernel = (err: unknown) => {
    const msg = kernelMessage(err);
    setKernelMsg(msg);
    if (err instanceof KernelError && err.offline) setKernelUp(false);
  };

  const offlineLabel = (action: KernelAction, live: string) => {
    if (!kernelUp) return KERNEL_OFFLINE;
    if (kernelMsg === KERNEL_OFFLINE && kernelAction === action) return KERNEL_OFFLINE;
    return live;
  };

  const runArrest = useCallback(async () => {
    if (!graph) return;
    const id = selectedId || hingePerson(graph);
    if (!id) return;
    setKernelAction("arrest");
    setKernelMsg(null);
    try {
      const cut = await fetchCut(id);
      setKernelUp(true);
      setArrest(cut);
      setAsk(null);
      setSelectedId(cut.node_id || id);
      setHighlightIds(capHighlightIds(cut.residual_path || []));
      setTab("map");
      setJumpToNodeId(null);
    } catch (err) {
      setArrest(null);
      markKernel(err);
    }
  }, [graph, selectedId]);

  const runAsk = useCallback(async () => {
    const question = askQuery.trim();
    if (!question) return;
    setKernelAction("ask");
    setKernelMsg(null);
    try {
      const result = await fetchAsk(question);
      setKernelUp(true);
      setAsk(result);
      setHighlightIds(capHighlightIds(result.highlight_node_ids || []));
      setTab("map");
    } catch (err) {
      setAsk(null);
      markKernel(err);
    }
  }, [askQuery]);

  const openAnalytics = useCallback(async () => {
    setTab("analytics");
    setKernelAction("analytics");
    setKernelMsg(null);
    setAnalyticsLoading(true);
    try {
      const payload = await fetchAnalytics();
      setKernelUp(true);
      if (payload.error) {
        setAnalytics(null);
        setKernelMsg(String(payload.error));
      } else {
        setAnalytics(payload);
      }
    } catch (err) {
      setAnalytics(null);
      markKernel(err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const selectOnMap = useCallback((id: string) => {
    setSelectedId(id);
    setJumpToNodeId(id);
    setTab("map");
  }, []);

  const replayDocket = useCallback(async () => {
    if (!kernelUp) {
      setKernelAction("pipeline");
      setKernelMsg(KERNEL_OFFLINE);
      return;
    }
    setKernelAction("pipeline");
    setKernelMsg(null);
    setBusy(true);
    setDeskLog(["running pipeline…"]);
    try {
      const result = await postPipeline({ root: "data/raw" });
      setKernelUp(true);
      setDeskLog(result.log || ["wrote graph"]);
      await reloadGraph();
    } catch (err) {
      setDeskLog([]);
      markKernel(err);
    } finally {
      setBusy(false);
    }
  }, [kernelUp, reloadGraph]);

  const rereadFir = useCallback(async () => {
    if (!kernelUp) {
      setKernelAction("extract");
      setKernelMsg(KERNEL_OFFLINE);
      return;
    }
    const node = graph?.nodes.find((n) => n.id === selectedId) ?? null;
    const firId = firIdOf(node);
    setKernelAction("extract");
    setKernelMsg(null);
    setBusy(true);
    setDeskLog([`extract ${firId}…`]);
    try {
      const result = await postExtract(firId);
      setKernelUp(true);
      setDeskLog(result.log || [`extract ${firId}`, "wrote graph"]);
      const next = await reloadGraph();
      if (next.nodes.some((n) => n.id === firId)) {
        setSelectedId(firId);
      }
    } catch (err) {
      setDeskLog([]);
      markKernel(err);
    } finally {
      setBusy(false);
    }
  }, [graph, kernelUp, reloadGraph, selectedId]);

  const loadCase = useCallback(async () => {
    if (!kernelUp) {
      setKernelAction("ingest");
      setKernelMsg(KERNEL_OFFLINE);
      return;
    }
    setKernelAction("ingest");
    setKernelMsg(null);
    setBusy(true);
    setDeskLog(["loading case…"]);
    const extra = caseName.trim();
    try {
      const body = extra
        ? { root: "data/raw", case: extra }
        : { root: "data/raw" };
      const result = await postIngest(body);
      setKernelUp(true);
      setDeskLog(result.log || ["wrote graph"]);
      const flash =
        result.flash ||
        (typeof result.objects === "number" && typeof result.links === "number"
          ? `${result.objects} objects · ${result.links} links`
          : null);
      setDeskFlash(flash);
      await reloadGraph();
    } catch (err) {
      setDeskLog([]);
      markKernel(err);
    } finally {
      setBusy(false);
    }
  }, [caseName, kernelUp, reloadGraph]);

  useEffect(() => {
    if (!deskFlash) return;
    const t = window.setTimeout(() => setDeskFlash(null), 4000);
    return () => window.clearTimeout(t);
  }, [deskFlash]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA";

      if (e.key === "Escape") {
        resetView();
        return;
      }
      if (e.key === "/" && !inInput) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [resetView]);

  const selected = useMemo(
    () => graph?.nodes.find((n) => n.id === selectedId) ?? null,
    [graph, selectedId],
  );

  const neighbors = useMemo(
    () => (graph && selected ? neighborsOf(graph, selected.id) : []),
    [graph, selected],
  );

  const provenance = useMemo(
    () => (graph && selected ? provenanceFor(graph, selected.id) : []),
    [graph, selected],
  );

  const labelOf = useCallback(
    (id: string) => {
      const node = graph?.nodes.find((n) => n.id === id);
      return humanLabel(node, id);
    },
    [graph],
  );

  const objectCount = sumCounts(graph?.meta?.object_counts) ?? graph?.nodes.length ?? null;
  const linkCount = sumCounts(graph?.meta?.link_counts) ?? graph?.edges.length ?? null;

  return (
    <div className="desk">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">JAAL</span>
          <span className="brand-sep">·</span>
          <span className="brand-case">Operation Grey Ledger</span>
        </div>
        <label className="search-box">
          <span className="sr-only">Search objects</span>
          <input
            ref={searchRef}
            type="search"
            className="search-input"
            placeholder="Name, phone, account…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
            }}
          />
        </label>
        <nav className="toolbar" aria-label="Investigation filters">
          <span className="toolbar-label">View</span>
          <button
            type="button"
            className={`tool-btn${viewMode === "all" ? " active" : ""}`}
            onClick={showAll}
          >
            All
          </button>
          <button
            type="button"
            className={`tool-btn${viewMode === "money" ? " active" : ""}`}
            onClick={showMoney}
          >
            Money
          </button>
          <button
            type="button"
            className={`tool-btn${viewMode === "calls" ? " active" : ""}`}
            onClick={showCalls}
          >
            Calls
          </button>
          <span className="toolbar-sep" aria-hidden="true" />
          <button type="button" className="tool-btn" onClick={findAccountant}>
            Find accountant
          </button>
          <button type="button" className="tool-btn" onClick={showPaidCycle}>
            PAID cycle
          </button>
          <button type="button" className="tool-btn" onClick={resetView}>
            Reset
          </button>
          <span className="toolbar-sep" aria-hidden="true" />
          <button type="button" className="tool-btn" onClick={runArrest} disabled={busy}>
            {offlineLabel("arrest", "Arrest selected")}
          </button>
          <label className="search-box">
            <span className="sr-only">Ask the kernel</span>
            <input
              ref={askRef}
              type="search"
              className="search-input ask-input"
              placeholder={offlineLabel("ask", "Ask…")}
              value={askQuery}
              onChange={(e) => setAskQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runAsk();
              }}
            />
          </label>
          <span className="toolbar-sep" aria-hidden="true" />
          <button
            type="button"
            className={`tool-btn${tab === "map" ? " active" : ""}`}
            onClick={() => setTab("map")}
          >
            Map
          </button>
          <button
            type="button"
            className={`tool-btn${tab === "analytics" ? " active" : ""}`}
            onClick={openAnalytics}
            disabled={busy}
          >
            {offlineLabel("analytics", "Analytics")}
          </button>
          <span className="toolbar-sep" aria-hidden="true" />
          <button
            type="button"
            className="tool-btn"
            onClick={replayDocket}
            disabled={busy}
          >
            {offlineLabel("pipeline", "Replay docket")}
          </button>
          <button
            type="button"
            className="tool-btn"
            onClick={rereadFir}
            disabled={busy}
          >
            {offlineLabel("extract", "Re-read this FIR")}
          </button>
          <input
            type="text"
            className="search-input case-input"
            placeholder="case folder"
            value={caseName}
            onChange={(e) => setCaseName(e.target.value)}
            disabled={busy}
          />
          <button
            type="button"
            className="tool-btn"
            onClick={loadCase}
            disabled={busy}
          >
            {offlineLabel("ingest", "Load case")}
          </button>
        </nav>
        <div className="counts">
          {loading ? (
            <span className="muted">loading counts…</span>
          ) : objectCount !== null && linkCount !== null ? (
            <>
              <span>{objectCount.toLocaleString()} objects</span>
              <span className="dot">·</span>
              <span>{linkCount.toLocaleString()} links</span>
            </>
          ) : null}
        </div>
      </header>
      {(deskLog.length > 0 || deskFlash) && (
        <div className="desk-log" role="status">
          {deskFlash && <span className="desk-flash">{deskFlash}</span>}
          {deskLog.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
      )}
      <div className="workspace">
        {tab === "analytics" ? (
          <Analytics
            data={analytics}
            error={kernelAction === "analytics" ? kernelMsg : null}
            loading={analyticsLoading}
            onSelectId={selectOnMap}
          />
        ) : (
          <Canvas
            ref={canvasRef}
            graph={graph}
            loading={loading}
            error={error}
            viewMode={viewMode}
            focusKind={focusKind}
            focusSeq={focusSeq}
            jumpToNodeId={jumpToNodeId}
            highlightIds={highlightIds}
            onSelect={setSelectedId}
            onJumpComplete={() => setJumpToNodeId(null)}
          />
        )}
        <Dossier
          node={selected}
          neighbors={neighbors}
          provenance={provenance}
          arrest={arrest}
          ask={ask}
          labelOf={labelOf}
          onSelectNeighbor={(id) => {
            setSelectedId(id);
            setTab("map");
            canvasRef.current?.focusNode(id);
          }}
        />
      </div>
    </div>
  );
}

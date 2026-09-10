import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, type CanvasHandle } from "./canvas/Canvas";
import { Dossier } from "./dossier/Dossier";
import { fetchGraph } from "./lib/api";
import {
  type FocusKind,
  type ViewMode,
  filterGraph,
  findNodeByQuery,
  neighborsOf,
  provenanceFor,
  sumCounts,
} from "./lib/graphView";
import type { GraphPayload } from "./lib/types";

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
  const canvasRef = useRef<CanvasHandle>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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
    setViewMode("all");
    setFocusKind("fit-all");
    setFocusSeq((s) => s + 1);
  }, []);

  const runSearch = useCallback(() => {
    if (!graph) return;
    const match = findNodeByQuery(graph, searchQuery);
    if (!match) return;

    const inFilter = filterGraph(graph, viewMode).nodes.some(
      (n) => n.id === match.id,
    );
    if (!inFilter) {
      setViewMode("all");
      setFocusKind("none");
    }
    setJumpToNodeId(match.id);
  }, [graph, searchQuery, viewMode]);

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
            placeholder="Search label or id…"
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
      <div className="workspace">
        <Canvas
          ref={canvasRef}
          graph={graph}
          loading={loading}
          error={error}
          viewMode={viewMode}
          focusKind={focusKind}
          focusSeq={focusSeq}
          jumpToNodeId={jumpToNodeId}
          onSelect={setSelectedId}
          onJumpComplete={() => setJumpToNodeId(null)}
        />
        <Dossier
          node={selected}
          neighbors={neighbors}
          provenance={provenance}
          onSelectNeighbor={(id) => {
            setSelectedId(id);
            canvasRef.current?.focusNode(id);
          }}
        />
      </div>
    </div>
  );
}

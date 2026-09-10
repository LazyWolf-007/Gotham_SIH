import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, type CanvasHandle } from "./canvas/Canvas";
import { Dossier } from "./dossier/Dossier";
import { fetchGraph } from "./lib/api";
import {
  type FocusKind,
  type ViewMode,
  neighborsOf,
  sumCounts,
} from "./lib/graphView";
import type { GraphPayload } from "./lib/types";

export default function App() {
  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [focusKind, setFocusKind] = useState<FocusKind>("naveen");
  const [focusSeq, setFocusSeq] = useState(0);
  const canvasRef = useRef<CanvasHandle>(null);

  useEffect(() => {
    let cancelled = false;
    fetchGraph()
      .then((payload) => {
        if (!cancelled) setGraph(payload);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load graph");
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

  const resetView = () => {
    setViewMode("all");
    setFocusKind("fit-all");
    setFocusSeq((s) => s + 1);
  };

  const selected = useMemo(
    () => graph?.nodes.find((n) => n.id === selectedId) ?? null,
    [graph, selectedId],
  );

  const neighbors = useMemo(
    () => (graph && selected ? neighborsOf(graph, selected.id) : []),
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
          {objectCount !== null && linkCount !== null ? (
            <>
              <span>{objectCount.toLocaleString()} objects</span>
              <span className="dot">·</span>
              <span>{linkCount.toLocaleString()} links</span>
            </>
          ) : (
            <span className="muted">loading counts…</span>
          )}
        </div>
      </header>
      <div className="workspace">
        <Canvas
          ref={canvasRef}
          graph={graph}
          error={error}
          viewMode={viewMode}
          focusKind={focusKind}
          focusSeq={focusSeq}
          onSelect={setSelectedId}
        />
        <Dossier
          node={selected}
          neighbors={neighbors}
          onSelectNeighbor={(id) => {
            setSelectedId(id);
            canvasRef.current?.selectNode(id);
          }}
        />
      </div>
    </div>
  );
}

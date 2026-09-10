import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, type CanvasHandle } from "./canvas/Canvas";
import { Dossier } from "./dossier/Dossier";
import { fetchGraph } from "./lib/api";
import { neighborsOf, sumCounts } from "./lib/graphView";
import type { GraphPayload } from "./lib/types";

export default function App() {
  const [graph, setGraph] = useState<GraphPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
        <button
          type="button"
          className="reset"
          onClick={() => canvasRef.current?.resetView()}
        >
          Reset view
        </button>
      </header>
      <div className="workspace">
        <Canvas
          ref={canvasRef}
          graph={graph}
          error={error}
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

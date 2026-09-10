import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import cytoscape, { type Core, type EventObject } from "cytoscape";
import {
  NAVEEN_ID,
  PAID_CYCLE_IDS,
  filterGraph,
  toElements,
  type FocusKind,
  type ViewMode,
} from "../lib/graphView";
import type { GraphPayload } from "../lib/types";
import { canvasStylesheet } from "./stylesheet";

export type CanvasHandle = {
  selectNode: (id: string) => void;
};

type Props = {
  graph: GraphPayload | null;
  error: string | null;
  viewMode: ViewMode;
  focusKind: FocusKind;
  focusSeq: number;
  onSelect: (id: string | null) => void;
};

function highlightNeighborhood(cy: Core, nodeId: string) {
  const node = cy.getElementById(nodeId);
  if (node.empty()) return;
  cy.elements().removeClass("faded neighbor focused");
  const keep = node.closedNeighborhood();
  cy.elements().difference(keep).addClass("faded");
  keep.edges().addClass("neighbor");
  keep.nodes().difference(node).addClass("neighbor");
  node.addClass("focused").select();
}

function showEgo(cy: Core, nodeId: string) {
  const node = cy.getElementById(nodeId);
  if (node.empty()) return;
  cy.elements().removeClass("ego-off faded neighbor focused");
  const keep = node.closedNeighborhood();
  cy.elements().difference(keep).addClass("ego-off");
  keep.edges().addClass("neighbor");
  keep.nodes().difference(node).addClass("neighbor");
  node.addClass("focused").select();
  cy.fit(keep, 72);
}

function focusPaidCycle(
  cy: Core,
  graph: GraphPayload,
  onSelect: (id: string | null) => void,
): boolean {
  for (const id of PAID_CYCLE_IDS) {
    if (!graph.nodes.some((n) => n.id === id)) return false;
  }

  cy.elements().removeClass("ego-off faded neighbor focused");

  const cycle = cy.collection();
  for (const id of PAID_CYCLE_IDS) {
    const node = cy.getElementById(id);
    if (node.empty()) return false;
    cycle.merge(node);
  }
  if (cycle.length !== PAID_CYCLE_IDS.length) return false;

  cy.elements().difference(cycle).addClass("faded");
  cycle.addClass("focused");
  cy.fit(cycle, 36);
  cy.center(cycle);
  onSelect(null);
  return true;
}

function applyFocus(
  cy: Core,
  kind: FocusKind,
  graph: GraphPayload,
  onSelect: (id: string | null) => void,
) {
  if (kind === "cycle") {
    focusPaidCycle(cy, graph, onSelect);
    return;
  }

  cy.elements().removeClass("ego-off faded neighbor focused");

  switch (kind) {
    case "naveen": {
      const node = cy.getElementById(NAVEEN_ID);
      if (node.empty()) return;
      cy.fit(cy.elements(), 48);
      cy.center(node);
      highlightNeighborhood(cy, NAVEEN_ID);
      onSelect(NAVEEN_ID);
      return;
    }
    case "fit-all":
      cy.fit(cy.elements(), 48);
      cy.elements().unselect();
      onSelect(null);
      return;
    case "none":
    default:
      cy.fit(cy.elements(), 48);
  }
}

export const Canvas = forwardRef<CanvasHandle, Props>(function Canvas(
  { graph, error, viewMode, focusKind, focusSeq, onSelect },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const onSelectRef = useRef(onSelect);
  const focusKindRef = useRef(focusKind);
  onSelectRef.current = onSelect;
  focusKindRef.current = focusKind;

  useImperativeHandle(ref, () => ({
    selectNode: (id: string) => {
      const cy = cyRef.current;
      if (!cy) return;
      const node = cy.getElementById(id);
      if (node.empty()) return;
      highlightNeighborhood(cy, id);
      onSelectRef.current(id);
    },
  }));

  useEffect(() => {
    if (!graph || !containerRef.current) return;

    const { nodes, edges } = filterGraph(graph, viewMode);
    const elements = toElements(nodes, edges, {
      highlightCycle: viewMode === "money",
    });
    if (elements.length === 0) return;

    let cancelled = false;
    const fitAllAfterLayout = focusKindRef.current !== "cycle";
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: canvasStylesheet,
      minZoom: 0.15,
      maxZoom: 3,
      wheelSensitivity: 0.28,
      boxSelectionEnabled: false,
      hideEdgesOnViewport: true,
      textureOnViewport: true,
      layout: {
        name: "cose",
        animate: false,
        fit: fitAllAfterLayout,
        padding: 48,
        nodeRepulsion: () => 9000,
        nodeOverlap: 8,
        idealEdgeLength: () => 72,
        gravity: 0.35,
        numIter: 800,
        randomize: true,
        initialTemp: 200,
        minTemp: 1,
      },
    });
    cyRef.current = cy;

    const onTapNode = (evt: EventObject) => {
      const id = evt.target.id();
      highlightNeighborhood(cy, id);
      onSelectRef.current(id);
    };
    const onDblTapNode = (evt: EventObject) => {
      const id = evt.target.id();
      showEgo(cy, id);
      onSelectRef.current(id);
    };

    cy.on("tap", "node", onTapNode);
    cy.on("dbltap", "node", onDblTapNode);

    const onLayoutStop = () => {
      if (cancelled || cy.destroyed()) return;
      applyFocus(cy, focusKindRef.current, graph, onSelectRef.current);
    };
    cy.one("layoutstop", onLayoutStop);

    return () => {
      cancelled = true;
      cy.destroy();
      cyRef.current = null;
    };
  }, [graph, viewMode]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || focusSeq === 0 || !graph) return;

    const run = () => {
      if (cy.destroyed()) return;
      applyFocus(cy, focusKind, graph, onSelectRef.current);
    };

    if (focusKind === "cycle") {
      cy.one("layoutstop", run);
      window.setTimeout(run, 0);
      return;
    }

    run();
  }, [focusSeq, focusKind, graph]);

  const filtered = graph ? filterGraph(graph, viewMode) : null;

  return (
    <section className="canvas-pane" aria-label="Investigation canvas">
      <div ref={containerRef} className="cy-root" />
      {!graph && !error && <div className="canvas-status">Loading kernel…</div>}
      {error && <div className="canvas-status error">{error}</div>}
      {graph && filtered && filtered.nodes.length === 0 && (
        <div className="canvas-status error">This view has no nodes.</div>
      )}
      <ul className="legend" aria-label="Object types">
        {viewMode === "calls" ? (
          <li>
            <span className="swatch" style={{ background: "#6FA8C9" }} />
            Phone
          </li>
        ) : (
          <>
            <li>
              <span className="swatch" style={{ background: "#D4B483" }} />
              Person
            </li>
            <li>
              <span className="swatch" style={{ background: "#8E6BBF" }} />
              Organization
            </li>
            <li>
              <span className="swatch" style={{ background: "#C9A227" }} />
              Account
            </li>
            <li>
              <span className="swatch" style={{ background: "#5B8C6A" }} />
              Location
            </li>
          </>
        )}
      </ul>
    </section>
  );
});

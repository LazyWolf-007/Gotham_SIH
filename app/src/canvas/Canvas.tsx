import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import cytoscape, { type Core, type EventObject } from "cytoscape";
import type { GraphPayload } from "../lib/types";
import {
  NAVEEN_ID,
  filterDefault,
  toElements,
} from "../lib/graphView";
import { canvasStylesheet } from "./stylesheet";

export type CanvasHandle = {
  resetView: () => void;
  selectNode: (id: string) => void;
};

type Props = {
  graph: GraphPayload | null;
  error: string | null;
  onSelect: (id: string) => void;
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

function focusNaveen(cy: Core) {
  const node = cy.getElementById(NAVEEN_ID);
  if (node.empty()) return false;
  cy.fit(cy.elements().not(".ego-off"), 48);
  cy.center(node);
  highlightNeighborhood(cy, NAVEEN_ID);
  return true;
}

export const Canvas = forwardRef<CanvasHandle, Props>(function Canvas(
  { graph, error, onSelect },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useImperativeHandle(ref, () => ({
    resetView: () => {
      const cy = cyRef.current;
      if (!cy) return;
      cy.elements().removeClass("ego-off faded neighbor focused");
      const ok = focusNaveen(cy);
      if (ok) onSelectRef.current(NAVEEN_ID);
    },
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

    const { nodes, edges } = filterDefault(graph);
    const elements = toElements(nodes, edges);
    if (elements.length === 0) return;

    let cancelled = false;
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
        fit: true,
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

    const ready = () => {
      if (cancelled || cy.destroyed()) return;
      const ok = focusNaveen(cy);
      if (ok) onSelectRef.current(NAVEEN_ID);
    };
    cy.one("layoutstop", ready);
    requestAnimationFrame(ready);

    return () => {
      cancelled = true;
      cy.destroy();
      cyRef.current = null;
    };
  }, [graph]);

  return (
    <section className="canvas-pane" aria-label="Investigation canvas">
      <div ref={containerRef} className="cy-root" />
      {!graph && !error && <div className="canvas-status">Loading kernel…</div>}
      {error && <div className="canvas-status error">{error}</div>}
      {graph && filterDefault(graph).nodes.length === 0 && (
        <div className="canvas-status error">Default view has no nodes.</div>
      )}
      <ul className="legend" aria-label="Object types">
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
      </ul>
    </section>
  );
});

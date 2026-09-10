import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import cytoscape, { type Core, type EventObject } from "cytoscape";
import {
  NAVEEN_ID,
  PAID_CYCLE_IDS,
  TYPE_COLORS,
  filterGraph,
  splitLinked,
  toElements,
  topBetweennessIds,
  type FocusKind,
  type ViewMode,
} from "../lib/graphView";
import type { GraphNode, GraphPayload } from "../lib/types";
import { canvasStylesheet } from "./stylesheet";

export type CanvasHandle = {
  selectNode: (id: string) => void;
  focusNode: (id: string) => boolean;
};

type Props = {
  graph: GraphPayload | null;
  loading: boolean;
  error: string | null;
  viewMode: ViewMode;
  focusKind: FocusKind;
  focusSeq: number;
  jumpToNodeId: string | null;
  onSelect: (id: string | null) => void;
  onJumpComplete: () => void;
};

const LABEL_ZOOM = 0.6;

function applyLabelVisibility(cy: Core) {
  const selectedOnly = Boolean(cy.scratch("_selectedLabelsOnly"));
  cy.nodes().removeClass("labeled");
  if (!selectedOnly && cy.zoom() >= LABEL_ZOOM) {
    cy.nodes().filter((n) => Boolean(n.data("showLabel"))).addClass("labeled");
  }
  cy.$("node:selected, node.focused").addClass("labeled");
}

function focusNode(cy: Core, nodeId: string, onSelect: (id: string | null) => void) {
  const node = cy.getElementById(nodeId);
  if (node.empty()) return false;
  cy.elements().removeClass("ego-off faded neighbor focused");
  highlightNeighborhood(cy, nodeId);
  cy.fit(node.closedNeighborhood(), 72);
  cy.center(node);
  onSelect(nodeId);
  return true;
}

function highlightNeighborhood(cy: Core, nodeId: string) {
  const node = cy.getElementById(nodeId);
  if (node.empty()) return;
  cy.elements().removeClass("faded neighbor focused");
  const keep = node.closedNeighborhood();
  cy.elements().difference(keep).addClass("faded");
  keep.edges().addClass("neighbor");
  keep.nodes().difference(node).addClass("neighbor");
  node.addClass("focused").select();
  applyLabelVisibility(cy);
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
  applyLabelVisibility(cy);
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
  applyLabelVisibility(cy);
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
      highlightNeighborhood(cy, NAVEEN_ID);
      cy.fit(node.closedNeighborhood(), 72);
      onSelect(NAVEEN_ID);
      return;
    }
    case "fit-all":
      cy.fit(cy.elements(), 48);
      cy.elements().unselect();
      applyLabelVisibility(cy);
      onSelect(null);
      return;
    case "none":
    default:
      applyLabelVisibility(cy);
      cy.fit(cy.elements(), 48);
  }
}

export const Canvas = forwardRef<CanvasHandle, Props>(function Canvas(
  {
    graph,
    loading,
    error,
    viewMode,
    focusKind,
    focusSeq,
    jumpToNodeId,
    onSelect,
    onJumpComplete,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);
  const onSelectRef = useRef(onSelect);
  const onJumpCompleteRef = useRef(onJumpComplete);
  const focusKindRef = useRef(focusKind);
  const jumpToNodeIdRef = useRef(jumpToNodeId);
  const [unlinkedOpen, setUnlinkedOpen] = useState(false);
  const [unlinkedQuery, setUnlinkedQuery] = useState("");
  onSelectRef.current = onSelect;
  onJumpCompleteRef.current = onJumpComplete;
  focusKindRef.current = focusKind;
  jumpToNodeIdRef.current = jumpToNodeId;

  useImperativeHandle(ref, () => ({
    selectNode: (id: string) => {
      const cy = cyRef.current;
      if (!cy) return;
      const node = cy.getElementById(id);
      if (node.empty()) return;
      highlightNeighborhood(cy, id);
      onSelectRef.current(id);
    },
    focusNode: (id: string) => {
      const cy = cyRef.current;
      if (!cy) return false;
      return focusNode(cy, id, onSelectRef.current);
    },
  }));

  useEffect(() => {
    if (!graph || !containerRef.current) return;

    const filtered = filterGraph(graph, viewMode);
    const { linked, edges } = splitLinked(filtered.nodes, filtered.edges);
    const selectedLabelsOnly = viewMode !== "all";
    const elements = toElements(linked, edges, {
      highlightCycle: viewMode === "money",
      labeledIds: selectedLabelsOnly ? new Set() : topBetweennessIds(linked, 12),
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
        nodeOverlap: 20,
        idealEdgeLength: () => 72,
        gravity: 0.35,
        numIter: 800,
        randomize: true,
        initialTemp: 200,
        minTemp: 1,
      },
    });
    cyRef.current = cy;
    cy.scratch("_selectedLabelsOnly", selectedLabelsOnly);

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
    const onMouseOverNode = (evt: EventObject) => {
      cy.nodes().removeClass("hovered");
      if (selectedLabelsOnly) return;
      if (cy.zoom() >= LABEL_ZOOM) evt.target.addClass("hovered");
    };
    const onMouseOutNode = (evt: EventObject) => {
      evt.target.removeClass("hovered");
    };
    const onZoom = () => applyLabelVisibility(cy);

    cy.on("tap", "node", onTapNode);
    cy.on("dbltap", "node", onDblTapNode);
    cy.on("mouseover", "node", onMouseOverNode);
    cy.on("mouseout", "node", onMouseOutNode);
    cy.on("zoom", onZoom);

    const onLayoutStop = () => {
      if (cancelled || cy.destroyed()) return;
      applyLabelVisibility(cy);
      const jumpId = jumpToNodeIdRef.current;
      if (jumpId && focusNode(cy, jumpId, onSelectRef.current)) {
        onJumpCompleteRef.current();
        return;
      }
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

  useEffect(() => {
    if (!jumpToNodeId || !graph) return;
    const cy = cyRef.current;
    if (!cy) return;

    const jump = () => {
      if (cy.destroyed()) return;
      if (focusNode(cy, jumpToNodeId, onSelectRef.current)) {
        onJumpCompleteRef.current();
        return;
      }
      onSelectRef.current(jumpToNodeId);
      onJumpCompleteRef.current();
    };

    cy.one("layoutstop", jump);
    window.setTimeout(jump, 0);
  }, [jumpToNodeId, graph, viewMode]);

  const filtered = graph ? filterGraph(graph, viewMode) : null;
  const partitioned = filtered
    ? splitLinked(filtered.nodes, filtered.edges)
    : null;
  const unlinked = partitioned?.unlinked ?? [];
  const q = unlinkedQuery.trim().toLowerCase();
  const unlinkedShown = q
    ? unlinked.filter(
        (n) =>
          n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q),
      )
    : unlinked;

  const pickUnlinked = (node: GraphNode) => {
    const cy = cyRef.current;
    if (cy && !cy.destroyed()) {
      cy.elements().unselect().removeClass("focused neighbor faded hovered");
      applyLabelVisibility(cy);
    }
    onSelect(node.id);
  };

  return (
    <section className="canvas-pane" aria-label="Investigation canvas">
      <div ref={containerRef} className="cy-root" />
      {loading && !error && (
        <div className="canvas-status">
          <span className="spinner" aria-hidden="true" />
          Loading kernel…
        </div>
      )}
      {error && <div className="canvas-status error">{error}</div>}
      {graph && partitioned && partitioned.linked.length === 0 && (
        <div className="canvas-status error">This view has no nodes.</div>
      )}
      {unlinked.length > 0 && (
        <div className="unlinked-dock">
          <button
            type="button"
            className="unlinked-badge"
            onClick={() => setUnlinkedOpen((open) => !open)}
            aria-expanded={unlinkedOpen}
          >
            <span>{unlinked.length} unlinked</span>
            <span className="unlinked-count">{unlinkedOpen ? "hide" : "list"}</span>
          </button>
          {unlinkedOpen && (
            <div className="unlinked-panel">
              <input
                type="search"
                className="unlinked-search"
                placeholder="Search unlinked…"
                value={unlinkedQuery}
                onChange={(e) => setUnlinkedQuery(e.target.value)}
              />
              <ul className="unlinked-list">
                {unlinkedShown.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => pickUnlinked(n)}>
                      <span
                        className="swatch"
                        style={{
                          background: TYPE_COLORS[n.type] ?? "#8A8F98",
                        }}
                      />
                      <span className="unlinked-name">{n.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <ul className="legend" aria-label="Object types">
        {viewMode === "calls" ? (
          <li>
            <span className="swatch" style={{ background: TYPE_COLORS.Phone }} />
            Phone
          </li>
        ) : (
          <>
            <li>
              <span className="swatch" style={{ background: TYPE_COLORS.Person }} />
              Person
            </li>
            <li>
              <span
                className="swatch"
                style={{ background: TYPE_COLORS.Organization }}
              />
              Organization
            </li>
            <li>
              <span className="swatch" style={{ background: TYPE_COLORS.Account }} />
              Account
            </li>
            <li>
              <span className="swatch" style={{ background: TYPE_COLORS.Location }} />
              Location
            </li>
          </>
        )}
      </ul>
    </section>
  );
});

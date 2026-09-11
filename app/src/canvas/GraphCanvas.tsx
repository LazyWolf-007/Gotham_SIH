import React, { useEffect, useRef, useState, useCallback } from "react";
import cytoscape, { Core, EventObject, LayoutOptions } from "cytoscape";
import { GraphNode, GraphEdge, FilterState, CutResult, PatternHit, ObjectType, LinkType } from "../types";
import { OBJECT_TYPE_COLORS, LINK_TYPE_COLORS, COMMUNITY_PALETTE } from "../lib/theme";

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  selectedEdgeId: string | null;
  onSelectEdge: (edge: GraphEdge | null) => void;
  filterState: FilterState;
  colorByCommunity: boolean;
  activePattern: string | null;
  patterns: PatternHit[];
  arrestTarget: string | null;
  arrestCutResult: CutResult | null;
  highlightedNodeIds: string[];
  layoutName: string;
  onLayoutChange: (layout: string) => void;
  showLabels: boolean;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  selectedEdgeId,
  onSelectEdge,
  filterState,
  colorByCommunity,
  activePattern,
  patterns,
  arrestTarget,
  arrestCutResult,
  highlightedNodeIds,
  layoutName,
  showLabels,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      boxSelectionEnabled: true,
      wheelSensitivity: 0.25,
      minZoom: 0.1,
      maxZoom: 3.5,
      style: ([
        {
          selector: "node",
          style: {
            "background-color": "#3b82f6",
            "border-width": 2,
            "border-color": "#60a5fa",
            label: showLabels ? "data(label)" : "",
            "font-size": "11px",
            "font-family": "Inter, system-ui, sans-serif",
            "text-valign": "bottom",
            "text-margin-y": 6,
            color: "#e2e8f0",
            "text-outline-color": "#090d16",
            "text-outline-width": 2,
            width: 32,
            height: 32,
            "transition-property": "background-color, border-color, width, height, opacity",
            "transition-duration": 0.2,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.5,
            "line-color": "#475569",
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "target-arrow-color": "#475569",
            "arrow-scale": 0.9,
            opacity: 0.4,
            "transition-property": "line-color, target-arrow-color, width, opacity",
            "transition-duration": 0.2,
          },
        },
        // Selected node
        {
          selector: "node:selected, node.selected",
          style: {
            "border-width": 4,
            "border-color": "#ffffff",
            "shadow-blur": 15,
            "shadow-color": "#38bdf8",
            "shadow-opacity": 0.9,
            "z-index": 999,
          },
        },
        // Highlighted node (from 2-hop / search / copilot)
        {
          selector: "node.highlighted",
          style: {
            "border-width": 3.5,
            "border-color": "#38bdf8",
            "shadow-blur": 18,
            "shadow-color": "#38bdf8",
            "shadow-opacity": 0.8,
            "z-index": 500,
          },
        },
        // Selected edge
        {
          selector: "edge:selected, edge.selected",
          style: {
            width: 4.0,
            "line-color": "#38bdf8",
            "target-arrow-color": "#38bdf8",
            opacity: 1.0,
            "z-index": 999,
          },
        },
        // Hawala Cycle Pattern Edge
        {
          selector: "edge.hawala-edge",
          style: {
            width: 4.5,
            "line-color": "#10b981",
            "target-arrow-color": "#10b981",
            opacity: 1.0,
            "curve-style": "bezier",
            "z-index": 900,
          },
        },
        // Hawala Cycle Pattern Node
        {
          selector: "node.hawala-node",
          style: {
            "border-width": 4,
            "border-color": "#34d399",
            "shadow-blur": 25,
            "shadow-color": "#10b981",
            "shadow-opacity": 1.0,
            "z-index": 900,
          },
        },
        // Arrest Target (struck out)
        {
          selector: "node.arrested-target",
          style: {
            "background-color": "#ef4444",
            "border-color": "#b91c1c",
            "border-width": 5,
            "border-style": "double",
            opacity: 0.85,
            "shadow-blur": 25,
            "shadow-color": "#ef4444",
            "shadow-opacity": 1.0,
            "z-index": 1000,
          },
        },
        // Arrest Severed Edges
        {
          selector: "edge.severed-edge",
          style: {
            "line-color": "#ef4444",
            "target-arrow-color": "#ef4444",
            "line-style": "dashed",
            opacity: 0.15,
            width: 1,
            "z-index": 1,
          },
        },
        // Residual surviving path (pulsing amber/red)
        {
          selector: "edge.residual-edge",
          style: {
            "line-color": "#f59e0b",
            "target-arrow-color": "#f59e0b",
            width: 4.5,
            opacity: 1.0,
            "curve-style": "bezier",
            "z-index": 950,
          },
        },
        {
          selector: "node.residual-node",
          style: {
            "border-width": 4,
            "border-color": "#fbbf24",
            "shadow-blur": 20,
            "shadow-color": "#f59e0b",
            "shadow-opacity": 0.9,
            "z-index": 950,
          },
        },
        // Dimmed out nodes when focusing on neighborhood
        {
          selector: "node.dimmed",
          style: {
            opacity: 0.12,
          },
        },
        {
          selector: "edge.dimmed",
          style: {
            opacity: 0.04,
          },
        },
      ] as any),
    });

    // Event listeners
    cy.on("tap", "node", (evt: EventObject) => {
      const node = evt.target;
      onSelectNode(node.id());
    });

    cy.on("tap", "edge", (evt: EventObject) => {
      const edge = evt.target;
      const edgeData = edge.data("raw") as GraphEdge;
      onSelectEdge(edgeData || null);
    });

    cy.on("tap", (evt: EventObject) => {
      if (evt.target === cy) {
        onSelectNode(null);
        onSelectEdge(null);
      }
    });

    cy.on("mouseover", "node", (evt: EventObject) => {
      const node = evt.target;
      const raw = node.data("raw") as GraphNode;
      setHoveredNode(raw || null);
    });

    cy.on("mouseout", "node", () => {
      setHoveredNode(null);
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  // Update elements when nodes or edges change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || nodes.length === 0) return;

    cy.batch(() => {
      cy.elements().remove();

      // Add nodes
      const cyNodes = nodes.map((n) => {
        const typeCfg = OBJECT_TYPE_COLORS[n.type] || { bg: "#64748b", border: "#94a3b8" };
        const bw = n.metrics?.betweenness || 0;
        // Scale size by betweenness centrality (Naveen Bhatia has top rank)
        const size = Math.max(28, Math.min(68, 28 + Math.sqrt(bw) * 220));

        let bgColor = typeCfg.bg;
        let borderColor = typeCfg.border;

        if (colorByCommunity && n.metrics?.community !== undefined) {
          const commIndex = n.metrics.community % COMMUNITY_PALETTE.length;
          bgColor = COMMUNITY_PALETTE[commIndex];
          borderColor = "#ffffff";
        }

        return {
          group: "nodes" as const,
          data: {
            id: n.id,
            label: n.label || n.id,
            type: n.type,
            raw: n,
          },
          style: {
            "background-color": bgColor,
            "border-color": borderColor,
            width: size,
            height: size,
          },
        };
      });

      // Add edges
      const cyEdges = edges.map((e, idx) => {
        const typeCfg = LINK_TYPE_COLORS[e.type] || { color: "#64748b", style: "solid", width: 1.5 };
        const edgeId = e.id || `edge-${e.source}-${e.target}-${idx}`;
        return {
          group: "edges" as const,
          data: {
            id: edgeId,
            source: e.source,
            target: e.target,
            type: e.type,
            raw: e,
          },
          style: {
            "line-color": typeCfg.color,
            "target-arrow-color": typeCfg.color,
            "line-style": typeCfg.style,
            width: typeCfg.width,
          },
        };
      });

      cy.add([...cyNodes, ...cyEdges]);
    });

    // Run layout
    runLayout(layoutName);
  }, [nodes, edges, colorByCommunity]);

  // Run layout function
  const runLayout = useCallback((layoutType: string) => {
    const cy = cyRef.current;
    if (!cy || cy.nodes().length === 0) return;

    let options: any = { name: "cose", animate: false, randomize: false };

    switch (layoutType) {
      case "cose":
        options = {
          name: "cose",
          animate: false,
          randomize: false,
          nodeRepulsion: () => 8000,
          idealEdgeLength: () => 65,
          edgeElasticity: () => 100,
          gravity: 0.25,
          numIter: 400,
          nodeOverlap: 20,
        };
        break;
      case "concentric":
        options = {
          name: "concentric",
          animate: false,
          concentric: (node: any) => {
            const raw = node.data("raw") as GraphNode;
            return (raw?.metrics?.betweenness || 0) * 1000 + (raw?.metrics?.degree || 0);
          },
          levelWidth: () => 2,
          minNodeSpacing: 35,
        };
        break;
      case "breadthfirst":
        options = {
          name: "breadthfirst",
          directed: true,
          animate: false,
          spacingFactor: 1.3,
        };
        break;
      case "circle":
        options = {
          name: "circle",
          animate: false,
          spacingFactor: 1.2,
        };
        break;
      case "grid":
        options = {
          name: "grid",
          animate: false,
        };
        break;
      default:
        options = { name: "cose", animate: false };
    }

    const l = cy.layout(options);
    l.run();
    cy.fit(undefined, 30);
  }, []);

  // Update layout when layoutName prop changes
  useEffect(() => {
    runLayout(layoutName);
  }, [layoutName, runLayout]);

  // Toggle labels
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.style().selector("node").style("label", showLabels ? "data(label)" : "").update();
  }, [showLabels]);

  // Handle Selection & Highlighting & Filters & Overlays
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      // Reset classes
      cy.elements().removeClass([
        "selected",
        "highlighted",
        "dimmed",
        "hawala-node",
        "hawala-edge",
        "arrested-target",
        "severed-edge",
        "residual-node",
        "residual-edge",
      ]);

      // Apply Filtering (Object Types, Link Types, Betweenness, etc.)
      cy.nodes().forEach((n) => {
        const raw = n.data("raw") as GraphNode;
        if (!raw) return;

        let visible = true;
        if (!filterState.selectedObjectTypes.has(raw.type)) visible = false;
        if ((raw.metrics?.betweenness || 0) < filterState.minBetweenness) visible = false;
        if (filterState.communityFilter !== "all" && raw.metrics?.community !== filterState.communityFilter) visible = false;

        if (filterState.searchQuery.trim()) {
          const q = filterState.searchQuery.toLowerCase();
          const match =
            raw.id.toLowerCase().includes(q) ||
            (raw.label && raw.label.toLowerCase().includes(q)) ||
            (raw.attributes?.name && raw.attributes.name.toLowerCase().includes(q));
          if (!match) visible = false;
        }

        n.style("display", visible ? "element" : "none");
      });

      cy.edges().forEach((e) => {
        const raw = e.data("raw") as GraphEdge;
        if (!raw) return;

        let visible = true;
        if (!filterState.selectedLinkTypes.has(raw.type)) visible = false;
        if (raw.type === "PAID" && (raw.attributes?.amount_inr || 0) < filterState.minTransactionAmount) visible = false;

        const srcNode = cy.getElementById(raw.source);
        const tgtNode = cy.getElementById(raw.target);
        if (srcNode.style("display") === "none" || tgtNode.style("display") === "none") {
          visible = false;
        }

        e.style("display", visible ? "element" : "none");
      });

      // 1. Selected node & 1-hop neighborhood highlight
      if (selectedNodeId) {
        const targetNode = cy.getElementById(selectedNodeId);
        if (targetNode.length > 0) {
          targetNode.addClass("selected");
          const neighborhood = targetNode.neighborhood();
          neighborhood.addClass("highlighted");

          if (filterState.isolatedSeedId === selectedNodeId) {
            cy.elements().not(targetNode).not(neighborhood).addClass("dimmed");
          }
        }
      }

      // 2. Selected edge
      if (selectedEdgeId) {
        const edge = cy.getElementById(selectedEdgeId);
        if (edge.length > 0) {
          edge.addClass("selected");
          edge.connectedNodes().addClass("highlighted");
        }
      }

      // 3. Highlighted Node IDs (e.g. from Copilot citations or Search)
      if (highlightedNodeIds && highlightedNodeIds.length > 0) {
        highlightedNodeIds.forEach((nid) => {
          const el = cy.getElementById(nid);
          if (el.length > 0) el.addClass("highlighted");
        });
      }

      // 4. Hawala Cycle Overlay
      if (activePattern === "hawala_cycle") {
        const hawalaHit = patterns.find((p) => p.pattern === "hawala_cycle");
        if (hawalaHit) {
          hawalaHit.nodes.forEach((nid) => {
            const el = cy.getElementById(nid);
            if (el.length > 0) el.addClass("hawala-node");
          });
          hawalaHit.edges.forEach((eid) => {
            const el = cy.getElementById(eid);
            if (el.length > 0) el.addClass("hawala-edge");
          });
          // Also mark nodes by edges
          cy.edges(".hawala-edge").connectedNodes().addClass("hawala-node");
        }
      }

      // 5. Counterfactual Arrest Simulation Overlay
      if (arrestTarget) {
        const targetNode = cy.getElementById(arrestTarget);
        if (targetNode.length > 0) {
          targetNode.addClass("arrested-target");
          targetNode.connectedEdges().addClass("severed-edge");
        }

        if (arrestCutResult?.residual_path_ph02_ph03) {
          const path = arrestCutResult.residual_path_ph02_ph03;
          path.forEach((nid) => {
            const el = cy.getElementById(nid);
            if (el.length > 0) el.addClass("residual-node");
          });

          // Highlight edges between adjacent nodes in path
          for (let i = 0; i < path.length - 1; i++) {
            const u = path[i];
            const v = path[i + 1];
            const connectingEdges = cy.edges(`[source = "${u}"][target = "${v}"], [source = "${v}"][target = "${u}"]`);
            connectingEdges.addClass("residual-edge");
          }
        }
      }
    });
  }, [
    selectedNodeId,
    selectedEdgeId,
    highlightedNodeIds,
    filterState,
    activePattern,
    patterns,
    arrestTarget,
    arrestCutResult,
  ]);

  // Center/Zoom to selected node
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !selectedNodeId) return;

    const el = cy.getElementById(selectedNodeId);
    if (el.length > 0 && el.isNode()) {
      cy.animate({
        center: { eles: el },
        zoom: Math.max(cy.zoom(), 1.3),
        duration: 350,
      });
    }
  }, [selectedNodeId]);

  return (
    <div className="relative w-full h-full bg-[#070b13] overflow-hidden select-none">
      {/* Cytoscape Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Hover Tooltip */}
      {hoveredNode && (
        <div className="absolute top-4 left-4 z-40 bg-[#0f172a]/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-xs shadow-2xl pointer-events-none max-w-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: OBJECT_TYPE_COLORS[hoveredNode.type]?.bg || "#64748b" }}
            />
            <span className="font-semibold text-slate-100">{hoveredNode.label}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
              {hoveredNode.type}
            </span>
          </div>
          <div className="space-y-1 text-slate-300 font-mono text-[11px]">
            <div>ID: <span className="text-sky-400">{hoveredNode.id}</span></div>
            {hoveredNode.metrics?.betweenness !== undefined && (
              <div>
                Betweenness:{" "}
                <span className="text-amber-400 font-bold">
                  {hoveredNode.metrics.betweenness.toFixed(6)}
                </span>
                {hoveredNode.metrics.betweenness_rank_persons && (
                  <span className="text-amber-300 ml-1">
                    (Rank #{hoveredNode.metrics.betweenness_rank_persons})
                  </span>
                )}
              </div>
            )}
            {hoveredNode.metrics?.degree !== undefined && (
              <div>Degree: <span className="text-emerald-400">{hoveredNode.metrics.degree}</span></div>
            )}
            {hoveredNode.metrics?.community !== undefined && (
              <div>Community Cluster: <span className="text-purple-400">#{hoveredNode.metrics.community}</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

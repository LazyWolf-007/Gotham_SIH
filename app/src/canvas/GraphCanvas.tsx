import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import cytoscape, { Core, EventObject } from "cytoscape";
import { GraphNode, GraphEdge, FilterState, CutResult, PatternHit, ObjectType, LinkType } from "../types";
import { OBJECT_TYPE_COLORS, OBJECT_TYPE_SHAPES, LINK_TYPE_COLORS, COMMUNITY_PALETTE } from "../lib/theme";
import {
  Crosshair,
  Plus,
  Minus,
  Maximize2,
  RotateCcw,
  Sparkles,
  PhoneCall,
  DollarSign,
  Share2,
  AlertTriangle,
  Layers,
  Eye,
  Info,
  ExternalLink,
  ArrowRight,
  Shield,
  Clock,
} from "lucide-react";

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
  onResetView?: () => void;
  onClearPattern?: () => void;
  onClearArrest?: () => void;
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
  onResetView,
  onClearPattern,
  onClearArrest,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  // Hover states for nodes and edges
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<{ edge: GraphEdge; x: number; y: number } | null>(null);

  // Zoom level state for progressive label revelation
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Key hubs that warrant default labels
  const KEY_ENTITY_IDS = useMemo(
    () =>
      new Set([
        "person:naveen_bhatia",
        "person:rakesh_mundhe",
        "person:vikram_haleja",
        "person:farhan_lodhi",
        "loc:azadpur_mandi",
        "org:bhatia_associates",
      ]),
    []
  );

  // Active Mode Computation
  const activeMode = useMemo(() => {
    if (arrestTarget) return "ARREST SIMULATION";
    if (activePattern) return "PATTERN ANALYSIS";
    if (filterState.isolatedSeedId) return "2-HOP INVESTIGATION";
    if (selectedNodeId) return "FOCUS MODE";
    return "OVERVIEW";
  }, [arrestTarget, activePattern, filterState.isolatedSeedId, selectedNodeId]);

  // 1. Initialize Cytoscape Instance
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      boxSelectionEnabled: false,
      wheelSensitivity: 0.2,
      minZoom: 0.15,
      maxZoom: 3.5,
      style: [
        // ==========================================
        // 1. BASELINE NODE STYLING (Disciplined Scale)
        // ==========================================
        {
          selector: "node",
          style: {
            shape: "data(shape)" as any,
            "background-color": "data(bg)",
            "border-width": 1.5,
            "border-color": "data(border)",
            label: showLabels ? "data(displayLabel)" : "",
            "font-size": "9px",
            "font-family": "Inter, system-ui, -apple-system, sans-serif",
            "font-weight": 500,
            "text-valign": "bottom",
            "text-margin-y": 4,
            "text-max-width": "90px",
            "text-wrap": "ellipsis",
            color: "#D4D8DE",
            "text-background-color": "rgba(10, 13, 16, 0.94)",
            "text-background-opacity": 0.94,
            "text-background-padding": "2px 5px",
            "text-background-shape": "roundrectangle",
            "text-border-color": "#20252A",
            "text-border-width": 0.5,
            "text-border-opacity": 0.8,
            "min-zoomed-font-size": 8, // Stable zoom: prevents unreadable text speckles
            width: "data(size)",
            height: "data(size)",
            "transition-property": "background-color, border-color, width, height, opacity, border-width",
            "transition-duration": 0.2,
            "z-index": 10,
          },
        },

        // ==========================================
        // 2. BASELINE EDGE STYLING (Subdued Hairline Web)
        // ==========================================
        {
          selector: "edge",
          style: {
            width: 0.75,
            "line-color": "#182029",
            "curve-style": "bezier",
            "target-arrow-shape": "triangle",
            "target-arrow-color": "#182029",
            "arrow-scale": 0.45,
            opacity: 0.07, // Subdued mesh so 4,000 edges do not clutter
            "transition-property": "line-color, target-arrow-color, width, opacity",
            "transition-duration": 0.2,
            "z-index": 1,
          },
        },

        // ==========================================
        // 3. HOVERED STATES
        // ==========================================
        {
          selector: "node:hover, node.hovered",
          style: {
            label: "data(label)",
            "border-width": 2.5,
            "border-color": "#F2F2F2",
            "z-index": 900,
          },
        },
        {
          selector: "edge:hover",
          style: {
            width: 2.2,
            opacity: 0.75,
            "line-color": "#94A3B8",
            "target-arrow-color": "#94A3B8",
            "arrow-scale": 0.75,
            "z-index": 500,
          },
        },

        // ==========================================
        // 4. SELECTED NODE (100% Visual Priority)
        // ==========================================
        {
          selector: "node:selected, node.selected",
          style: {
            label: "data(label)",
            "font-size": "11px",
            "font-weight": "bold",
            color: "#FFFFFF",
            "border-width": 3.5,
            "border-color": "#FF3038",
            "shadow-blur": 16,
            "shadow-color": "#E21B23",
            "shadow-opacity": 0.85,
            "text-background-color": "#0E1216",
            "text-border-color": "#FF3038",
            "text-border-width": 1,
            width: 36,
            height: 36,
            opacity: 1.0,
            "z-index": 1000,
          },
        },

        // ==========================================
        // 5. 1-HOP NEIGHBORS (70-85% Priority)
        // ==========================================
        {
          selector: "node.hop1-node",
          style: {
            label: "data(label)",
            "border-width": 2.2,
            "border-color": "#E21B23",
            opacity: 0.85,
            "z-index": 800,
          },
        },
        {
          selector: "edge.hop1-edge, edge.connected-edge",
          style: {
            width: 2.2,
            "line-color": "data(highlightColor)",
            "target-arrow-color": "data(highlightColor)",
            "arrow-scale": 0.75,
            opacity: 0.88,
            "z-index": 800,
          },
        },
        {
          selector: "edge:selected, edge.selected",
          style: {
            width: 3.5,
            "line-color": "#FF3038",
            "target-arrow-color": "#FF3038",
            "arrow-scale": 0.95,
            opacity: 1.0,
            label: "data(edgeLabel)",
            "font-size": "9px",
            "font-family": "Inter, monospace",
            color: "#F2F2F2",
            "text-background-color": "#0E1216",
            "text-background-opacity": 0.95,
            "text-background-padding": "2px 4px",
            "text-border-color": "#FF3038",
            "text-border-width": 0.5,
            "z-index": 999,
          },
        },

        // ==========================================
        // 6. 2-HOP NEIGHBORS (35-55% Priority)
        // ==========================================
        {
          selector: "node.hop2-node",
          style: {
            opacity: 0.45,
            "border-width": 1.2,
            "border-color": "#64748B",
            "z-index": 300,
          },
        },
        {
          selector: "edge.hop2-edge",
          style: {
            width: 1.1,
            "line-color": "#2E3B4E",
            "target-arrow-color": "#2E3B4E",
            "arrow-scale": 0.55,
            opacity: 0.35,
            "z-index": 300,
          },
        },

        // ==========================================
        // 7. BACKGROUND NODES & EDGES (10-20% Priority)
        // ==========================================
        {
          selector: "node.background-node",
          style: {
            opacity: 0.15, // Visible context, not completely hidden
            label: "",
            "z-index": 5,
          },
        },
        {
          selector: "edge.background-edge",
          style: {
            opacity: 0.035,
            width: 0.65,
            "line-color": "#182029",
            "target-arrow-color": "#182029",
            "z-index": 1,
          },
        },

        // ==========================================
        // 8. PATTERN MODE STYLING
        // ==========================================
        {
          selector: "edge.hawala-edge",
          style: {
            width: 3.5,
            "line-color": "#E21B23",
            "target-arrow-color": "#FF3038",
            "arrow-scale": 0.95,
            opacity: 1.0,
            "curve-style": "bezier",
            "z-index": 950,
          },
        },
        {
          selector: "node.hawala-node",
          style: {
            label: "data(label)",
            "border-width": 3.0,
            "border-color": "#FF3038",
            "shadow-blur": 15,
            "shadow-color": "#E21B23",
            "shadow-opacity": 0.85,
            "text-background-color": "#0E1216",
            "text-border-color": "#FF3038",
            "text-border-width": 1,
            opacity: 1.0,
            "z-index": 950,
          },
        },
        {
          selector: "node.pattern-support",
          style: {
            opacity: 0.50,
            "border-color": "#94A3B8",
            "z-index": 400,
          },
        },

        // ==========================================
        // 9. COUNTERFACTUAL ARREST SIMULATION
        // ==========================================
        {
          selector: "node.arrested-target",
          style: {
            label: "data(label)",
            "background-color": "#7F1D1D",
            "border-color": "#FF3038",
            "border-width": 3.5,
            "border-style": "double",
            opacity: 0.9,
            "shadow-blur": 18,
            "shadow-color": "#E21B23",
            "shadow-opacity": 0.9,
            "z-index": 1000,
          },
        },
        {
          selector: "edge.severed-edge",
          style: {
            "line-color": "#EF4444",
            "target-arrow-color": "#EF4444",
            "line-style": "dashed",
            opacity: 0.25,
            width: 1.2,
            "z-index": 2,
          },
        },
        {
          selector: "edge.residual-edge",
          style: {
            "line-color": "#F59E0B",
            "target-arrow-color": "#F59E0B",
            width: 3.5,
            opacity: 1.0,
            "arrow-scale": 0.85,
            "curve-style": "bezier",
            "z-index": 960,
          },
        },
        {
          selector: "node.residual-node",
          style: {
            label: "data(label)",
            "border-width": 3,
            "border-color": "#FBBF24",
            "shadow-blur": 14,
            "shadow-color": "#F59E0B",
            "shadow-opacity": 0.8,
            "text-border-color": "#F59E0B",
            "text-border-width": 1,
            opacity: 1.0,
            "z-index": 960,
          },
        },
      ] as any,
    });

    // Node & Edge Events
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

    // Hover on Node
    cy.on("mouseover", "node", (evt: EventObject) => {
      const node = evt.target;
      node.addClass("hovered");
      const raw = node.data("raw") as GraphNode;
      setHoveredNode(raw || null);
      const renderedPos = node.renderedPosition();
      setHoverPosition({ x: renderedPos.x, y: renderedPos.y });
    });

    cy.on("mouseout", "node", (evt: EventObject) => {
      const node = evt.target;
      node.removeClass("hovered");
      setHoveredNode(null);
      setHoverPosition(null);
    });

    // Hover on Edge (Phase 4 Edge Inspection)
    cy.on("mouseover", "edge", (evt: EventObject) => {
      const edge = evt.target;
      const raw = edge.data("raw") as GraphEdge;
      const midpoint = edge.midpoint();
      const pan = cy.pan();
      const zoom = cy.zoom();
      const screenX = midpoint.x * zoom + pan.x;
      const screenY = midpoint.y * zoom + pan.y;
      setHoveredEdge({ edge: raw, x: screenX, y: screenY });
    });

    cy.on("mouseout", "edge", () => {
      setHoveredEdge(null);
    });

    // Zoom listener for progressive disclosure
    cy.on("zoom", () => {
      setZoomLevel(cy.zoom());
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, []);

  // 2. Populate Nodes & Edges (Disciplined Shapes & Sizes)
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || nodes.length === 0) return;

    cy.batch(() => {
      cy.elements().remove();

      // Construct Node Elements
      const cyNodes = nodes.map((n) => {
        const typeCfg = OBJECT_TYPE_COLORS[n.type] || { bg: "#334155", border: "#475569" };
        const shape = OBJECT_TYPE_SHAPES[n.type] || "ellipse";
        const bw = n.metrics?.betweenness || 0;

        // Scale size smoothly: Key nodes ~28-30px, standard ~20px
        const size = Math.max(18, Math.min(32, 18 + Math.sqrt(bw) * 80));

        let bgColor = typeCfg.bg;
        let borderColor = typeCfg.border;

        if (colorByCommunity && n.metrics?.community !== undefined) {
          const commIndex = n.metrics.community % COMMUNITY_PALETTE.length;
          bgColor = COMMUNITY_PALETTE[commIndex];
          borderColor = "#F2F2F2";
        }

        const isKey = KEY_ENTITY_IDS.has(n.id) || bw > 0.012;
        const displayLabel = isKey ? n.label || n.id : "";

        return {
          group: "nodes" as const,
          data: {
            id: n.id,
            label: n.label || n.id,
            displayLabel,
            isKey,
            shape,
            bg: bgColor,
            border: borderColor,
            size,
            type: n.type,
            raw: n,
          },
        };
      });

      // Construct Edge Elements
      const cyEdges = edges.map((e, idx) => {
        const typeCfg = LINK_TYPE_COLORS[e.type] || { color: "#475569", style: "solid", width: 1.2 };
        const edgeId = e.id || `edge-${e.source}-${e.target}-${idx}`;
        const edgeLabel =
          e.type === "PAID" && e.attributes?.amount_inr
            ? `PAID ₹${Number(e.attributes.amount_inr).toLocaleString("en-IN")}`
            : e.type;

        return {
          group: "edges" as const,
          data: {
            id: edgeId,
            source: e.source,
            target: e.target,
            type: e.type,
            edgeLabel,
            highlightColor: typeCfg.color,
            raw: e,
          },
        };
      });

      cy.add([...cyNodes, ...cyEdges]);
    });

    runLayout(layoutName);
  }, [nodes, edges, colorByCommunity, KEY_ENTITY_IDS]);

  // 3. Tuned Physics Layout Runner (Stabilized, Clear Spacing)
  const runLayout = useCallback((layoutType: string) => {
    const cy = cyRef.current;
    if (!cy || cy.nodes().length === 0) return;

    let options: any = { name: "cose", animate: false };

    switch (layoutType) {
      case "cose":
        options = {
          name: "cose",
          animate: false,
          randomize: false,
          nodeRepulsion: () => 18000,
          idealEdgeLength: () => 90,
          edgeElasticity: () => 35,
          gravity: 0.12,
          numIter: 450,
          nodeOverlap: 35,
          coolingFactor: 0.95,
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
          minNodeSpacing: 45,
        };
        break;
      case "breadthfirst":
        options = {
          name: "breadthfirst",
          directed: true,
          animate: false,
          spacingFactor: 1.4,
        };
        break;
      case "circle":
        options = {
          name: "circle",
          animate: false,
          spacingFactor: 1.3,
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
    cy.fit(undefined, 35);
  }, []);

  // Update layout when layoutName prop changes
  useEffect(() => {
    runLayout(layoutName);
  }, [layoutName, runLayout]);

  // Progressive Zoom-based Label Revelation
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      cy.nodes().forEach((n) => {
        const isKey = n.data("isKey");
        const raw = n.data("raw") as GraphNode;
        const degree = raw?.metrics?.degree || 0;

        // Progressive label strategy:
        // Far: only Key nodes
        // Medium: Key nodes + degree > 5
        // Close: all nodes
        let labelText = "";
        if (showLabels) {
          if (zoomLevel < 0.6) {
            labelText = isKey ? n.data("label") : "";
          } else if (zoomLevel < 1.3) {
            labelText = isKey || degree > 5 ? n.data("label") : "";
          } else {
            labelText = n.data("label");
          }
        }
        n.style("label", labelText);
      });
    });
  }, [zoomLevel, showLabels]);

  // 4. Handle 4-Tier Investigative Focus Hierarchy (Selected, 1-Hop, 2-Hop, Background)
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      // Clear visual state classes
      cy.elements().removeClass([
        "selected",
        "hop1-node",
        "hop1-edge",
        "connected-edge",
        "hop2-node",
        "hop2-edge",
        "background-node",
        "background-edge",
        "hawala-node",
        "hawala-edge",
        "pattern-support",
        "arrested-target",
        "severed-edge",
        "residual-node",
        "residual-edge",
      ]);

      // 4A. Baseline Visibility Filtering (Types, Betweenness, Search)
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

      // 4B. 2-Hop Network Mode
      if (filterState.isolatedSeedId) {
        const seed = cy.getElementById(filterState.isolatedSeedId);
        if (seed.length > 0) {
          seed.addClass("selected");

          // 1-Hop
          const hop1 = seed.neighborhood();
          const hop1Nodes = hop1.nodes();
          const hop1Edges = seed.connectedEdges();
          hop1Nodes.addClass("hop1-node");
          hop1Edges.addClass("hop1-edge");

          // 2-Hop
          const hop2 = hop1Nodes.neighborhood();
          const hop2Nodes = hop2.nodes().not(seed).not(hop1Nodes);
          const hop2Edges = hop2.edges().not(hop1Edges);
          hop2Nodes.addClass("hop2-node");
          hop2Edges.addClass("hop2-edge");

          // Background (subdued to 15% priority)
          const bgNodes = cy.nodes().not(seed).not(hop1Nodes).not(hop2Nodes);
          const bgEdges = cy.edges().not(hop1Edges).not(hop2Edges);
          bgNodes.addClass("background-node");
          bgEdges.addClass("background-edge");
          return;
        }
      }

      // 4C. Selected Node Focus Mode (Phase 4 Strict 4-Tier Hierarchy)
      if (selectedNodeId) {
        const targetNode = cy.getElementById(selectedNodeId);
        if (targetNode.length > 0) {
          // Tier 1: Selected (100% priority)
          targetNode.addClass("selected");

          // Tier 2: 1-Hop Neighbors (70-85% priority)
          const hop1 = targetNode.neighborhood();
          const hop1Nodes = hop1.nodes();
          const hop1Edges = targetNode.connectedEdges();
          hop1Nodes.addClass("hop1-node");
          hop1Edges.addClass("hop1-edge");

          // Tier 3: 2-Hop Neighbors (35-55% priority)
          const hop2 = hop1Nodes.neighborhood();
          const hop2Nodes = hop2.nodes().not(targetNode).not(hop1Nodes);
          const hop2Edges = hop2.edges().not(hop1Edges);
          hop2Nodes.addClass("hop2-node");
          hop2Edges.addClass("hop2-edge");

          // Tier 4: Background (10-20% priority)
          const bgNodes = cy.nodes().not(targetNode).not(hop1Nodes).not(hop2Nodes);
          const bgEdges = cy.edges().not(hop1Edges).not(hop2Edges);
          bgNodes.addClass("background-node");
          bgEdges.addClass("background-edge");
        }
      }

      // 4D. Selected Edge Focus
      if (selectedEdgeId) {
        const edge = cy.getElementById(selectedEdgeId);
        if (edge.length > 0) {
          edge.addClass("selected");
          const connected = edge.connectedNodes();
          connected.addClass("hop1-node");
          cy.elements().not(edge).not(connected).addClass("background-node");
        }
      }

      // 4E. Highlighted Node IDs (e.g. from Copilot citations or Search)
      if (highlightedNodeIds && highlightedNodeIds.length > 0) {
        highlightedNodeIds.forEach((nid) => {
          const el = cy.getElementById(nid);
          if (el.length > 0) el.addClass("hop1-node");
        });
      }

      // 4F. Active Pattern Isolation (Hawala Cycle, Mule Burst, etc.)
      if (activePattern) {
        let patternEles = cy.collection();
        let supportNodes = cy.collection();

        if (activePattern === "hawala_cycle") {
          const hawalaHit = patterns.find((p) => p.pattern === "hawala_cycle");
          if (hawalaHit) {
            hawalaHit.nodes.forEach((nid) => {
              const el = cy.getElementById(nid);
              if (el.length > 0) {
                el.addClass("hawala-node");
                patternEles = patternEles.union(el);
              }
            });
            hawalaHit.edges.forEach((eid) => {
              const el = cy.getElementById(eid);
              if (el.length > 0) {
                el.addClass("hawala-edge");
                patternEles = patternEles.union(el);
              }
            });
            const cycleEdges = cy.edges(".hawala-edge");
            cycleEdges.connectedNodes().addClass("hawala-node");
            patternEles = patternEles.union(cycleEdges).union(cycleEdges.connectedNodes());

            // Supporting nodes (e.g. Naveen Bhatia, Bhatia Associates)
            supportNodes = cy.getElementById("person:naveen_bhatia").union(cy.getElementById("org:bhatia_associates"));
            supportNodes.addClass("pattern-support");
          }
        } else if (activePattern === "mule_burst") {
          const muleNode = cy.getElementById("phone:ph03");
          if (muleNode.length > 0) {
            muleNode.addClass("hawala-node");
            const muleEdges = muleNode.connectedEdges();
            muleEdges.addClass("hawala-edge");
            patternEles = patternEles.union(muleNode).union(muleEdges).union(muleEdges.connectedNodes());

            // Supporting suspect: Farhan Lodhi
            supportNodes = cy.getElementById("person:farhan_lodhi");
            supportNodes.addClass("pattern-support");
          }
        } else if (activePattern === "accountant_cut") {
          const acctNode = cy.getElementById("person:naveen_bhatia");
          if (acctNode.length > 0) {
            acctNode.addClass("hawala-node");
            const acctEdges = acctNode.connectedEdges();
            acctEdges.addClass("hawala-edge");
            patternEles = patternEles.union(acctNode).union(acctEdges).union(acctEdges.connectedNodes());
          }
        } else if (activePattern === "front_cluster") {
          const frontNodes = cy.nodes("[type = 'Organization']");
          frontNodes.addClass("hawala-node");
          const frontEdges = frontNodes.connectedEdges();
          frontEdges.addClass("hawala-edge");
          patternEles = patternEles.union(frontNodes).union(frontEdges);
        }

        if (patternEles.length > 0) {
          const bgElements = cy.elements().not(patternEles).not(supportNodes);
          bgElements.nodes().addClass("background-node");
          bgElements.edges().addClass("background-edge");
        }
      }

      // 4G. Counterfactual Arrest Simulation
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

          for (let i = 0; i < path.length - 1; i++) {
            const u = path[i];
            const v = path[i + 1];
            const connectingEdges = cy.edges(
              `[source = "${u}"][target = "${v}"], [source = "${v}"][target = "${u}"]`
            );
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

  // 5. Smooth Camera Framing Transitions
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    if (filterState.isolatedSeedId) {
      const seed = cy.getElementById(filterState.isolatedSeedId);
      if (seed.length > 0) {
        const hop1 = seed.neighborhood();
        const hop2 = hop1.nodes().neighborhood();
        const twoHopEles = seed.union(hop1).union(hop2);
        cy.animate({
          fit: { eles: twoHopEles, padding: 50 },
          duration: 400,
        });
        return;
      }
    }

    if (activePattern) {
      const patternEles = cy.elements(".hawala-node, .hawala-edge");
      if (patternEles.length > 0) {
        cy.animate({
          fit: { eles: patternEles, padding: 60 },
          duration: 400,
        });
        return;
      }
    }

    if (arrestTarget) {
      const targetAndResidual = cy.elements(".arrested-target, .residual-node, .residual-edge");
      if (targetAndResidual.length > 0) {
        cy.animate({
          fit: { eles: targetAndResidual, padding: 60 },
          duration: 400,
        });
        return;
      }
    }

    if (selectedNodeId) {
      const el = cy.getElementById(selectedNodeId);
      if (el.length > 0 && el.isNode()) {
        cy.animate({
          center: { eles: el },
          zoom: Math.max(cy.zoom(), 1.2),
          duration: 350,
        });
      }
    }
  }, [selectedNodeId, filterState.isolatedSeedId, activePattern, arrestTarget]);

  return (
    <div className="relative w-full h-full bg-[#050607] overflow-hidden select-none">
      {/* Cytoscape Canvas Container with Tactical Dark Grid */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing bg-[radial-gradient(#182029_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* Top Center Tactical Mode / Status Banner */}
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0A0D10]/95 backdrop-blur-md border border-[#20252A] shadow-xl text-xs font-mono">
        <span
          className={`w-2 h-2 rounded-full ${
            activeMode === "ARREST SIMULATION"
              ? "bg-[#FF3038] animate-ping"
              : activeMode === "PATTERN ANALYSIS"
              ? "bg-[#E21B23] animate-pulse"
              : activeMode === "2-HOP INVESTIGATION"
              ? "bg-sky-500"
              : activeMode === "FOCUS MODE"
              ? "bg-amber-400"
              : "bg-emerald-500"
          }`}
        />
        <span className="text-[#858B92] uppercase tracking-wider text-[10px]">MODE:</span>
        <span className="text-white font-bold tracking-wide">{activeMode}</span>

        {/* Reset View Action */}
        {(selectedNodeId || activePattern || arrestTarget || filterState.isolatedSeedId) && (
          <button
            onClick={() => {
              if (filterState.isolatedSeedId && onResetView) onResetView();
              if (activePattern && onClearPattern) onClearPattern();
              if (arrestTarget && onClearArrest) onClearArrest();
              onSelectNode(null);
              onSelectEdge(null);
              const cy = cyRef.current;
              if (cy) cy.fit(undefined, 35);
            }}
            className="ml-2 flex items-center gap-1 px-2 py-0.5 rounded bg-[#20252A] hover:bg-[#FF3038] text-slate-200 hover:text-white transition-all cursor-pointer text-[10px]"
            title="Reset to Full Overview"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset View</span>
          </button>
        )}
      </div>

      {/* Pattern Focus Tactical Explanation Card (Phase 4 Requirement) */}
      {activePattern && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 max-w-md w-full px-4 py-2.5 rounded-xl bg-[#0E1216]/95 backdrop-blur-md border border-[#E21B23]/80 shadow-2xl font-mono text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-1 border-b border-[#20252A]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FF3038]" />
              <span className="text-white font-bold tracking-wide">
                {activePattern === "hawala_cycle"
                  ? "HAWALA TRANSACTION CYCLE"
                  : activePattern === "mule_burst"
                  ? "MULE CALL BURST DETECTED"
                  : activePattern === "accountant_cut"
                  ? "ACCOUNTANT CUT-POINT (BOTTLENECK)"
                  : "FRONT ORGANIZATION CLUSTER"}
              </span>
            </div>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#E21B23]/20 text-[#FF3038] font-bold">
              HIGH CONFIDENCE
            </span>
          </div>

          <div className="text-[11px] text-slate-300 mt-1.5 leading-relaxed">
            {activePattern === "hawala_cycle" ? (
              <div>
                <span className="text-emerald-400 font-bold">4 Accounts Circular Flow: </span>
                <span className="text-white">acc:a02 → acc:a03 → acc:a08 → acc:a09 → acc:a02</span>
              </div>
            ) : activePattern === "mule_burst" ? (
              <div>
                <span className="text-sky-400 font-bold">phone:ph03: </span>
                <span className="text-white">141 Outbound calls logged immediately post FIR-2026-014.</span>
              </div>
            ) : activePattern === "accountant_cut" ? (
              <div>
                <span className="text-amber-400 font-bold">Naveen Bhatia: </span>
                <span className="text-white">Rank #1 Betweenness (0.02555). Bridges Mandi to shell entities.</span>
              </div>
            ) : (
              <div>
                <span className="text-purple-400 font-bold">Front Entities: </span>
                <span className="text-white">Commercial shell accounts masking produce diversion settlement.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top-Left Floating Canvas Controls */}
      <div className="absolute top-3.5 left-3.5 z-30 flex flex-col items-center gap-1 p-1 rounded-xl bg-[#0A0D10]/95 backdrop-blur-md border border-[#20252A] shadow-2xl">
        <button
          onClick={() => {
            const cy = cyRef.current;
            if (!cy) return;
            const target = selectedNodeId
              ? cy.getElementById(selectedNodeId)
              : cy.getElementById("person:naveen_bhatia");
            if (target && target.length > 0) {
              cy.animate({ center: { eles: target }, zoom: 1.25, duration: 300 });
            } else {
              cy.fit(undefined, 35);
            }
          }}
          title="Center Target Entity"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#858B92] hover:text-white hover:bg-[#20252A] transition-colors cursor-pointer"
        >
          <Crosshair className="w-3.5 h-3.5 text-[#FF3038]" />
        </button>
        <button
          onClick={() => {
            const cy = cyRef.current;
            if (cy) cy.zoom(cy.zoom() * 1.25);
          }}
          title="Zoom In"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#858B92] hover:text-white hover:bg-[#20252A] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            const cy = cyRef.current;
            if (cy) cy.zoom(cy.zoom() * 0.8);
          }}
          title="Zoom Out"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#858B92] hover:text-white hover:bg-[#20252A] transition-colors cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            const cy = cyRef.current;
            if (cy) cy.fit(undefined, 35);
          }}
          title="Fit Network to Screen"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#858B92] hover:text-white hover:bg-[#20252A] transition-colors cursor-pointer"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>

      {/* Bottom-Left Disciplined Entity Legend */}
      <div className="absolute bottom-3.5 left-3.5 z-20 flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#0A0D10]/95 backdrop-blur-md border border-[#20252A] shadow-xl text-[11px] text-[#858B92] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E21B23] border border-[#FF3038]" />
          <span className="text-slate-200">Person</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2 rounded bg-[#475569] border border-[#64748B]" />
          <span className="text-slate-200">Phone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rotate-45 bg-[#059669] border border-[#10B981]" />
          <span className="text-slate-200">Account</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#B45309] border border-[#F59E0B]" />
          <span className="text-slate-200">Org</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2.5 bg-[#991B1B] border border-[#DC2626]" />
          <span className="text-slate-200">FIR</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2 rounded-full bg-[#334155] border border-[#475569]" />
          <span className="text-slate-200">Location</span>
        </div>
      </div>

      {/* Bottom-Right Tactical Minimap Radar */}
      <div className="absolute bottom-3.5 right-3.5 z-20 w-36 h-24 rounded-xl bg-[#0A0D10]/95 backdrop-blur-md border border-[#20252A] p-1.5 shadow-xl hidden sm:block overflow-hidden pointer-events-none">
        <div className="relative w-full h-full rounded-lg bg-[#050607] border border-[#141920] flex items-center justify-center">
          <div className="absolute w-16 h-16 rounded-full border border-[#20252A]/40" />
          <div className="absolute w-8 h-8 rounded-full border border-[#20252A]/20" />
          {selectedNodeId && (
            <div className="absolute w-2 h-2 rounded-full bg-[#FF3038] shadow-[0_0_8px_#FF3038] left-[48%] top-[42%] animate-pulse" />
          )}
          <div className="absolute w-1.5 h-1.5 rounded-full bg-[#E21B23] left-[46%] top-[40%]" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-[#E21B23] left-[30%] top-[60%]" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-[#475569] left-[35%] top-[25%]" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-[#059669] left-[70%] top-[60%]" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-[#B45309] left-[75%] top-[22%]" />
          <div className="absolute w-full h-[1px] bg-[#20252A]/30 top-1/2" />
          <div className="absolute h-full w-[1px] bg-[#20252A]/30 left-1/2" />
        </div>
      </div>

      {/* Phase 4 Edge Inspection Tooltip on Hover */}
      {hoveredEdge && (
        <div
          className="absolute z-40 bg-[#0E1216]/95 backdrop-blur-md border border-[#20252A] rounded-lg px-2.5 py-1.5 text-[11px] font-mono shadow-2xl pointer-events-none -translate-x-1/2 -translate-y-12 animate-in fade-in duration-100"
          style={{ left: hoveredEdge.x, top: hoveredEdge.y }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: LINK_TYPE_COLORS[hoveredEdge.edge.type]?.color || "#FF3038" }}
            />
            <span className="font-bold text-white uppercase">{hoveredEdge.edge.type}</span>
            {hoveredEdge.edge.attributes?.amount_inr && (
              <span className="text-emerald-400 font-bold">
                ₹{Number(hoveredEdge.edge.attributes.amount_inr).toLocaleString("en-IN")}
              </span>
            )}
            {hoveredEdge.edge.attributes?.duration_s && (
              <span className="text-sky-400">{hoveredEdge.edge.attributes.duration_s}s</span>
            )}
          </div>
          <div className="text-[10px] text-[#858B92] mt-0.5">
            {hoveredEdge.edge.source} → {hoveredEdge.edge.target}
          </div>
        </div>
      )}

      {/* Interactive Tactical Node Hover Tooltip */}
      {hoveredNode && (
        <div className="absolute top-4 right-4 z-40 bg-[#0A0D10]/95 backdrop-blur-md border border-[#20252A] rounded-xl p-3 text-xs shadow-2xl pointer-events-none max-w-xs animate-in fade-in duration-150 font-mono">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: OBJECT_TYPE_COLORS[hoveredNode.type]?.bg || "#64748b" }}
            />
            <span className="font-semibold text-slate-100 font-sans text-[13px]">{hoveredNode.label}</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#20252A] text-[#858B92]">
              {hoveredNode.type}
            </span>
          </div>
          <div className="space-y-1 text-[#858B92] text-[11px]">
            <div>
              ID: <span className="text-slate-300">{hoveredNode.id}</span>
            </div>
            {hoveredNode.metrics?.betweenness !== undefined && (
              <div>
                Betweenness:{" "}
                <span className="text-[#FF3038] font-bold">
                  {hoveredNode.metrics.betweenness.toFixed(5)}
                </span>
                {hoveredNode.metrics.betweenness_rank_persons && (
                  <span className="text-amber-400 ml-1">
                    (Rank #{hoveredNode.metrics.betweenness_rank_persons})
                  </span>
                )}
              </div>
            )}
            {hoveredNode.metrics?.degree !== undefined && (
              <div>
                Degree: <span className="text-slate-200">{hoveredNode.metrics.degree}</span>
              </div>
            )}
            {hoveredNode.metrics?.community !== undefined && (
              <div>
                Community: <span className="text-purple-400">#{hoveredNode.metrics.community}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import cytoscape, { Core, EventObject } from "cytoscape";
import { GraphNode, GraphEdge, FilterState, CutResult, PatternHit, ObjectType, LinkType } from "../types";
import {
  AdaptedNode,
  AdaptedEdge,
  ENTITY_TYPE_SHAPES,
  ENTITY_TYPE_COLORS,
  resolveEntityCoordinates,
} from "../lib/entityAdapter";
import worldLandPolylines from "./world-land.json";
import {
  Crosshair,
  Plus,
  Minus,
  Maximize2,
  MapPin,
  Compass,
  Globe2,
  Share2,
  Shield,
  Layers,
  AlertTriangle,
  Info,
  Calendar,
  Building,
  User,
  Phone,
  CreditCard,
  FileText,
  Camera,
  Car,
  ChevronDown,
} from "lucide-react";

interface GraphCanvasProps {
  caseId?: string;
  caseName?: string;
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
  theme?: "dark" | "light";
}

const CENTER_LAT = 22.0;
const CENTER_LNG = 78.0;
const GEO_SCALE_X = 22.0;
const GEO_SCALE_Y = 25.0;

function projectGeo(lat: number, lng: number): { x: number; y: number } {
  const x = (lng - CENTER_LNG) * GEO_SCALE_X;
  const y = (CENTER_LAT - lat) * GEO_SCALE_Y;
  return { x, y };
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  caseId = "CASE-2026-014",
  caseName = "Operation Grey Ledger",
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
  onLayoutChange,
  showLabels,
  onResetView,
  onClearPattern,
  onClearArrest,
  theme = "dark",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const svgOverlayRef = useRef<SVGSVGElement>(null);

  const isLight = theme === "light";

  // 2D View Mode: "topology" vs "geographic"
  const [mapMode, setMapMode] = useState<"topology" | "geographic">("topology");
  const [showUnanchoredTray, setShowUnanchoredTray] = useState<boolean>(false);

  // Hover states for nodes and edges
  const [hoveredNode, setHoveredNode] = useState<{
    node: GraphNode;
    geo?: { lat: number; lng: number; name: string } | null;
    screenX: number;
    screenY: number;
  } | null>(null);

  const [hoveredEdge, setHoveredEdge] = useState<{
    edge: GraphEdge;
    x: number;
    y: number;
  } | null>(null);

  // Zoom level state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panZoomState, setPanZoomState] = useState<{ pan: { x: number; y: number }; zoom: number }>({
    pan: { x: 0, y: 0 },
    zoom: 1,
  });

  // Calculate geocoded vs unanchored case nodes
  const { geocodedNodes, unanchoredNodes } = useMemo(() => {
    const geocoded: { node: GraphNode; geo: { lat: number; lng: number; name: string } }[] = [];
    const unanchored: GraphNode[] = [];

    nodes.forEach((n) => {
      const geo = resolveEntityCoordinates(n.id, n, caseId, edges);
      if (geo) {
        geocoded.push({ node: n, geo });
      } else {
        unanchored.push(n);
      }
    });

    return { geocodedNodes: geocoded, unanchoredNodes: unanchored };
  }, [nodes, edges, caseId]);

  // Key entities for prioritized display
  const KEY_ENTITY_IDS = useMemo(
    () =>
      new Set([
        "person:naveen_bhatia",
        "person:vikram_haleja",
        "person:farhan_lodhi",
        "person:imtiaz_qureshi",
        "person:rakesh_mundhe",
        "person:harish_tandel",
        "org:bhatia_associates",
        "org:haleja_holdings",
        "org:silver_lotus_traders",
        "acc:a02",
        "acc:a08",
        "loc:azadpur_mandi",
        "loc:karol_bagh",
      ]),
    []
  );

  // Active status label
  const activeMode = useMemo(() => {
    if (arrestTarget) return "ARREST SIMULATION";
    if (activePattern) return "PATTERN ANALYSIS";
    if (mapMode === "geographic") return "GEOGRAPHIC INTELLIGENCE";
    if (filterState.isolatedSeedId) return "2-HOP INVESTIGATION";
    if (selectedNodeId) return "FOCUS MODE";
    return "TOPOLOGY MAP";
  }, [arrestTarget, activePattern, mapMode, filterState.isolatedSeedId, selectedNodeId]);

  // 1. Initialize Cytoscape Instance
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      boxSelectionEnabled: false,
      wheelSensitivity: 0.25,
      minZoom: 0.15,
      maxZoom: 4.0,
      style: [
        // ==========================================
        // 1. BASELINE NODE STYLING (Distinct Police Intelligence Shapes)
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
            "font-family": "'Geist Mono', 'JetBrains Mono', monospace",
            "font-weight": 600,
            "text-valign": "bottom",
            "text-margin-y": 4,
            "text-max-width": "100px",
            "text-wrap": "ellipsis",
            color: isLight ? "#000000" : "#E4E4E7",
            "text-background-color": isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(10, 13, 16, 0.95)",
            "text-background-opacity": 0.95,
            "text-background-padding": "2px 5px",
            "text-background-shape": "roundrectangle",
            "text-border-color": isLight ? "#000000" : "#20252A",
            "text-border-width": 0.5,
            "min-zoomed-font-size": 8,
            width: "data(size)",
            height: "data(size)",
            opacity: 0.95,
            "transition-property": "background-color, border-color, width, height, opacity",
            "transition-duration": 0.2,
          },
        },

        // Distinct Entity Shapes
        {
          selector: 'node[type = "Person"]',
          style: { shape: "ellipse" },
        },
        {
          selector: 'node[type = "Phone"]',
          style: { shape: "round-rectangle", height: 18, width: 24 },
        },
        {
          selector: 'node[type = "Account"]',
          style: { shape: "round-diamond" },
        },
        {
          selector: 'node[type = "Organization"]',
          style: { shape: "round-rectangle", width: 32, height: 24 },
        },
        {
          selector: 'node[type = "FIR"]',
          style: { shape: "barrel", width: 28, height: 26 },
        },
        {
          selector: 'node[type = "Location"]',
          style: { shape: "hexagon" },
        },
        {
          selector: 'node[type = "Camera"]',
          style: { shape: "vee" },
        },
        {
          selector: 'node[type = "Vehicle"]',
          style: { shape: "tag", width: 28, height: 20 },
        },

        // Key / Bottleneck Nodes (Soft Red Glow)
        {
          selector: "node[?isKey]",
          style: {
            "border-width": 2.5,
            "border-color": "#FF3038",
            "shadow-blur": 12,
            "shadow-color": "#E21B23",
            "shadow-opacity": 0.7,
            "z-index": 100,
          },
        },

        // Selected Node
        {
          selector: "node:selected, node.selected",
          style: {
            "border-width": 3.5,
            "border-color": "#FF3038",
            "shadow-blur": 18,
            "shadow-color": "#E21B23",
            "shadow-opacity": 0.9,
            "text-border-color": "#FF3038",
            "text-border-width": 1,
            width: 36,
            height: 36,
            opacity: 1.0,
            "z-index": 1000,
          },
        },

        // 1-Hop Neighbors
        {
          selector: "node.hop1-node",
          style: {
            label: "data(label)",
            "border-width": 2.2,
            "border-color": "#E21B23",
            opacity: 0.9,
            "z-index": 800,
          },
        },
        {
          selector: "edge.hop1-edge, edge.connected-edge",
          style: {
            width: 2.2,
            "line-color": "#E21B23",
            "target-arrow-color": "#E21B23",
            "arrow-scale": 0.75,
            opacity: 0.9,
            "z-index": 800,
          },
        },

        // Hovered Node
        {
          selector: "node.hovered",
          style: {
            "border-width": 3.0,
            "border-color": "#FF3038",
            "shadow-blur": 14,
            "shadow-color": "#E21B23",
            "shadow-opacity": 0.8,
            "z-index": 999,
          },
        },

        // Baseline Edge Styling
        {
          selector: "edge",
          style: {
            width: 1.2,
            "line-color": isLight ? "#94A3B8" : "#334155",
            "target-arrow-color": isLight ? "#94A3B8" : "#334155",
            "target-arrow-shape": "triangle",
            "arrow-scale": 0.65,
            "curve-style": "bezier",
            opacity: 0.55,
            "line-style": "data(lineStyle)" as any,
          },
        },
        {
          selector: 'edge[type = "PAID"]',
          style: {
            width: 1.8,
            "line-color": "#10B981",
            "target-arrow-color": "#10B981",
            opacity: 0.75,
          },
        },
        {
          selector: 'edge[type = "CALLED"]',
          style: {
            width: 1.2,
            "line-style": "dashed",
            "line-color": "#3B82F6",
            "target-arrow-color": "#3B82F6",
            opacity: 0.6,
          },
        },
        {
          selector: 'edge[type = "SEEN_AT"]',
          style: {
            width: 1.4,
            "line-style": "dotted",
            "line-color": "#F59E0B",
            "target-arrow-color": "#F59E0B",
            opacity: 0.7,
          },
        },
        {
          selector: 'edge[type = "MENTIONED_IN"]',
          style: {
            width: 1.5,
            "line-style": "dashed",
            "line-color": "#EF4444",
            "target-arrow-color": "#EF4444",
            opacity: 0.7,
          },
        },

        // Hawala Pattern Highlights
        {
          selector: "edge.hawala-edge",
          style: {
            width: 3.5,
            "line-color": "#E21B23",
            "target-arrow-color": "#FF3038",
            "arrow-scale": 0.95,
            opacity: 1.0,
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
            opacity: 1.0,
            "z-index": 950,
          },
        },

        // Arrest Cut Simulation Highlights
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
            width: 1.0,
            "z-index": 2,
          },
        },
        {
          selector: "edge.residual-edge",
          style: {
            "line-color": "#F59E0B",
            "target-arrow-color": "#F59E0B",
            width: 3.2,
            opacity: 1.0,
            "arrow-scale": 0.85,
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
            opacity: 1.0,
            "z-index": 960,
          },
        },
      ] as any,
    });

    // Events
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

    // Node Hover with Rich Intelligence Metadata
    cy.on("mouseover", "node", (evt: EventObject) => {
      const node = evt.target;
      node.addClass("hovered");
      const raw = node.data("raw") as GraphNode;
      const geo = node.data("geo");
      const renderedPos = node.renderedPosition();
      setHoveredNode({
        node: raw,
        geo: geo || null,
        screenX: renderedPos.x,
        screenY: renderedPos.y,
      });
    });

    cy.on("mouseout", "node", (evt: EventObject) => {
      const node = evt.target;
      node.removeClass("hovered");
      setHoveredNode(null);
    });

    // Edge Hover
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

    // Viewport listener for map alignment & zoom
    cy.on("pan zoom", () => {
      setZoomLevel(cy.zoom());
      setPanZoomState({
        pan: { ...cy.pan() },
        zoom: cy.zoom(),
      });
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [isLight]);

  // 2. Populate Nodes & Edges
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || nodes.length === 0) return;

    cy.batch(() => {
      cy.elements().remove();

      // Construct Node Elements
      const cyNodes = nodes.map((n) => {
        const colors = ENTITY_TYPE_COLORS[n.type] || { bg: "#475569", border: "#64748B" };
        const shape = ENTITY_TYPE_SHAPES[n.type] || "ellipse";
        const bw = n.metrics?.betweenness || 0;
        const isKey = KEY_ENTITY_IDS.has(n.id) || bw > 0.01;

        let bgColor = colors.bg;
        let borderColor = colors.border;

        if (colorByCommunity && n.metrics?.community !== undefined) {
          const palettes = ["#DC2626", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];
          bgColor = palettes[n.metrics.community % palettes.length];
          borderColor = isLight ? "#000000" : "#FFFFFF";
        }

        const size = isKey ? 32 : Math.max(18, Math.min(28, 18 + Math.sqrt(bw) * 75));
        const displayLabel = isKey ? n.label || n.id : "";
        const geo = resolveEntityCoordinates(n.id, n, caseId, edges);

        return {
          group: "nodes" as const,
          data: {
            id: n.id, // EXACT backend node ID
            label: n.label || n.id,
            displayLabel,
            isKey,
            shape,
            bg: bgColor,
            border: borderColor,
            size,
            type: n.type,
            raw: n,
            geo: geo || null,
          },
        };
      });

      // Construct Edge Elements
      const cyEdges = edges.map((e, idx) => {
        const edgeId = e.id || `edge-${e.source}-${e.target}-${e.type}-${idx}`;
        let lineStyle = "solid";
        if (e.type === "CALLED" || e.type === "MENTIONED_IN") lineStyle = "dashed";
        if (e.type === "SEEN_AT" || e.type === "SAME_AS") lineStyle = "dotted";

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
            lineStyle,
            edgeLabel,
            raw: e,
          },
        };
      });

      cy.add([...cyNodes, ...cyEdges]);
    });

    applyLayout(mapMode, layoutName);
  }, [nodes, edges, colorByCommunity, mapMode, layoutName, caseId]);

  // 3. Layout Dispatcher: Topology vs 2D Geographic Projection
  const applyLayout = useCallback(
    (mode: "topology" | "geographic", layoutType: string) => {
      const cy = cyRef.current;
      if (!cy || cy.nodes().length === 0) return;

      if (mode === "geographic") {
        // GEOGRAPHIC 2D PROJECTION
        // Use verified coordinates for all geocoded case nodes
        const positions: Record<string, { x: number; y: number }> = {};
        let anchoredCount = 0;

        cy.nodes().forEach((n) => {
          const geo = n.data("geo") as { lat: number; lng: number } | null;
          if (geo && typeof geo.lat === "number" && typeof geo.lng === "number") {
            positions[n.id()] = projectGeo(geo.lat, geo.lng);
            anchoredCount++;
          } else {
            // Unanchored nodes stay clustered in an offset buffer
            positions[n.id()] = { x: -600, y: -200 + (Math.random() * 200) };
          }
        });

        if (anchoredCount > 0) {
          const layout = cy.layout({
            name: "preset",
            positions,
            animate: true,
            animationDuration: 400,
          });
          layout.run();
          cy.fit(cy.nodes('[?geo]'), 60);
        }
      } else {
        // TOPOLOGY NETWORK LAYOUT
        let options: any = { name: "cose", animate: false };

        if (layoutType === "concentric") {
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
        } else {
          // Disciplined COSE (Police Network Layout)
          options = {
            name: "cose",
            animate: false,
            randomize: false,
            nodeRepulsion: () => 22000,
            idealEdgeLength: () => 95,
            edgeElasticity: () => 35,
            gravity: 0.15,
            numIter: 400,
            nodeOverlap: 40,
            coolingFactor: 0.95,
          };
        }

        const l = cy.layout(options);
        l.run();
        cy.fit(undefined, 45);
      }
    },
    []
  );

  // Progressive Zoom-based Label Revelation
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      cy.nodes().forEach((n) => {
        const isKey = n.data("isKey");
        const raw = n.data("raw") as GraphNode;
        const degree = raw?.metrics?.degree || 0;

        let labelText = "";
        if (showLabels) {
          if (zoomLevel < 0.65) {
            labelText = isKey ? n.data("label") : "";
          } else if (zoomLevel < 1.25) {
            labelText = isKey || degree > 4 ? n.data("label") : "";
          } else {
            labelText = n.data("label");
          }
        }
        n.style("label", labelText);
      });
    });
  }, [zoomLevel, showLabels]);

  // 4. Highlight & Active Focus Modes
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.batch(() => {
      cy.elements().removeClass([
        "selected",
        "hop1-node",
        "hop1-edge",
        "connected-edge",
        "hawala-node",
        "hawala-edge",
        "arrested-target",
        "severed-edge",
        "residual-node",
        "residual-edge",
      ]);

      // Focus / Selection Mode
      if (selectedNodeId) {
        const sel = cy.getElementById(selectedNodeId);
        if (sel.length > 0) {
          sel.addClass("selected");
          const neighborhood = sel.neighborhood();
          neighborhood.nodes().addClass("hop1-node");
          neighborhood.edges().addClass("hop1-edge");
        }
      }

      // Pattern Analysis Mode
      if (activePattern) {
        const match = patterns.find((p) => p.pattern === activePattern);
        if (match) {
          match.nodes.forEach((nid) => {
            cy.getElementById(nid).addClass("hawala-node");
          });
          match.edges.forEach((eid) => {
            cy.getElementById(eid).addClass("hawala-edge");
          });
        }
      }

      // Counterfactual Arrest Cut Mode
      if (arrestTarget) {
        const targetNode = cy.getElementById(arrestTarget);
        if (targetNode.length > 0) {
          targetNode.addClass("arrested-target");
          targetNode.connectedEdges().addClass("severed-edge");
        }

        if (arrestCutResult?.residual_path_ph02_ph03) {
          const path = arrestCutResult.residual_path_ph02_ph03;
          path.forEach((nid) => cy.getElementById(nid).addClass("residual-node"));
          for (let i = 0; i < path.length - 1; i++) {
            const u = path[i];
            const v = path[i + 1];
            const edge = cy.edges(`[source = "${u}"][target = "${v}"], [source = "${v}"][target = "${u}"]`);
            edge.addClass("residual-edge");
          }
        }
      }
    });

    if (selectedNodeId) {
      const el = cy.getElementById(selectedNodeId);
      if (el.length > 0 && el.isNode()) {
        cy.animate({
          center: { eles: el },
          zoom: Math.max(cy.zoom(), 1.1),
          duration: 300,
        });
      }
    }
  }, [selectedNodeId, activePattern, arrestTarget, arrestCutResult, patterns]);

  // Convert Natural Earth Land Polylines to 2D projected SVG paths
  const projectedCoastlinePaths = useMemo(() => {
    if (mapMode !== "geographic") return [];
    const paths: string[] = [];

    worldLandPolylines.forEach((poly: any) => {
      if (!Array.isArray(poly) || poly.length === 0) return;
      let d = "";
      for (let i = 0; i < poly.length; i++) {
        const [lng, lat] = poly[i];
        // Only project polylines around Middle East, South Asia, SE Asia
        if (lat >= -15 && lat <= 45 && lng >= 35 && lng <= 120) {
          const { x, y } = projectGeo(lat, lng);
          d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)} ` : `L ${x.toFixed(1)} ${y.toFixed(1)} `;
        }
      }
      if (d) paths.push(d);
    });

    return paths;
  }, [mapMode]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none font-sans transition-colors duration-200 ${
        isLight ? "bg-white text-black" : "bg-[#050607] text-[#F2F2F2]"
      }`}
    >
      {/* Background SVG Coastlines (Active in 2D Geographic Mode) */}
      {mapMode === "geographic" && (
        <svg
          ref={svgOverlayRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
          style={{
            transform: `translate(${panZoomState.pan.x}px, ${panZoomState.pan.y}px) scale(${panZoomState.zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {projectedCoastlinePaths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={isLight ? "rgba(0, 0, 0, 0.16)" : "rgba(255, 255, 255, 0.12)"}
              strokeWidth={1.2 / panZoomState.zoom}
            />
          ))}
        </svg>
      )}

      {/* Cytoscape Canvas Container */}
      <div
        ref={containerRef}
        className={`w-full h-full cursor-grab active:cursor-grabbing relative z-10 ${
          isLight
            ? "bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px]"
            : "bg-[radial-gradient(#182029_1px,transparent_1px)] [background-size:24px_24px]"
        }`}
      />

      {/* Top Center Tactical Mode / Status Banner */}
      <div
        className={`absolute top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-xl text-xs font-mono border ${
          isLight ? "bg-white border-black text-black" : "bg-[#0A0D10]/95 border-[#20252A] text-white"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            activeMode === "ARREST SIMULATION"
              ? "bg-[#FF3038] animate-ping"
              : activeMode === "PATTERN ANALYSIS"
              ? "bg-[#E21B23] animate-pulse"
              : activeMode === "GEOGRAPHIC INTELLIGENCE"
              ? "bg-sky-400 animate-pulse"
              : activeMode === "FOCUS MODE"
              ? "bg-amber-400"
              : "bg-emerald-500"
          }`}
        />
        <span className="text-zinc-500 uppercase tracking-wider text-[10px]">CASE:</span>
        <span className="font-bold tracking-wide">{caseId}</span>
        <span className="text-zinc-400">|</span>
        <span className="font-bold text-[#E21B23]">{activeMode}</span>

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
              if (cy) cy.fit(undefined, 40);
            }}
            className={`ml-2 flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer text-[10px] font-bold ${
              isLight
                ? "bg-zinc-200 hover:bg-zinc-300 text-black border border-black"
                : "bg-[#20252A] hover:bg-[#FF3038] text-white"
            }`}
            title="Reset to Case Overview"
          >
            Reset Focus
          </button>
        )}
      </div>

      {/* Top Left: 2D Sub-Mode Switcher (Topology Graph vs 2D Geographic Map) */}
      <div className="absolute top-3.5 left-4 z-20 flex items-center gap-1.5">
        <div
          className={`flex items-center p-1 rounded-xl shadow-md border text-xs font-mono ${
            isLight ? "bg-white border-black text-black" : "bg-[#0A0D10]/95 border-[#20252A] text-white"
          }`}
        >
          <button
            onClick={() => {
              setMapMode("topology");
              applyLayout("topology", layoutName);
            }}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-colors font-bold flex items-center gap-1.5 ${
              mapMode === "topology"
                ? "bg-[#E21B23] text-white shadow-sm"
                : isLight
                ? "text-black hover:bg-zinc-100"
                : "text-zinc-300 hover:bg-[#20252A]"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Topology Map</span>
          </button>

          <button
            onClick={() => {
              setMapMode("geographic");
              applyLayout("geographic", layoutName);
            }}
            className={`px-3 py-1 rounded-lg cursor-pointer transition-colors font-bold flex items-center gap-1.5 ${
              mapMode === "geographic"
                ? "bg-[#E21B23] text-white shadow-sm"
                : isLight
                ? "text-black hover:bg-zinc-100"
                : "text-zinc-300 hover:bg-[#20252A]"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Geographic 2D</span>
          </button>
        </div>

        {/* Unanchored Badge in Geographic Mode */}
        {mapMode === "geographic" && unanchoredNodes.length > 0 && (
          <button
            onClick={() => setShowUnanchoredTray((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold shadow-md cursor-pointer transition-all ${
              isLight
                ? "bg-amber-50 text-amber-950 border-black hover:bg-amber-100"
                : "bg-amber-950/40 text-amber-300 border-amber-800/80 hover:bg-amber-950/60"
            }`}
          >
            <MapPin className="w-3 h-3 text-amber-500" />
            <span>{unanchoredNodes.length} Unanchored</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showUnanchoredTray ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {/* Unanchored Drawer (Appears when toggled in Geographic mode) */}
      {mapMode === "geographic" && showUnanchoredTray && (
        <div
          className={`absolute top-14 left-4 z-30 w-72 max-h-64 rounded-xl border p-3 shadow-2xl overflow-y-auto text-xs font-mono ${
            isLight ? "bg-white border-black text-black" : "bg-[#0A0D10]/95 border-[#20252A] text-white"
          }`}
        >
          <div className="flex items-center justify-between pb-1.5 border-b mb-2 border-zinc-500/30">
            <span className="font-bold text-[10px] uppercase tracking-wider text-amber-600">
              UNANCHORED / NOT GEOLOCATED
            </span>
            <span className="text-[9px] text-zinc-500">NO RANDOM COORDS</span>
          </div>
          <div className="space-y-1.5">
            {unanchoredNodes.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  onSelectNode(n.id);
                  setShowUnanchoredTray(false);
                }}
                className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                  isLight
                    ? "border-black/30 hover:bg-zinc-100"
                    : "border-zinc-800 hover:bg-[#20252A]"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: ENTITY_TYPE_COLORS[n.type]?.bg || "#64748B" }}
                  />
                  <span className="truncate font-semibold">{n.label || n.id}</span>
                </div>
                <span className="text-[9px] uppercase px-1 rounded bg-zinc-200 text-zinc-800 shrink-0">
                  {n.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Right Edge: Tactical Zoom & Recenter Controls */}
      <div
        className={`absolute right-4 top-4 z-20 flex flex-col p-1 rounded-xl shadow-md border gap-1 text-xs font-mono ${
          isLight ? "bg-white border-black text-black" : "bg-[#0A0D10]/95 border-[#20252A] text-white"
        }`}
      >
        <button
          onClick={() => {
            const cy = cyRef.current;
            if (cy) cy.zoom(cy.zoom() * 1.25);
          }}
          title="Zoom In"
          className="p-2 rounded-lg hover:bg-zinc-200/50 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const cy = cyRef.current;
            if (cy) cy.zoom(cy.zoom() * 0.8);
          }}
          title="Zoom Out"
          className="p-2 rounded-lg hover:bg-zinc-200/50 transition-colors cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className={`h-[1px] my-0.5 ${isLight ? "bg-black" : "bg-[#20252A]"}`} />
        <button
          onClick={() => {
            const cy = cyRef.current;
            if (cy) cy.fit(undefined, 40);
          }}
          title="Fit Network to Screen"
          className="p-2 rounded-lg hover:bg-zinc-200/50 transition-colors cursor-pointer text-[#E21B23]"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom-Left Disciplined Entity Shape & Type Legend */}
      <div
        className={`absolute bottom-3.5 left-4 z-20 flex items-center gap-3 px-3 py-1.5 rounded-full backdrop-blur-md shadow-xl text-[10px] font-mono border ${
          isLight ? "bg-white border-black text-black" : "bg-[#0A0D10]/95 border-[#20252A] text-white"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E21B23] border border-[#FF3038]" />
          <span>Person (Circle)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded bg-[#3B82F6] border border-[#60A5FA]" />
          <span>Phone</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rotate-45 bg-[#059669] border border-[#10B981]" />
          <span>Account</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2.5 bg-[#D97706] border border-[#F59E0B]" />
          <span>Org</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2.5 bg-[#DC2626] border border-[#EF4444]" />
          <span>FIR</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#475569] border border-[#64748B]" />
          <span>Location</span>
        </div>
      </div>

      {/* Rich Tactical Node Hover Tooltip */}
      {hoveredNode && (
        <div
          className={`absolute z-40 p-3 rounded-xl border shadow-2xl pointer-events-none max-w-xs text-xs font-mono transition-transform duration-75 ${
            isLight ? "bg-white border-black text-black" : "bg-[#0A0D10]/95 border-[#20252A] text-white"
          }`}
          style={{
            transform: `translate(${hoveredNode.screenX + 16}px, ${hoveredNode.screenY + 16}px)`,
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b pb-1.5 mb-1.5 border-zinc-500/30">
            <span
              className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase"
              style={{
                backgroundColor: ENTITY_TYPE_COLORS[hoveredNode.node.type]?.bg || "#3B82F6",
                color: "#FFFFFF",
              }}
            >
              {hoveredNode.node.type}
            </span>
            <span className="text-[9px] text-zinc-500 font-mono">
              DEG: {hoveredNode.node.metrics?.degree || 0}
            </span>
          </div>

          <div className="font-bold text-sm tracking-wide">{hoveredNode.node.label || hoveredNode.node.id}</div>
          <div className="text-[10px] text-zinc-500 truncate font-mono mt-0.5">ID: {hoveredNode.node.id}</div>

          {hoveredNode.geo && (
            <div className="mt-2 pt-1.5 border-t border-zinc-500/30 flex items-center gap-1.5 text-[10px] text-[#E21B23] font-semibold">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{hoveredNode.geo.name}</span>
            </div>
          )}

          {hoveredNode.node.metrics?.betweenness !== undefined && (
            <div className="mt-1.5 flex items-center justify-between text-[10px]">
              <span className="text-zinc-500">Betweenness:</span>
              <span className="font-bold text-[#E21B23]">
                {Number(hoveredNode.node.metrics.betweenness).toFixed(5)}
                {hoveredNode.node.metrics.betweenness_rank_persons && (
                  <span className="text-amber-500 ml-1">
                    (Rank #{hoveredNode.node.metrics.betweenness_rank_persons})
                  </span>
                )}
              </span>
            </div>
          )}

          <div className="mt-2 pt-1 border-t border-zinc-500/30 text-[9px] text-[#E21B23] font-bold text-right tracking-wider">
            CLICK TO OPEN DOSSIER ›
          </div>
        </div>
      )}

      {/* Edge Hover Tooltip */}
      {hoveredEdge && (
        <div
          className={`absolute z-40 p-2 rounded-lg border shadow-xl text-[11px] font-mono pointer-events-none -translate-x-1/2 -translate-y-12 ${
            isLight ? "bg-white border-black text-black" : "bg-[#0E1216]/95 border-[#20252A] text-white"
          }`}
          style={{ left: hoveredEdge.x, top: hoveredEdge.y }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E21B23]" />
            <span className="font-bold uppercase">{hoveredEdge.edge.type}</span>
            {hoveredEdge.edge.attributes?.amount_inr && (
              <span className="text-emerald-600 font-bold">
                ₹{Number(hoveredEdge.edge.attributes.amount_inr).toLocaleString("en-IN")}
              </span>
            )}
          </div>
          <div className="text-[9px] text-zinc-500 mt-0.5">
            {hoveredEdge.edge.source} → {hoveredEdge.edge.target}
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphCanvas;

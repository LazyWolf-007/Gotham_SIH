import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { GraphNode, GraphEdge, ObjectType, LinkType } from "../types";
import { resolveEntityCoordinates, VERIFIED_COORDINATES } from "../lib/entityAdapter";
import { filterCaseNetwork, GlobeNode, CaseGlobeData, VERIFIED_HUBS } from "./caseGeoFilter";
import worldLandPolylines from "./world-land.json";
import {
  MapPin,
  Crosshair,
  Plus,
  Minus,
  Maximize2,
  Compass,
  Layers,
  ChevronDown,
  User,
  Smartphone,
  CreditCard,
  Building2,
  FileText,
  Camera,
  Truck,
  Shield,
  Activity,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

interface GeoMap2DCanvasProps {
  caseId: string;
  caseName: string;
  caseAgency?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  theme?: "dark" | "light";
  onOpenDossier?: () => void;
}

// Center around South Asia / Middle East / Southeast Asia
const CENTER_LAT = 22.0;
const CENTER_LNG = 75.0;
const BASE_SCALE = 14.0; // pixels per degree

export const GeoMap2DCanvas: React.FC<GeoMap2DCanvasProps> = ({
  caseId,
  caseName,
  caseAgency = "NCRB Special Investigation Unit",
  nodes: rawNodes,
  edges: rawEdges,
  selectedNodeId,
  onSelectNode,
  theme = "dark",
  onOpenDossier,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLight = theme === "light";

  // Transform / Pan & Zoom State
  const [zoom, setZoom] = useState<number>(1.2);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showUnanchoredTray, setShowUnanchoredTray] = useState<boolean>(false);

  // Hover Tooltip State
  const [hoveredNode, setHoveredNode] = useState<{
    node: GlobeNode;
    screenX: number;
    screenY: number;
  } | null>(null);

  // 1. Derive Case-Scoped Geographic Data
  const caseData: CaseGlobeData = useMemo(() => {
    return filterCaseNetwork(caseId, rawNodes, rawEdges);
  }, [caseId, rawNodes, rawEdges]);

  // Project (lat, lng) to 2D screen coordinates based on current pan & zoom
  const projectToScreen = useCallback(
    (lat: number, lng: number, width: number, height: number) => {
      const scale = BASE_SCALE * zoom;
      const cx = width / 2 + pan.x;
      const cy = height / 2 + pan.y;

      const x = cx + (lng - CENTER_LNG) * scale;
      const y = cy - (lat - CENTER_LAT) * scale;
      return { x, y };
    },
    [zoom, pan]
  );

  // Inverse projection from screen coords to (lat, lng)
  const screenToGeo = useCallback(
    (screenX: number, screenY: number, width: number, height: number) => {
      const scale = BASE_SCALE * zoom;
      const cx = width / 2 + pan.x;
      const cy = height / 2 + pan.y;

      const lng = CENTER_LNG + (screenX - cx) / scale;
      const lat = CENTER_LAT - (screenY - cy) / scale;
      return { lat, lng };
    },
    [zoom, pan]
  );

  // Reset to optimal central framing
  const handleResetView = useCallback(() => {
    setZoom(1.35);
    setPan({ x: 0, y: 0 });
  }, []);

  // Zoom In / Out
  const handleZoom = useCallback((direction: "in" | "out") => {
    setZoom((prev) => {
      const next = direction === "in" ? prev * 1.3 : prev / 1.3;
      return Math.min(Math.max(next, 0.45), 5.0);
    });
  }, []);

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.88;
    setZoom((prev) => Math.min(Math.max(prev * factor, 0.45), 5.0));
  };

  // Pre-generate coastline SVG paths
  const coastlineSvgPaths = useMemo(() => {
    return (worldLandPolylines as number[][][]).map((ring, idx) => {
      if (!Array.isArray(ring) || ring.length < 2) return "";
      return ring.reduce((path, pt, i) => {
        const lng = pt[0];
        const lat = pt[1];
        // Relative to (CENTER_LNG, CENTER_LAT) with base unit
        const x = (lng - CENTER_LNG) * BASE_SCALE;
        const y = -(lat - CENTER_LAT) * BASE_SCALE;
        return `${path} ${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      }, "");
    });
  }, []);

  // SVG grid lines (latitude & longitude)
  const gridLines = useMemo(() => {
    const latLines: { lat: number; y: number }[] = [];
    const lngLines: { lng: number; x: number }[] = [];

    for (let lat = -60; lat <= 80; lat += 20) {
      latLines.push({ lat, y: -(lat - CENTER_LAT) * BASE_SCALE });
    }
    for (let lng = -180; lng <= 180; lng += 30) {
      lngLines.push({ lng, x: (lng - CENTER_LNG) * BASE_SCALE });
    }
    return { latLines, lngLines };
  }, []);

  // Node Type Visual Shapes & Colors
  const getNodeVisual = (gNode: GlobeNode) => {
    const isSelected = selectedNodeId === gNode.id;
    const isKey = gNode.isKeyNode || gNode.isMajorHub;

    switch (gNode.type) {
      case "Person":
        return {
          fill: isSelected ? "#FF3038" : isKey ? "#E21B23" : "#DC2626",
          stroke: isSelected ? "#FFFFFF" : isKey ? "#FF6B72" : "#7F1D1D",
          radius: isKey ? 9 : 7,
          shape: "circle",
        };
      case "Phone":
        return {
          fill: "#0284C7",
          stroke: isSelected ? "#FFFFFF" : "#38BDF8",
          radius: 6.5,
          shape: "rect",
        };
      case "Account":
        return {
          fill: "#059669",
          stroke: isSelected ? "#FFFFFF" : "#34D399",
          radius: 7.5,
          shape: "diamond",
        };
      case "Organization":
        return {
          fill: "#D97706",
          stroke: isSelected ? "#FFFFFF" : "#FBBF24",
          radius: 8,
          shape: "hexagon",
        };
      case "FIR":
        return {
          fill: "#DC2626",
          stroke: isSelected ? "#FFFFFF" : "#F87171",
          radius: 8.5,
          shape: "circle",
        };
      case "Location":
        return {
          fill: "#475569",
          stroke: isSelected ? "#FFFFFF" : "#94A3B8",
          radius: 8,
          shape: "pin",
        };
      case "Camera":
        return {
          fill: "#0D9488",
          stroke: isSelected ? "#FFFFFF" : "#2DD4BF",
          radius: 7,
          shape: "triangle",
        };
      case "Vehicle":
        return {
          fill: "#52525B",
          stroke: isSelected ? "#FFFFFF" : "#A1A1AA",
          radius: 7,
          shape: "rect",
        };
      default:
        return {
          fill: "#E21B23",
          stroke: "#FFFFFF",
          radius: 7,
          shape: "circle",
        };
    }
  };

  // Helper Icon for Tooltip
  const renderTypeIcon = (type: ObjectType) => {
    switch (type) {
      case "Person":
        return <User className="w-3.5 h-3.5 text-[#E21B23]" />;
      case "Phone":
        return <Smartphone className="w-3.5 h-3.5 text-sky-400" />;
      case "Account":
        return <CreditCard className="w-3.5 h-3.5 text-emerald-400" />;
      case "Organization":
        return <Building2 className="w-3.5 h-3.5 text-amber-400" />;
      case "FIR":
        return <FileText className="w-3.5 h-3.5 text-red-400" />;
      case "Location":
        return <MapPin className="w-3.5 h-3.5 text-slate-400" />;
      case "Camera":
        return <Camera className="w-3.5 h-3.5 text-teal-400" />;
      case "Vehicle":
        return <Truck className="w-3.5 h-3.5 text-zinc-400" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden select-none font-sans transition-colors duration-200 ${
        isLight ? "bg-[#FAFAFA] text-slate-900" : "bg-[#050607] text-[#F2F2F2]"
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* =========================================================================
          MAIN 2D FLAT EARTH MAP SVG VIEWPORT
          ========================================================================= */}
      <svg className="w-full h-full absolute inset-0 pointer-events-auto">
        <defs>
          {/* Subtle glow filter for key targets */}
          <filter id="crimson-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#E21B23" floodOpacity="0.8" />
          </filter>
          <filter id="selection-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#FFFFFF" floodOpacity="0.9" />
          </filter>

          {/* Gradients */}
          <radialGradient id="earth-gradient-dark" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0B0F15" />
            <stop offset="100%" stopColor="#040608" />
          </radialGradient>
          <radialGradient id="earth-gradient-light" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </radialGradient>
        </defs>

        {/* Scaled & Panned Earth Canvas Group */}
        <g transform={`translate(${containerRef.current ? containerRef.current.clientWidth / 2 + pan.x : pan.x}, ${containerRef.current ? containerRef.current.clientHeight / 2 + pan.y : pan.y}) scale(${zoom})`}>
          
          {/* Earth Flat Elliptical Boundary / Map Backdrop */}
          <rect
            x={-180 * BASE_SCALE}
            y={-90 * BASE_SCALE}
            width={360 * BASE_SCALE}
            height={180 * BASE_SCALE}
            rx={16}
            fill={isLight ? "url(#earth-gradient-light)" : "url(#earth-gradient-dark)"}
            stroke={isLight ? "#CBD5E1" : "#1E293B"}
            strokeWidth={1.5}
          />

          {/* Latitude / Longitude Tactical Grid */}
          {showGrid && (
            <g opacity={isLight ? 0.6 : 0.45}>
              {gridLines.latLines.map((line) => (
                <line
                  key={`lat-${line.lat}`}
                  x1={-180 * BASE_SCALE}
                  y1={line.y}
                  x2={180 * BASE_SCALE}
                  y2={line.y}
                  stroke={isLight ? "#94A3B8" : "#1E293B"}
                  strokeWidth={0.75}
                  strokeDasharray="4 4"
                />
              ))}
              {gridLines.lngLines.map((line) => (
                <line
                  key={`lng-${line.lng}`}
                  x1={line.x}
                  y1={-90 * BASE_SCALE}
                  x2={line.x}
                  y2={90 * BASE_SCALE}
                  stroke={isLight ? "#94A3B8" : "#1E293B"}
                  strokeWidth={0.75}
                  strokeDasharray="4 4"
                />
              ))}
            </g>
          )}

          {/* Real Continent & Coastline Vector Outlines (Natural Earth Data) */}
          <g
            fill="none"
            stroke={isLight ? "#64748B" : "#334155"}
            strokeWidth={1.1}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={isLight ? 0.95 : 0.85}
          >
            {coastlineSvgPaths.map((d, i) => (
              <path key={`coast-${i}`} d={d} />
            ))}
          </g>

          {/* 1. Curved Relationship Arcs between Connected Geographic Entities */}
          <g>
            {caseData.arcs.map((arc) => {
              const x1 = (arc.sourceNode.lng - CENTER_LNG) * BASE_SCALE;
              const y1 = -(arc.sourceNode.lat - CENTER_LAT) * BASE_SCALE;
              const x2 = (arc.targetNode.lng - CENTER_LNG) * BASE_SCALE;
              const y2 = -(arc.targetNode.lat - CENTER_LAT) * BASE_SCALE;

              // Arc midpoint with slight perpendicular curvature
              const dx = x2 - x1;
              const dy = y2 - y1;
              const dist = Math.hypot(dx, dy);
              if (dist < 4) return null;

              const curvature = Math.min(45, Math.max(10, dist * 0.22));
              // Midpoint with curve upward
              const cx = (x1 + x2) / 2 - (dy / dist) * curvature;
              const cy = (y1 + y2) / 2 + (dx / dist) * curvature;

              const pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

              return (
                <path
                  key={arc.id}
                  d={pathD}
                  fill="none"
                  stroke={arc.isCrossRegional ? "#E21B23" : "#EF4444"}
                  strokeWidth={arc.isCrossRegional ? 2.0 : 1.2}
                  strokeOpacity={arc.isCrossRegional ? 0.85 : 0.6}
                  strokeLinecap="round"
                />
              );
            })}
          </g>

          {/* 2. Major Verified Hub Badges / Geographic Anchors */}
          <g>
            {caseData.majorHubs.map((hub) => {
              const x = (hub.lng - CENTER_LNG) * BASE_SCALE;
              const y = -(hub.lat - CENTER_LAT) * BASE_SCALE;

              return (
                <g key={`hub-${hub.label}`} transform={`translate(${x}, ${y})`}>
                  {/* Outer pulse circle */}
                  <circle r={12} fill="#E21B23" fillOpacity={0.12} stroke="#E21B23" strokeWidth={0.5} strokeDasharray="2 2" />
                  {/* Hub city label */}
                  <rect
                    x={-28}
                    y={-22}
                    width={56}
                    height={14}
                    rx={3}
                    fill={isLight ? "#FFFFFF" : "#0A0D10"}
                    stroke={isLight ? "#000000" : "#E21B23"}
                    strokeWidth={1}
                  />
                  <text
                    x={0}
                    y={-12}
                    textAnchor="middle"
                    fill={isLight ? "#000000" : "#FFFFFF"}
                    fontSize={8}
                    fontFamily="monospace"
                    fontWeight="bold"
                    letterSpacing="0.05em"
                  >
                    {hub.label}
                  </text>
                </g>
              );
            })}
          </g>

          {/* 3. Case-Scoped Geographic Entity Markers */}
          <g>
            {caseData.nodes.map((gNode) => {
              if (!gNode.hasGeo) return null; // Handled in unanchored tray

              const x = (gNode.lng - CENTER_LNG) * BASE_SCALE;
              const y = -(gNode.lat - CENTER_LAT) * BASE_SCALE;
              const visual = getNodeVisual(gNode);
              const isSelected = selectedNodeId === gNode.id;
              const isKey = gNode.isKeyNode || gNode.isMajorHub;

              return (
                <g
                  key={gNode.id}
                  transform={`translate(${x}, ${y})`}
                  className="cursor-pointer transition-transform group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNode(gNode.id);
                  }}
                  onMouseEnter={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setHoveredNode({
                        node: gNode,
                        screenX: e.clientX - rect.left,
                        screenY: e.clientY - rect.top,
                      });
                    }
                  }}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Selection Pulsing Aura */}
                  {isSelected && (
                    <circle
                      r={visual.radius + 6}
                      fill="none"
                      stroke="#E21B23"
                      strokeWidth={2}
                      filter="url(#crimson-glow)"
                      className="animate-pulse"
                    />
                  )}

                  {/* Render Distinct Node Shape */}
                  {visual.shape === "circle" ? (
                    <circle
                      r={visual.radius}
                      fill={visual.fill}
                      stroke={visual.stroke}
                      strokeWidth={1.5}
                      filter={isKey ? "url(#crimson-glow)" : undefined}
                    />
                  ) : visual.shape === "rect" ? (
                    <rect
                      x={-visual.radius}
                      y={-visual.radius * 0.75}
                      width={visual.radius * 2}
                      height={visual.radius * 1.5}
                      rx={2}
                      fill={visual.fill}
                      stroke={visual.stroke}
                      strokeWidth={1.5}
                    />
                  ) : visual.shape === "diamond" ? (
                    <polygon
                      points={`0,${-visual.radius * 1.2} ${visual.radius * 1.1},0 0,${visual.radius * 1.2} ${-visual.radius * 1.1},0`}
                      fill={visual.fill}
                      stroke={visual.stroke}
                      strokeWidth={1.5}
                    />
                  ) : visual.shape === "triangle" ? (
                    <polygon
                      points={`0,${-visual.radius * 1.2} ${visual.radius},${visual.radius * 0.8} ${-visual.radius},${visual.radius * 0.8}`}
                      fill={visual.fill}
                      stroke={visual.stroke}
                      strokeWidth={1.5}
                    />
                  ) : (
                    /* Default pin / hex */
                    <circle
                      r={visual.radius}
                      fill={visual.fill}
                      stroke={visual.stroke}
                      strokeWidth={1.5}
                    />
                  )}

                  {/* Node Label on Map */}
                  <text
                    x={0}
                    y={visual.radius + 9}
                    textAnchor="middle"
                    fill={isLight ? "#0F172A" : "#F8FAFC"}
                    fontSize={7.5}
                    fontFamily="sans-serif"
                    fontWeight={isKey ? "bold" : "normal"}
                    className="pointer-events-none drop-shadow-sm"
                  >
                    {gNode.label}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* =========================================================================
          TOP-LEFT CASE SUMMARY BANNER (Compact, Unobtrusive)
          ========================================================================= */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div
          className={`px-3 py-1.5 rounded-xl border shadow-lg flex items-center gap-2.5 text-xs font-mono backdrop-blur-md ${
            isLight ? "bg-white/95 border-slate-300 text-slate-900" : "bg-[#0A0D10]/95 border-[#20252A] text-white"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#E21B23] animate-pulse" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#E21B23]">{caseId}</span>
            <span className="text-zinc-500">•</span>
            <span className="font-semibold truncate max-w-[200px]">{caseName}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
            {caseData.geocodedCount} GEOLOCATED
          </span>
        </div>
      </div>

      {/* =========================================================================
          TOP-RIGHT CONTROLS TOOLBAR (Navigation, Re-Center, Grid Toggle)
          ========================================================================= */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-center gap-2">
        <div
          className={`flex flex-col rounded-xl p-1 shadow-lg gap-1 text-xs border backdrop-blur-md ${
            isLight ? "bg-white/95 border-slate-300 text-slate-900" : "bg-[#0A0D10]/95 border-[#20252A] text-white"
          }`}
        >
          <button
            title="Zoom In"
            onClick={() => handleZoom("in")}
            className="p-2 rounded-lg hover:bg-zinc-500/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            title="Zoom Out"
            onClick={() => handleZoom("out")}
            className="p-2 rounded-lg hover:bg-zinc-500/20 transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className={`h-[1px] my-0.5 ${isLight ? "bg-slate-200" : "bg-[#20252A]"}`} />
          <button
            title="Re-Center South Asia Focus"
            onClick={handleResetView}
            className="p-2 rounded-lg hover:bg-zinc-500/20 transition-colors cursor-pointer text-[#E21B23]"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM-LEFT: UNANCHORED ENTITIES DRAWER (Strict Geographic Integrity)
          ========================================================================= */}
      {caseData.unanchoredCount > 0 && (
        <div className="absolute bottom-4 left-4 z-20">
          <button
            onClick={() => setShowUnanchoredTray((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-2 shadow-lg backdrop-blur-md transition-all cursor-pointer ${
              showUnanchoredTray
                ? "bg-[#E21B23] text-white border-[#FF3038]"
                : isLight
                ? "bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-100"
                : "bg-[#0A0D10]/95 border-[#20252A] text-zinc-300 hover:bg-[#1A2026]"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>UNANCHORED ENTITIES ({caseData.unanchoredCount})</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showUnanchoredTray ? "rotate-180" : ""}`} />
          </button>

          {showUnanchoredTray && (
            <div
              className={`mt-2 p-3 rounded-xl border shadow-2xl w-80 max-h-60 overflow-y-auto space-y-2 text-xs font-mono backdrop-blur-md ${
                isLight ? "bg-white border-slate-300 text-slate-900" : "bg-[#0A0D10] border-[#20252A] text-white"
              }`}
            >
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider pb-1 border-b border-zinc-500/20">
                RECORDS WITHOUT EXPLICIT GEOLOCATION
              </div>
              <div className="space-y-1">
                {caseData.nodes
                  .filter((n) => !n.hasGeo)
                  .map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onSelectNode(n.id)}
                      className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                        selectedNodeId === n.id
                          ? "bg-[#E21B23]/20 border-[#E21B23] text-white font-bold"
                          : isLight
                          ? "bg-slate-50 border-slate-200 hover:bg-slate-100"
                          : "bg-[#0E1216] border-[#20252A] hover:bg-[#1A2026]"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold truncate">{n.label}</div>
                        <div className="text-[10px] text-zinc-500 truncate">{n.id}</div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 uppercase">
                        {n.type}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          HOVER TACTICAL INTELLIGENCE TOOLTIP (Matching 3D Globe)
          ========================================================================= */}
      {hoveredNode && (
        <div
          className={`absolute pointer-events-none z-30 p-3 rounded-xl border shadow-2xl text-xs font-mono max-w-xs transition-transform duration-75 backdrop-blur-md ${
            isLight ? "bg-white/95 border-slate-400 text-slate-900" : "bg-[#0A0D10]/95 border-[#20252A] text-white"
          }`}
          style={{
            left: `${hoveredNode.screenX + 16}px`,
            top: `${hoveredNode.screenY + 16}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b pb-1.5 mb-1.5 border-zinc-500/30">
            <div className="flex items-center gap-1.5">
              {renderTypeIcon(hoveredNode.node.type)}
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-red-100 text-red-800 border border-black">
                {hoveredNode.node.type}
              </span>
            </div>
            {hoveredNode.node.isKeyNode && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#E21B23] text-white font-bold">
                KEY TARGET
              </span>
            )}
          </div>

          <div className="font-bold text-sm">{hoveredNode.node.label}</div>
          <div className="text-[10px] text-zinc-500 truncate font-mono">{hoveredNode.node.id}</div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-500/20 text-[10px]">
            <div>
              <span className="text-zinc-500">Case: </span>
              <span className="font-bold text-[#E21B23]">{caseId}</span>
            </div>
            {hoveredNode.node.degree !== undefined && (
              <div>
                <span className="text-zinc-500">Degree: </span>
                <span className="font-bold">{hoveredNode.node.degree}</span>
              </div>
            )}
          </div>

          {hoveredNode.node.locationName && (
            <div className="mt-2 pt-1.5 border-t border-zinc-500/30 flex items-center gap-1 text-[10px] text-[#E21B23] font-semibold">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{hoveredNode.node.locationName}</span>
            </div>
          )}

          <div className="mt-2 text-[9px] text-[#E21B23] font-bold tracking-wider text-right">
            CLICK TO SELECT & SYNC DOSSIER ›
          </div>
        </div>
      )}

      {/* =========================================================================
          BOTTOM-CENTER LEGEND
          ========================================================================= */}
      <div
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3.5 py-1.5 rounded-full shadow-md text-[10px] font-mono border z-20 backdrop-blur-md ${
          isLight ? "bg-white/95 border-slate-300 text-slate-900" : "bg-[#0A0D10]/95 border-[#20252A] text-white"
        }`}
      >
        <span className="font-bold uppercase tracking-wider">GEOGRAPHIC CONDUITS:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#E21B23]" />
          <span>Cross-Regional</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span>Local Sector Hub</span>
        </div>
      </div>
    </div>
  );
};

export default GeoMap2DCanvas;

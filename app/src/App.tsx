import React, { useEffect, useState, useMemo } from "react";
import { GraphKernel, GraphNode, GraphEdge, FilterState, CutResult, PatternHit, ObjectType, LinkType, OBJECT_TYPES, LINK_TYPES } from "./types";
import { fetchGraphKernel, runCutSimulation } from "./lib/api";
import LandingPage from "./landing/LandingPage";
import { Header } from "./components/Header";
import { DemoScriptTour } from "./components/DemoScriptTour";
import { GraphCanvas } from "./canvas/GraphCanvas";
import { CanvasControls } from "./canvas/CanvasControls";
import { FilterToolbar } from "./canvas/FilterToolbar";
import { DossierPanel } from "./dossier/DossierPanel";
import { TimelinePanel } from "./timeline/TimelinePanel";
import { CopilotPanel } from "./copilot/CopilotPanel";
import { Shield, RefreshCw, AlertCircle } from "lucide-react";

export function App() {
  // Page Routing State: "landing" | "workbench"
  const [currentPage, setCurrentPage] = useState<"landing" | "workbench">(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === "/workbench" || hash === "#workbench") {
        return "workbench";
      }
    }
    return "landing";
  });

  const [kernel, setKernel] = useState<GraphKernel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active UI Panel Tab in Workbench
  const [activeTab, setActiveTab] = useState<"dossier" | "timeline" | "copilot">("dossier");

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("person:naveen_bhatia");
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);

  // Visual mode & Layout state
  const [layoutName, setLayoutName] = useState<string>("cose");
  const [colorByCommunity, setColorByCommunity] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [activePattern, setActivePattern] = useState<string | null>(null);

  // Counterfactual Arrest Cut Simulation state
  const [arrestTarget, setArrestTarget] = useState<string | null>(null);
  const [arrestCutResult, setArrestCutResult] = useState<CutResult | null>(null);

  // Demo Script Step
  const [demoStep, setDemoStep] = useState<number>(1);

  // Filter state
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: "",
    selectedObjectTypes: new Set<ObjectType>(OBJECT_TYPES as any),
    selectedLinkTypes: new Set<LinkType>(LINK_TYPES as any),
    minBetweenness: 0,
    communityFilter: "all",
    timeWindowStart: null,
    timeWindowEnd: null,
    minTransactionAmount: 0,
    activePattern: null,
    isolatedSeedId: null,
    isolateHops: 2,
  });

  // Handle Browser History (Back / Forward navigation)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === "/workbench" || hash === "#workbench" || e.state?.page === "workbench") {
        setCurrentPage("workbench");
      } else {
        setCurrentPage("landing");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (page: "landing" | "workbench") => {
    setCurrentPage(page);
    const targetUrl = page === "workbench" ? "/workbench" : "/";
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ page }, "", targetUrl);
    }
  };

  // Load Graph Kernel on Mount
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const data = await fetchGraphKernel();
        setKernel(data);
        if (data.cut) {
          setArrestCutResult(data.cut);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load graph data");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Map of nodes for quick lookup
  const nodesMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    if (kernel) {
      kernel.nodes.forEach((n) => map.set(n.id, n));
    }
    return map;
  }, [kernel]);

  // Selected node object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodesMap.get(selectedNodeId) || null;
  }, [selectedNodeId, nodesMap]);

  // Incident edges of the selected node
  const incidentEdges = useMemo(() => {
    if (!kernel || !selectedNodeId) return [];
    return kernel.edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    );
  }, [kernel, selectedNodeId]);

  // Handle Demo Script Steps (Sacred Demo Script)
  const handleDemoStepChange = async (stepId: number) => {
    setDemoStep(stepId);

    if (stepId === 1) {
      // Step 1: Total Hairball
      setColorByCommunity(false);
      setActivePattern(null);
      setArrestTarget(null);
      setLayoutName("cose");
      setSelectedNodeId(null);
      setHighlightedNodeIds([]);
      setFilterState((prev) => ({
        ...prev,
        selectedObjectTypes: new Set<ObjectType>(OBJECT_TYPES as any),
        selectedLinkTypes: new Set<LinkType>(LINK_TYPES as any),
        searchQuery: "",
        minBetweenness: 0,
        communityFilter: "all",
      }));
    } else if (stepId === 2) {
      // Step 2: Community Partition
      setColorByCommunity(true);
      setActivePattern(null);
      setArrestTarget(null);
      setLayoutName("cose");
    } else if (stepId === 3) {
      // Step 3: Accountant Identification
      setColorByCommunity(false);
      setActivePattern("accountant_cutpoint");
      setArrestTarget(null);
      setSelectedNodeId("person:naveen_bhatia");
      setActiveTab("dossier");
      setLayoutName("concentric");
    } else if (stepId === 4) {
      // Step 4: Hawala Cycle
      setColorByCommunity(false);
      setActivePattern("hawala_cycle");
      setArrestTarget(null);
      setSelectedNodeId("acc:a02");
      setActiveTab("dossier");
    } else if (stepId === 5) {
      // Step 5: Counterfactual Arrest Simulation
      setActivePattern(null);
      setArrestTarget("person:naveen_bhatia");
      const cutRes = await runCutSimulation("person:naveen_bhatia");
      setArrestCutResult(cutRes.result);
      setSelectedNodeId("person:naveen_bhatia");
      setActiveTab("dossier");
    } else if (stepId === 6) {
      // Step 6: Copilot RAG
      setSelectedNodeId("person:naveen_bhatia");
      setActiveTab("copilot");
    }
  };

  // Run Arrest Cut Simulation on any selected node
  const handleRunArrestSimulation = async (targetId: string) => {
    setArrestTarget(targetId);
    const cutRes = await runCutSimulation(targetId);
    setArrestCutResult(cutRes.result);
  };

  // Isolate Neighborhood
  const handleIsolateNeighborhood = (seedId: string) => {
    setSelectedNodeId(seedId);
    setFilterState((prev) => ({
      ...prev,
      isolatedSeedId: prev.isolatedSeedId === seedId ? null : seedId,
    }));
  };

  // Ask Copilot about entity
  const handleAskCopilot = (seedId: string) => {
    setSelectedNodeId(seedId);
    setActiveTab("copilot");
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilterState({
      searchQuery: "",
      selectedObjectTypes: new Set<ObjectType>(OBJECT_TYPES as any),
      selectedLinkTypes: new Set<LinkType>(LINK_TYPES as any),
      minBetweenness: 0,
      communityFilter: "all",
      timeWindowStart: null,
      timeWindowEnd: null,
      minTransactionAmount: 0,
      activePattern: null,
      isolatedSeedId: null,
      isolateHops: 2,
    });
    setColorByCommunity(false);
    setActivePattern(null);
    setArrestTarget(null);
    setHighlightedNodeIds([]);
  };

  // If on Landing Page, render Landing Page
  if (currentPage === "landing") {
    return <LandingPage onLaunchWorkbench={() => navigateTo("workbench")} />;
  }

  // If loading workbench kernel
  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#070b13] flex flex-col items-center justify-center text-slate-300 space-y-4">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600/20 border border-sky-500/40 animate-pulse">
          <Shield className="w-8 h-8 text-sky-400" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold text-slate-100 tracking-tight font-mono">
            GOTHAM_SIH INVESTIGATION WORKBENCH
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Loading Operation Grey Ledger graph kernel (3.8k links, 80 persons)...
          </p>
        </div>
        <RefreshCw className="w-5 h-5 text-sky-400 animate-spin" />
      </div>
    );
  }

  // If error loading kernel
  if (error || !kernel) {
    return (
      <div className="h-screen w-screen bg-[#070b13] flex flex-col items-center justify-center text-slate-300 p-6">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-base font-bold text-slate-100">Failed to load graph kernel</h2>
        <p className="text-xs text-rose-400 mt-1 max-w-md text-center">{error}</p>
        <button
          onClick={() => navigateTo("landing")}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700"
        >
          Return to Landing
        </button>
      </div>
    );
  }

  // Render Full Investigation Workbench
  return (
    <div className="h-screen w-screen flex flex-col bg-[#070b13] text-slate-200 overflow-hidden font-sans">
      {/* Top Header with Back to Landing */}
      <Header
        kernel={kernel}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onBackToLanding={() => navigateTo("landing")}
      />

      {/* Sacred Demo Script Tour Bar */}
      <DemoScriptTour
        currentStep={demoStep}
        onSelectStep={handleDemoStepChange}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center: Graph Canvas Area */}
        <div className="flex-1 relative h-full">
          <GraphCanvas
            nodes={kernel.nodes}
            edges={kernel.edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={(nodeId) => {
              setSelectedNodeId(nodeId);
              setSelectedEdge(null);
            }}
            selectedEdgeId={selectedEdge?.id || null}
            onSelectEdge={(edge) => {
              setSelectedEdge(edge);
              setSelectedNodeId(null);
            }}
            filterState={filterState}
            colorByCommunity={colorByCommunity}
            activePattern={activePattern}
            patterns={kernel.patterns}
            arrestTarget={arrestTarget}
            arrestCutResult={arrestCutResult}
            highlightedNodeIds={highlightedNodeIds}
            layoutName={layoutName}
            onLayoutChange={(l) => setLayoutName(l)}
            showLabels={showLabels}
          />

          {/* Floating Controls */}
          <CanvasControls
            layoutName={layoutName}
            onLayoutChange={(l) => setLayoutName(l)}
            colorByCommunity={colorByCommunity}
            onToggleCommunity={() => setColorByCommunity((prev) => !prev)}
            showLabels={showLabels}
            onToggleLabels={() => setShowLabels((prev) => !prev)}
            onFit={() => setLayoutName((prev) => prev)}
            onReset={handleResetFilters}
            activePattern={activePattern}
            onSelectPattern={(pat) => setActivePattern(pat)}
          />

          {/* Bottom Filter Toolbar */}
          <FilterToolbar
            filterState={filterState}
            onChange={(next) => setFilterState(next)}
            onReset={handleResetFilters}
            totalNodes={kernel.nodes.length}
            totalEdges={kernel.edges.length}
          />
        </div>

        {/* Right Sidebar: Dossier | Timeline | Copilot */}
        <div className="w-[360px] xl:w-[420px] h-full flex flex-col z-20 border-l border-slate-800 shadow-2xl">
          {activeTab === "dossier" && (
            <DossierPanel
              node={selectedNode}
              selectedEdge={selectedEdge}
              incidentEdges={incidentEdges}
              onSelectNeighbor={(nid) => {
                setSelectedNodeId(nid);
                setSelectedEdge(null);
              }}
              onIsolateNeighborhood={handleIsolateNeighborhood}
              onRunArrestSimulation={handleRunArrestSimulation}
              onAskCopilot={handleAskCopilot}
              patterns={kernel.patterns}
            />
          )}

          {activeTab === "timeline" && (
            <TimelinePanel
              edges={kernel.edges}
              nodes={kernel.nodes}
              onSelectEvent={(src, tgt, rawEdge) => {
                if (rawEdge) {
                  setSelectedEdge(rawEdge);
                  setSelectedNodeId(null);
                } else {
                  setSelectedNodeId(src);
                  setSelectedEdge(null);
                }
              }}
              onFilterAfterTime={(time) =>
                setFilterState((prev) => ({ ...prev, timeWindowStart: time }))
              }
              selectedTimeFilter={filterState.timeWindowStart}
            />
          )}

          {activeTab === "copilot" && (
            <CopilotPanel
              selectedNodeId={selectedNodeId}
              nodes={kernel.nodes}
              onHighlightNodes={(nids) => setHighlightedNodeIds(nids)}
              onSelectNode={(nid) => {
                setSelectedNodeId(nid);
                setSelectedEdge(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

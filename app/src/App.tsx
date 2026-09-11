import React, { useEffect, useState, useMemo } from "react";
import { GraphKernel, GraphEdge, FilterState, CutResult, ObjectType, LinkType, OBJECT_TYPES, LINK_TYPES } from "./types";
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
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CaseProvider, useCase } from "./context/CaseContext";
import { LoginScreen } from "./components/auth/LoginScreen";
import { AdminUserModal } from "./components/admin/AdminUserModal";
import { Shield, RefreshCw, AlertCircle } from "lucide-react";

function WorkbenchContent() {
  const { user, token, loading: authLoading } = useAuth();
  const { activeCase } = useCase();

  // Page Routing State: Always default to "landing" Home Page upon initial login
  const [currentPage, setCurrentPage] = useState<"landing" | "workbench">("landing");

  const [kernel, setKernel] = useState<GraphKernel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin User Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

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

  // Load Graph Kernel on Mount or Case Change
  useEffect(() => {
    async function init() {
      if (!user) return;
      try {
        setLoading(true);
        const data = await fetchGraphKernel(token);
        setKernel(data);
        if (data.cut) {
          setArrestCutResult(data.cut);
        }
        setError(null);
      } catch (err: any) {
        console.error("Failed to load kernel:", err);
        setError(err?.message || "Failed to load investigation graph kernel.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user, token, activeCase.id]);

  // Selected Node data accessor
  const selectedNode = useMemo(() => {
    if (!kernel || !selectedNodeId) return null;
    return kernel.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [kernel, selectedNodeId]);

  // Incident Edges accessor
  const incidentEdges = useMemo(() => {
    if (!kernel || !selectedNodeId) return [];
    return kernel.edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    );
  }, [kernel, selectedNodeId]);

  // Handle Counterfactual Arrest Simulation
  const handleRunArrestSimulation = async (targetId: string) => {
    setArrestTarget(targetId);
    try {
      const res = await runCutSimulation(targetId, undefined, undefined, token);
      if (res && res.result) {
        setArrestCutResult(res.result);
      }
    } catch (err) {
      console.error("Arrest simulation error:", err);
    }
  };

  const handleIsolateNeighborhood = (seedId: string, hops: number = 2) => {
    setFilterState((prev) => ({
      ...prev,
      isolatedSeedId: seedId,
      isolateHops: hops,
    }));
  };

  const handleAskCopilot = (seedId: string) => {
    setSelectedNodeId(seedId);
    setActiveTab("copilot");
  };

  const resetFilters = () => {
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
  };

  if (authLoading) {
    return (
      <div className="w-screen h-screen bg-[#070a11] flex flex-col items-center justify-center text-slate-300">
        <Shield className="w-10 h-10 text-emerald-400 animate-pulse mb-3" />
        <span className="text-sm font-mono tracking-widest text-emerald-400">AUTHENTICATING ACCESS...</span>
      </div>
    );
  }

  // Enforce Login Protection
  if (!user) {
    return <LoginScreen />;
  }

  // Render Home Page (Landing Page with 3D Lanyard, Case Briefing, Features & Access Desk CTA)
  if (currentPage === "landing") {
    return <LandingPage onLaunchWorkbench={() => navigateTo("workbench")} />;
  }

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#070a11] flex flex-col items-center justify-center text-slate-300">
        <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-100">Loading {activeCase.name}...</h2>
        <p className="text-xs text-slate-500 font-mono mt-1">Initializing graph kernel & centrality metrics</p>
      </div>
    );
  }

  if (error || !kernel) {
    return (
      <div className="w-screen h-screen bg-[#070a11] flex flex-col items-center justify-center text-slate-300 p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-rose-400 mb-1">Graph Initialization Failed</h2>
        <p className="text-sm text-slate-400 max-w-md text-center mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#070a11] flex flex-col overflow-hidden text-slate-100 font-sans select-none">
      {/* Header */}
      <Header
        kernel={kernel}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onBackToLanding={() => navigateTo("landing")}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Filter Toolbar */}
        <FilterToolbar
          filterState={filterState}
          onChange={(next) => setFilterState(next)}
          onReset={resetFilters}
          totalNodes={kernel.nodes.length}
          totalEdges={kernel.edges.length}
        />

        {/* Center Cytoscape Canvas */}
        <div className="flex-1 h-full relative bg-[#070a11]">
          <GraphCanvas
            nodes={kernel.nodes}
            edges={kernel.edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={(nid) => {
              setSelectedNodeId(nid);
              setSelectedEdge(null);
            }}
            selectedEdgeId={selectedEdge ? `${selectedEdge.source}-${selectedEdge.target}-${selectedEdge.type}` : null}
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
            onLayoutChange={(layout) => setLayoutName(layout)}
            showLabels={showLabels}
          />

          {/* Canvas Floating Controls */}
          <CanvasControls
            layoutName={layoutName}
            onLayoutChange={(layout) => setLayoutName(layout)}
            colorByCommunity={colorByCommunity}
            onToggleCommunity={() => setColorByCommunity((prev) => !prev)}
            showLabels={showLabels}
            onToggleLabels={() => setShowLabels((prev) => !prev)}
            onFit={() => {}}
            onReset={resetFilters}
            activePattern={activePattern}
            onSelectPattern={(pat) => {
              setActivePattern(pat);
              setFilterState((prev) => ({ ...prev, activePattern: pat }));
            }}
          />

          {/* Sacred Demo Tour Guide Floating Overlay */}
          <DemoScriptTour
            currentStep={demoStep}
            onSelectStep={(step) => setDemoStep(step)}
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

      {/* Admin Investigator Provisioning Modal */}
      <AdminUserModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <CaseProvider>
        <WorkbenchContent />
      </CaseProvider>
    </AuthProvider>
  );
}
export default App;

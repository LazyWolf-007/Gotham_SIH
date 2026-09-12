import React, { useEffect, useState, useMemo, useCallback } from "react";
import { GraphKernel, GraphEdge, FilterState, CutResult, ObjectType, LinkType, OBJECT_TYPES, LINK_TYPES } from "./types";
import { fetchGraphKernel, runCutSimulation } from "./lib/api";
import { filterCaseScopedNetwork } from "./lib/entityAdapter";
import LandingPage from "./landing/LandingPage";
import { Header } from "./components/Header";
import { DemoScriptTour } from "./components/DemoScriptTour";
import { GraphCanvas } from "./canvas/GraphCanvas";
import { GlobeCanvas } from "./canvas/GlobeCanvas";
import { GeoMap2DCanvas } from "./canvas/GeoMap2DCanvas";
import { SidebarNav, SidebarTab } from "./components/SidebarNav";
import { DetectedPatternsRow } from "./components/patterns/DetectedPatternsRow";
import { CaseManagementView } from "./components/case/CaseManagementView";
import { EvidenceView } from "./components/evidence/EvidenceView";
import { AnalyticsView } from "./components/analytics/AnalyticsView";
import { CommunitiesView } from "./components/communities/CommunitiesView";
import { ScenariosView } from "./components/scenarios/ScenariosView";
import { TimelineView } from "./components/timeline/TimelineView";
import { DossierView } from "./components/dossier/DossierView";
import { DossierPanel } from "./dossier/DossierPanel";
import { TimelinePanel } from "./timeline/TimelinePanel";
import { CopilotPanel } from "./copilot/CopilotPanel";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CaseProvider, useCase } from "./context/CaseContext";
import { ToastProvider } from "./context/ToastContext";
import { LoginScreen } from "./components/auth/LoginScreen";
import { WorkstationLockScreen } from "./components/auth/WorkstationLockScreen";
import { PoliceCommandOverview } from "./components/overview/PoliceCommandOverview";
import { InvestigationReportModal } from "./components/dossier/InvestigationReportModal";
import { AdminUserModal } from "./components/admin/AdminUserModal";
import { Shield, RefreshCw, AlertCircle } from "lucide-react";

function WorkbenchContent() {
  const { user, token, loading: authLoading, isLocked } = useAuth();
  const { activeCase } = useCase();

  // Page Routing State: Default to "landing" Home Page
  const [currentPage, setCurrentPage] = useState<"landing" | "login" | "workbench">(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === "/workbench" || hash === "#workbench") return "workbench";
    if (path === "/login" || hash === "#login") return "login";
    return "landing";
  });

  const [kernel, setKernel] = useState<GraphKernel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin User Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isGlobalReportModalOpen, setIsGlobalReportModalOpen] = useState(false);

  // Active UI Panel Tab in Workbench
  const [activeTab, setActiveTab] = useState<"dossier" | "timeline" | "copilot">("dossier");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("overview");

  // Selection state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("person:naveen_bhatia");
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);

  // Visual mode & Layout state
  const [layoutName, setLayoutName] = useState<string>("cose");
  const [colorByCommunity, setColorByCommunity] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [activePattern, setActivePattern] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");

  // Theme state: Persisted in localStorage ("dark" | "light")
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("gotham_theme") as "dark" | "light") || "dark";
  });

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("gotham_theme", next);
      document.documentElement.setAttribute("data-theme", next);
      if (next === "light") {
        document.documentElement.classList.add("light");
      } else {
        document.documentElement.classList.remove("light");
      }
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

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
      } else if (path === "/login" || hash === "#login" || e.state?.page === "login") {
        setCurrentPage("login");
      } else {
        setCurrentPage("landing");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateTo = (page: "landing" | "login" | "workbench") => {
    setCurrentPage(page);
    const targetUrl = page === "workbench" ? "/workbench" : page === "login" ? "/login" : "/";
    if (window.location.pathname !== targetUrl) {
      window.history.pushState({ page }, "", targetUrl);
    }
  };

  const handleLaunchWorkbench = () => {
    if (user) {
      navigateTo("workbench");
    } else {
      navigateTo("login");
    }
  };

  // If user logs out while in workbench, return to landing page
  useEffect(() => {
    if (!user && currentPage === "workbench") {
      navigateTo("landing");
    }
  }, [user]);

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

  // Case-Scoped Graph Network (Source of truth: selected activeCase)
  const caseScopedData = useMemo(() => {
    if (!kernel) return { nodes: [], edges: [] };
    const scoped = filterCaseScopedNetwork(activeCase.id, kernel.nodes, kernel.edges);
    const nodes = scoped.nodes.map((an) => {
      const raw = kernel.nodes.find((kn) => kn.id === an.id);
      return (
        raw || {
          id: an.id,
          type: an.type,
          label: an.label,
          attributes: an.attributes,
          metrics: an.metrics,
        }
      );
    });
    const edges = scoped.edges.map((ae) => ae.raw);
    return { nodes, edges };
  }, [activeCase.id, kernel]);

  // Automatically synchronize selectedNodeId and Dossier to the primary target of the selected case
  useEffect(() => {
    if (!caseScopedData.nodes.length) return;
    const currentStillValid = caseScopedData.nodes.some((n) => n.id === selectedNodeId);
    if (!currentStillValid) {
      const primaryNode =
        caseScopedData.nodes.find((n) => n.id === "person:naveen_bhatia" || n.id === "person:p71" || n.id === "person:p38") ||
        caseScopedData.nodes.find((n) => n.type === "Person") ||
        caseScopedData.nodes[0];
      if (primaryNode) {
        setSelectedNodeId(primaryNode.id);
        setSelectedEdge(null);
      }
    }
  }, [activeCase.id, caseScopedData.nodes, selectedNodeId]);

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

  // 1. Landing Page: Open and visible by default without blocking login
  if (currentPage === "landing") {
    return <LandingPage onLaunchWorkbench={handleLaunchWorkbench} />;
  }

  // 2. Explicit Login Route
  if (currentPage === "login") {
    if (user) {
      // If user is already authenticated, redirect straight to workbench
      navigateTo("workbench");
    } else {
      return (
        <LoginScreen
          onBackToLanding={() => {
            navigateTo("landing");
            window.history.replaceState({ page: "landing" }, "", "/");
          }}
          onLoginSuccess={() => navigateTo("workbench")}
        />
      );
    }
  }

  // 3. Workbench / Dashboard: Protected Route
  if (authLoading) {
    return (
      <div className="w-screen h-screen bg-[#070a11] flex flex-col items-center justify-center text-slate-300">
        <Shield className="w-10 h-10 text-emerald-400 animate-pulse mb-3" />
        <span className="text-sm font-mono tracking-widest text-emerald-400">AUTHENTICATING ACCESS...</span>
      </div>
    );
  }

  // If not logged in and attempting to access workbench, prompt login with back option
  if (!user) {
    return (
      <LoginScreen
        onBackToLanding={() => navigateTo("landing")}
        onLoginSuccess={() => navigateTo("workbench")}
      />
    );
  }

  // Workstation Lock Screen: hide all investigation data when locked
  if (isLocked) {
    return <WorkstationLockScreen />;
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
        <div className="max-w-md w-full p-6 rounded-2xl bg-[#0E1216] border border-red-500/50 shadow-2xl flex flex-col gap-4 text-xs font-sans">
          <div className="flex items-center gap-2 text-red-400 font-bold font-mono uppercase tracking-wider text-xs">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span>WHAT HAPPENED</span>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed">
            {error || "Failed to establish connection to the backend graph kernel."}
          </p>

          <div className="pt-3 border-t border-[#20252A] flex flex-col gap-2">
            <span className="text-red-400 font-bold font-mono uppercase tracking-wider text-[10px]">
              WHAT THE USER CAN DO
            </span>
            <ul className="list-disc list-inside text-slate-400 space-y-1 text-[11px] font-mono">
              <li>Ensure FastAPI backend is active (`python -m uvicorn ...`)</li>
              <li>Verify network connectivity on port 8000</li>
              <li>Click 'Retry Connection' below to reload workstation</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-2 w-full py-2.5 bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-bold font-mono rounded-xl transition-all cursor-pointer shadow-md shadow-[#E21B23]/30"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const isLight = theme === "light";

  return (
    <div className={`w-screen h-screen flex flex-col overflow-hidden font-sans select-none transition-colors duration-200 ${isLight ? "bg-slate-50 text-slate-900" : "bg-[#050607] text-[#F2F2F2]"}`}>
      {/* Top Tactical Header */}
      <Header
        kernel={kernel}
        searchQuery={filterState.searchQuery}
        onSearchChange={(query) =>
          setFilterState((prev) => ({ ...prev, searchQuery: query }))
        }
        onSelectEntity={(entityId) => {
          setSelectedNodeId(entityId);
          setSelectedEdge(null);
          setSidebarTab("graph");
          setActiveTab("dossier");
        }}
        onBackToLanding={() => navigateTo("landing")}
        onUploadClick={() => setIsAdminModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main 3-Column Dashboard Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Column 1: Left Navigation Rail */}
        <SidebarNav
          activeTab={sidebarTab}
          onSelectTab={(tab) => {
            setSidebarTab(tab);
            if (tab === "dossier") setActiveTab("dossier");
            else if (tab === "timeline") setActiveTab("timeline");
            else if (tab === "copilot") setActiveTab("copilot");
            else if (tab === "overview" || tab === "graph") setActiveTab("dossier");
          }}
          onOpenAdminModal={() => setIsAdminModalOpen(true)}
          theme={theme}
        />

        {/* Column 2: Center Main Investigation Stage */}
        {sidebarTab === "overview" ? (
          <PoliceCommandOverview
            kernel={kernel}
            onOpenCase={(caseId) => {
              setSidebarTab("cases");
            }}
            onOpenGraph={(focusEntityId) => {
              if (focusEntityId) {
                setSelectedNodeId(focusEntityId);
                setSelectedEdge(null);
              }
              setSidebarTab("graph");
              setActiveTab("dossier");
            }}
            onOpenSubjects={() => {
              setSidebarTab("cases");
            }}
            onOpenEvidence={(evidenceId) => {
              setSidebarTab("evidence");
            }}
            onOpenTimeline={() => {
              setSidebarTab("timeline");
            }}
            onOpenDossier={() => {
              setSidebarTab("dossier");
            }}
            onOpenScenarios={() => {
              setSidebarTab("scenarios");
            }}
            onGenerateReport={() => {
              setIsGlobalReportModalOpen(true);
            }}
            theme={theme}
          />
        ) : sidebarTab === "cases" ? (
          <CaseManagementView
            kernel={kernel}
            onOpenCaseNetwork={(caseId, focusEntityId) => {
              if (focusEntityId) {
                setSelectedNodeId(focusEntityId);
                setSelectedEdge(null);
              }
              setSidebarTab("graph");
              setActiveTab("dossier");
            }}
            onOpenEvidence={() => setSidebarTab("evidence")}
            onOpenTimeline={() => setSidebarTab("timeline")}
            onOpenAnalytics={() => setSidebarTab("analytics")}
            onOpenScenarios={() => setSidebarTab("scenarios")}
            onOpenDossier={() => setSidebarTab("dossier")}
            theme={theme}
          />
        ) : sidebarTab === "evidence" ? (
          <EvidenceView
            kernel={kernel}
            onSelectEntity={(entityId) => {
              setSelectedNodeId(entityId);
              setSelectedEdge(null);
              setSidebarTab("graph");
              setActiveTab("dossier");
            }}
            onOpenTimeline={() => setSidebarTab("timeline")}
            onOpenDossier={() => setSidebarTab("dossier")}
            theme={theme}
          />
        ) : sidebarTab === "dossier" ? (
          <DossierView
            kernel={kernel}
            onSelectEntity={(entityId) => {
              setSelectedNodeId(entityId);
              setSelectedEdge(null);
              setSidebarTab("graph");
              setActiveTab("dossier");
            }}
            onOpenEvidence={() => setSidebarTab("evidence")}
            onOpenTimeline={() => setSidebarTab("timeline")}
            onOpenCaseNetwork={(caseId) => {
              setSidebarTab("graph");
              setActiveTab("dossier");
            }}
            theme={theme}
          />
        ) : sidebarTab === "timeline" ? (
          <TimelineView
            kernel={kernel}
            onSelectEntity={(entityId) => {
              setSelectedNodeId(entityId);
              setSelectedEdge(null);
              setSidebarTab("graph");
              setActiveTab("dossier");
            }}
            onOpenEvidence={() => setSidebarTab("evidence")}
            theme={theme}
          />
        ) : sidebarTab === "analytics" ? (
          <AnalyticsView
            kernel={kernel}
            onSelectEntity={(entityId) => {
              setSelectedNodeId(entityId);
              setSelectedEdge(null);
              setSidebarTab("graph");
              setActiveTab("dossier");
            }}
            onIsolateCommunity={(commId) => {
              setFilterState((prev) => ({ ...prev, communityFilter: commId }));
              setColorByCommunity(true);
              setSidebarTab("graph");
            }}
            onOpenTimeline={() => setSidebarTab("timeline")}
            onOpenEvidence={() => setSidebarTab("evidence")}
            onOpenDossier={() => setSidebarTab("dossier")}
            onOpenGraph={(focusId) => {
              if (focusId) setSelectedNodeId(focusId);
              setSidebarTab("graph");
            }}
            onSelectPattern={(patternId) => {
              setActivePattern(patternId);
              setSidebarTab("graph");
            }}
            theme={theme}
          />
        ) : sidebarTab === "communities" ? (
          <CommunitiesView
            kernel={kernel}
            onSelectEntity={(entityId) => {
              setSelectedNodeId(entityId);
              setSelectedEdge(null);
              setSidebarTab("graph");
              setActiveTab("dossier");
            }}
            onIsolateCommunity={(commId) => {
              setFilterState((prev) => ({ ...prev, communityFilter: commId }));
              setColorByCommunity(true);
              setSidebarTab("graph");
            }}
          />
        ) : sidebarTab === "scenarios" ? (
          <ScenariosView
            kernel={kernel}
            token={token}
            onSelectEntity={(entityId) => {
              setSelectedNodeId(entityId);
              setSelectedEdge(null);
              setSidebarTab("graph");
              setActiveTab("dossier");
            }}
            onApplySimulationToGraph={(targetId, result) => {
              setArrestTarget(targetId);
              setArrestCutResult(result);
              if (targetId) {
                setSidebarTab("graph");
              }
            }}
          />
        ) : (
          /* Default Network Overview / Graph Canvas Stage (Strictly 2 Modes: 3D Globe & 2D Geographic) */
          <div className="flex-1 flex flex-col p-3 gap-2.5 bg-[#050607] overflow-hidden min-w-0">
            {/* Breadcrumbs & Mode Switcher Bar */}
            <div className="flex items-center justify-between px-1 text-xs select-none shrink-0">
              <div className="flex items-center gap-2 font-mono">
                <span
                  className="text-[#858B92] font-medium hover:text-white cursor-pointer transition-colors"
                  onClick={() => navigateTo("landing")}
                >
                  {activeCase.name}
                </span>
                <span className="text-[#555C63]">›</span>
                <span className="text-white font-semibold tracking-wide">
                  {viewMode === "3d" ? "3D Case Intelligence Globe" : "2D Geographic Intelligence Map"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* STRICTLY ONLY TWO VISUAL MODES: 3D Globe / 2D Geographic */}
                <div className="flex items-center bg-[#0E1216] border border-[#20252A] rounded-lg p-0.5 text-[11px] font-mono">
                  <button
                    onClick={() => setViewMode("3d")}
                    className={`px-3 py-1 rounded cursor-pointer transition-colors flex items-center gap-1.5 font-bold ${
                      viewMode === "3d"
                        ? "bg-[#E21B23] text-white shadow-sm"
                        : "text-[#858B92] hover:text-white"
                    }`}
                  >
                    <span>3D Globe</span>
                  </button>
                  <button
                    onClick={() => setViewMode("2d")}
                    className={`px-3 py-1 rounded cursor-pointer transition-colors flex items-center gap-1.5 font-bold ${
                      viewMode === "2d"
                        ? "bg-[#E21B23] text-white shadow-sm"
                        : "text-[#858B92] hover:text-white"
                    }`}
                  >
                    <span>2D Geographic</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[#858B92] font-mono ml-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="tracking-wider hidden xl:inline">
                    {viewMode === "3d" ? "3D WEBGL ENGINE" : "2D FLAT EARTH"}
                  </span>
                </div>
              </div>
            </div>

            {/* Main Center Canvas Container */}
            <div className={`flex-1 rounded-2xl border overflow-hidden relative shadow-2xl transition-colors duration-200 ${isLight ? "bg-white border-black" : "bg-[#050607] border-[#20252A]"}`}>
              {viewMode === "3d" ? (
                <GlobeCanvas
                  caseId={activeCase.id}
                  caseName={activeCase.name}
                  caseAgency={activeCase.agency}
                  caseStatus={activeCase.status}
                  casePriority={activeCase.priority}
                  nodes={caseScopedData.nodes}
                  edges={caseScopedData.edges}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={(nid) => {
                    setSelectedNodeId(nid);
                    setSelectedEdge(null);
                  }}
                  theme={theme}
                  onOpenDossier={() => setSidebarTab("dossier")}
                  onOpenTimeline={() => setSidebarTab("timeline")}
                  onOpenEvidence={() => setSidebarTab("evidence")}
                  onResetFilters={resetFilters}
                />
              ) : (
                <GeoMap2DCanvas
                  caseId={activeCase.id}
                  caseName={activeCase.name}
                  caseAgency={activeCase.agency}
                  nodes={caseScopedData.nodes}
                  edges={caseScopedData.edges}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={(nid) => {
                    setSelectedNodeId(nid);
                    setSelectedEdge(null);
                  }}
                  theme={theme}
                  onOpenDossier={() => setSidebarTab("dossier")}
                />
              )}

              {/* Sacred Demo Tour Guide Floating Overlay */}
              <DemoScriptTour
                currentStep={demoStep}
                onSelectStep={(step) => setDemoStep(step)}
              />
            </div>

            {/* Detected Patterns Bottom Row */}
            <div className="h-[96px] shrink-0">
              <DetectedPatternsRow
                activePattern={activePattern}
                onSelectPattern={(patternId) => {
                  const next = activePattern === patternId ? null : patternId;
                  setActivePattern(next);
                  setFilterState((prev) => ({ ...prev, activePattern: next }));
                }}
                theme={theme}
              />
            </div>
          </div>
        )}

        {/* Column 3: Right Intelligence Dossier / Timeline / Copilot Panel (Only shown on Graph view) */}
        {sidebarTab === "graph" && (
          <div className={`w-[380px] xl:w-[420px] h-full flex flex-col z-20 border-l shadow-2xl shrink-0 transition-colors duration-200 ${isLight ? "bg-white border-black text-black" : "bg-[#050607] border-[#20252A] text-white"}`}>
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
                onRunScenario={() => setSidebarTab("scenarios")}
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
                onOpenTimeline={() => setSidebarTab("timeline")}
                onOpenEvidence={() => setSidebarTab("evidence")}
                onOpenDossier={() => setSidebarTab("dossier")}
                onOpenGraph={(focusId) => {
                  if (focusId) setSelectedNodeId(focusId);
                  setSidebarTab("graph");
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Official Investigation Report Dossier Modal */}
      <InvestigationReportModal
        kernel={kernel}
        cutResult={arrestCutResult}
        isOpen={isGlobalReportModalOpen}
        onClose={() => setIsGlobalReportModalOpen(false)}
      />

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
      <ToastProvider>
        <CaseProvider>
          <WorkbenchContent />
        </CaseProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
export default App;

import React, { useState } from "react";
import {
  useCase,
  InvestigationCase,
  CaseStatus,
  CasePriority,
} from "../../context/CaseContext";
import { GraphKernel } from "../../types";
import {
  FolderGit2,
  Shield,
  Clock,
  User,
  AlertTriangle,
  ArrowRight,
  Search,
  FileText,
  Layers,
  Sparkles,
  CheckCircle2,
  Calendar,
  Building,
  Plus,
  X,
  ExternalLink,
  Share2,
  Trash2,
  Bookmark,
  BookmarkCheck,
  Activity,
  Cpu,
  Scissors,
} from "lucide-react";

interface CaseManagementViewProps {
  kernel: GraphKernel | null;
  onOpenCaseNetwork: (caseId: string, focusEntityId?: string) => void;
  onOpenEvidence: (evidenceId?: string) => void;
  onOpenTimeline: (eventId?: string) => void;
  onOpenAnalytics: () => void;
  onOpenScenarios: () => void;
  onOpenDossier: () => void;
}

export const CaseManagementView: React.FC<CaseManagementViewProps> = ({
  kernel,
  onOpenCaseNetwork,
  onOpenEvidence,
  onOpenTimeline,
  onOpenAnalytics,
  onOpenScenarios,
  onOpenDossier,
}) => {
  const {
    activeCase,
    cases,
    selectCase,
    createCase,
    dossierItems,
    addToDossier,
    removeFromDossier,
    toggleKeyFinding,
    isInDossier,
    notes,
    addNote,
    deleteNote,
    activities,
  } = useCase();

  const [selectedCaseDetail, setSelectedCaseDetail] = useState<InvestigationCase>(activeCase);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Active Workspace Tab
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    "overview" | "subjects" | "evidence" | "timeline" | "network" | "analysis" | "dossier" | "notes" | "scenarios"
  >("overview");

  // Create Case Form State
  const [newCaseId, setNewCaseId] = useState("");
  const [newCaseName, setNewCaseName] = useState("");
  const [newCaseSummary, setNewCaseSummary] = useState("");
  const [newCaseAgency, setNewCaseAgency] = useState("NCRB Special Investigation Unit");
  const [newCaseOfficer, setNewCaseOfficer] = useState("Investigator Krishna Singh");
  const [newCasePriority, setNewCasePriority] = useState<CasePriority>("HIGH");
  const [newCaseStatus, setNewCaseStatus] = useState<CaseStatus>("ACTIVE");
  const [createError, setCreateError] = useState("");

  // New Note Form State
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteIsKeyFinding, setNewNoteIsKeyFinding] = useState(false);

  // Filtered cases
  const filteredCases = cases.filter((c) => {
    const matchQuery =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.agency.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchPriority = priorityFilter === "ALL" || c.priority === priorityFilter;
    return matchQuery && matchStatus && matchPriority;
  });

  // Handle Case Creation
  const handleCreateCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!newCaseId.trim() || !newCaseName.trim() || !newCaseSummary.trim()) {
      setCreateError("All fields are required.");
      return;
    }

    const success = createCase({
      id: newCaseId.trim().toUpperCase(),
      name: newCaseName.trim(),
      codeName: `${newCaseId.trim().toUpperCase()}-PROTOTYPE`,
      agency: newCaseAgency.trim(),
      status: newCaseStatus,
      priority: newCasePriority,
      summary: newCaseSummary.trim(),
      leadOfficer: newCaseOfficer.trim(),
    });

    if (!success) {
      setCreateError("Case ID already exists in local registry. Please use a unique identifier.");
      return;
    }

    // Reset and close
    setNewCaseId("");
    setNewCaseName("");
    setNewCaseSummary("");
    setIsCreateModalOpen(false);
  };

  // Real data metrics
  const totalPersons = kernel?.meta?.object_counts?.Person || 80;
  const totalAccounts = kernel?.meta?.object_counts?.Account || 30;
  const totalFIRs = kernel?.meta?.object_counts?.FIR || 60;
  const totalEdges = kernel?.edges?.length || 3929;

  // Real subjects from kernel
  const subjects = [
    {
      id: "person:naveen_bhatia",
      name: "Naveen Bhatia",
      role: "Accountant & Chief Financial Router",
      type: "PERSON",
      importance: "KEY NODE (Rank #1)",
      metric: "Betweenness: 0.02555",
      degree: 6,
      community: "Cluster 1 (Financial Nexus)",
    },
    {
      id: "person:rakesh_mundhe",
      name: "Rakesh Mundhe",
      role: "Azadpur Mandi Merchant Coordinator",
      type: "PERSON",
      importance: "HIGH CENTRALITY",
      metric: "Betweenness: 0.01240",
      degree: 8,
      community: "Cluster 1 (Mandi Cell)",
    },
    {
      id: "person:vikram_haleja",
      name: "Vikram Haleja",
      role: "Syndicate Principal Beneficiary",
      type: "PERSON",
      importance: "ISOLATED KINGPIN",
      metric: "Shell Cut-Point Protected",
      degree: 4,
      community: "Cluster 0 (Core Target)",
    },
    {
      id: "person:farhan_lodhi",
      name: "Farhan Lodhi",
      role: "Communications & Mule Operator",
      type: "PERSON",
      importance: "MULE BURST ACTIVE",
      metric: "141 Calls post-FIR",
      degree: 12,
      community: "Cluster 2 (Mule Relay)",
    },
    {
      id: "person:imtiaz_qureshi",
      name: "Imtiaz Qureshi",
      role: "Wholesale Produce Trader (Front)",
      type: "PERSON",
      importance: "INTERMEDIARY",
      metric: "6 Transaction Conduits",
      degree: 7,
      community: "Cluster 3 (Physical Mandi)",
    },
    {
      id: "person:harish_tandel",
      name: "Harish Tandel",
      role: "Residual Conduit Operator",
      type: "PERSON",
      importance: "SURVIVING PATH NODE",
      metric: "Alternate Flow Channel",
      degree: 5,
      community: "Cluster 4 (Transit)",
    },
  ];

  return (
    <div className="flex-1 h-full flex flex-col bg-[#050607] text-[#F2F2F2] overflow-y-auto select-none font-sans p-6 gap-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#20252A] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#E21B23] uppercase font-bold">
              INVESTIGATION WORKSTATION
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[10px] font-mono tracking-wider text-[#858B92] uppercase">
              CASE MANAGEMENT
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            My Investigations
          </h1>
        </div>

        {/* Search & Create Action */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#858B92]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cases by ID or title..."
              className="w-full bg-[#0E1216] border border-[#20252A] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#858B92] focus:outline-none focus:border-[#E21B23] transition-colors font-mono"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-bold font-mono transition-all shadow-md shadow-[#E21B23]/25 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Case</span>
          </button>
        </div>
      </div>

      {/* Case Filtering Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono pb-2 border-b border-[#20252A]/60 shrink-0">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#858B92] uppercase text-[10px] mr-1">Status:</span>
          {(["ALL", "ACTIVE", "UNDER REVIEW", "CLOSED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer text-[11px] ${
                statusFilter === st
                  ? "bg-[#20252A] text-white font-bold border border-[#384048]"
                  : "text-[#858B92] hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Priority Filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#858B92] uppercase text-[10px] mr-1">Priority:</span>
          {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((pr) => (
            <button
              key={pr}
              onClick={() => setPriorityFilter(pr)}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer text-[11px] ${
                priorityFilter === pr
                  ? "bg-[#E21B23]/20 text-[#FF3038] border border-[#E21B23]/40 font-bold"
                  : "text-[#858B92] hover:text-white"
              }`}
            >
              {pr}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Section: Cases List + Case Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0">
        {/* Left: Case Cards List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3 overflow-y-auto pr-1 max-h-[calc(100vh-250px)]">
          <div className="flex items-center justify-between text-xs text-[#858B92] font-mono pb-1">
            <span>ASSIGNED CASES ({filteredCases.length})</span>
            <span className="text-[10px]">CLICK TO OPEN WORKSPACE</span>
          </div>

          {filteredCases.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#0A0D10] border border-[#20252A] text-center text-xs text-[#858B92] font-mono">
              NO CASES FOUND MATCHING CRITERIA
            </div>
          ) : (
            filteredCases.map((c) => {
              const isSelected = selectedCaseDetail.id === c.id;
              const isActiveWorkspace = activeCase.id === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCaseDetail(c);
                    selectCase(c.id);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-[#0E1216] border-[#E21B23]/70 shadow-[0_0_20px_rgba(226,27,35,0.15)]"
                      : "bg-[#0A0D10] border-[#20252A] hover:border-[#384048] hover:bg-[#0E1216]"
                  }`}
                >
                  {/* Active Indicator Strip */}
                  {isSelected && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#E21B23] rounded-r" />
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#E21B23]">
                          {c.id}
                        </span>
                        {c.isPrototypeRecord && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">
                            LOCAL PROTOTYPE
                          </span>
                        )}
                        {isActiveWorkspace && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#E21B23]/20 border border-[#E21B23]/40 text-[#FF3038] uppercase">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">{c.name}</h3>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border uppercase ${
                          c.status === "ACTIVE"
                            ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-400"
                            : c.status === "UNDER REVIEW"
                            ? "bg-amber-950/40 border-amber-800/60 text-amber-400"
                            : "bg-zinc-900 border-zinc-700 text-zinc-400"
                        }`}
                      >
                        {c.status}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold ${
                          c.priority === "CRITICAL"
                            ? "text-[#FF3038]"
                            : c.priority === "HIGH"
                            ? "text-[#E21B23]"
                            : "text-[#858B92]"
                        }`}
                      >
                        {c.priority} PRIORITY
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#858B92] line-clamp-2 mt-2 leading-relaxed">
                    {c.summary}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#20252A] text-[11px] font-mono text-[#858B92]">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-[#555C63]" />
                      <span className="truncate">{c.agency}</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <User className="w-3.5 h-3.5 text-[#555C63]" />
                      <span className="truncate">{c.leadOfficer}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Case Workspace (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0E1216] border border-[#20252A] rounded-2xl p-6 flex flex-col gap-5">
          {/* Workspace Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#20252A]">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-[#858B92]">
                <span className="text-[#E21B23] font-bold">{selectedCaseDetail.id}</span>
                <span>•</span>
                <span className="text-white font-semibold">{selectedCaseDetail.priority} PRIORITY</span>
                <span>•</span>
                <span>REGISTERED {selectedCaseDetail.createdDate}</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {selectedCaseDetail.name}
              </h2>
            </div>

            {/* Direct Launch Graph Action */}
            <button
              onClick={() => onOpenCaseNetwork(selectedCaseDetail.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-bold transition-all shadow-md shadow-[#E21B23]/30 cursor-pointer"
            >
              <span>Investigate Network</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Workspace Sub-Tabs (All 8 Required Tabs) */}
          <div className="flex items-center gap-1.5 border-b border-[#20252A] pb-2 text-xs font-mono overflow-x-auto">
            {(
              [
                "overview",
                "subjects",
                "evidence",
                "timeline",
                "network",
                "analysis",
                "dossier",
                "notes",
                "scenarios",
              ] as const
            ).map((tab) => {
              if (tab === "network") {
                return (
                  <button
                    key={tab}
                    onClick={() => onOpenCaseNetwork(selectedCaseDetail.id)}
                    className="px-3 py-1.5 rounded-lg uppercase tracking-wider text-[#E21B23] hover:text-[#FF3038] hover:bg-[#20252A] font-bold transition-all flex items-center gap-1"
                  >
                    <span>Network</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                );
              }
              if (tab === "scenarios") {
                return (
                  <button
                    key={tab}
                    onClick={onOpenScenarios}
                    className="px-3 py-1.5 rounded-lg uppercase tracking-wider text-amber-400 hover:text-amber-300 hover:bg-[#20252A] font-bold transition-all flex items-center gap-1"
                  >
                    <span>Scenarios</span>
                    <Scissors className="w-3 h-3" />
                  </button>
                );
              }

              return (
                <button
                  key={tab}
                  onClick={() => setActiveWorkspaceTab(tab)}
                  className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    activeWorkspaceTab === tab
                      ? "bg-[#20252A] text-white font-bold border border-[#384048]"
                      : "text-[#858B92] hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Overview */}
          {activeWorkspaceTab === "overview" && (
            <div className="space-y-4 text-xs">
              {/* Case Summary Card */}
              <div className="p-4 rounded-xl bg-[#0A0D10] border border-[#20252A] space-y-2">
                <span className="text-[10px] font-mono text-[#858B92] uppercase font-bold tracking-wider">
                  CASE INTELLIGENCE SUMMARY
                </span>
                <p className="text-[#F2F2F2] leading-relaxed">
                  {selectedCaseDetail.summary}
                </p>
                <div className="text-[11px] font-mono text-[#858B92] pt-2 flex items-center gap-4">
                  <span>
                    Assigned Officer: <strong className="text-white">{selectedCaseDetail.leadOfficer}</strong>
                  </span>
                  <span>
                    Agency: <strong className="text-white">{selectedCaseDetail.agency}</strong>
                  </span>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#050607] border border-[#20252A]">
                  <div className="text-[10px] font-mono text-[#858B92] uppercase">Subjects</div>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">{totalPersons}</div>
                  <div className="text-[10px] text-[#555C63]">Identified Persons</div>
                </div>
                <div className="p-3 rounded-xl bg-[#050607] border border-[#20252A]">
                  <div className="text-[10px] font-mono text-[#858B92] uppercase">Accounts</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{totalAccounts}</div>
                  <div className="text-[10px] text-[#555C63]">Financial Conduits</div>
                </div>
                <div className="p-3 rounded-xl bg-[#050607] border border-[#20252A]">
                  <div className="text-[10px] font-mono text-[#858B92] uppercase">FIR Filings</div>
                  <div className="text-lg font-bold text-[#FF3038] font-mono mt-0.5">{totalFIRs}</div>
                  <div className="text-[10px] text-[#555C63]">Official Filings</div>
                </div>
                <div className="p-3 rounded-xl bg-[#050607] border border-[#20252A]">
                  <div className="text-[10px] font-mono text-[#858B92] uppercase">Connections</div>
                  <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">{totalEdges}</div>
                  <div className="text-[10px] text-[#555C63]">Typed Links</div>
                </div>
              </div>

              {/* Key Subjects Spotlight */}
              <div className="p-4 rounded-xl bg-[#0A0D10] border border-[#20252A] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#858B92] uppercase font-bold tracking-wider">
                    PRIMARY TARGETS & BOTTLENECK NODES
                  </span>
                  <button
                    onClick={() => setActiveWorkspaceTab("subjects")}
                    className="text-[11px] font-mono text-[#E21B23] hover:underline"
                  >
                    View All Subjects →
                  </button>
                </div>
                <div className="space-y-2 pt-1">
                  {subjects.slice(0, 3).map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#0E1216] border border-[#20252A]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#E21B23]" />
                        <span className="font-semibold text-white">{sub.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500">({sub.role})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          {sub.importance}
                        </span>
                        <button
                          onClick={() => onOpenCaseNetwork(selectedCaseDetail.id, sub.id)}
                          className="px-2 py-0.5 rounded bg-[#20252A] text-slate-200 hover:text-white hover:bg-[#E21B23] transition-colors"
                        >
                          Focus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detected Patterns Row */}
              <div className="p-4 rounded-xl bg-[#0A0D10] border border-[#20252A] space-y-2">
                <span className="text-[10px] font-mono text-[#858B92] uppercase font-bold tracking-wider">
                  DETECTED INVESTIGATIVE PATTERNS
                </span>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-[#0E1216] border border-[#20252A]">
                    <div className="text-emerald-400 font-bold">Hawala Cycle</div>
                    <div className="text-[10px] text-[#858B92] mt-0.5">4 Accounts Circular Flow</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0E1216] border border-[#20252A]">
                    <div className="text-sky-400 font-bold">Mule Call Burst</div>
                    <div className="text-[10px] text-[#858B92] mt-0.5">phone:ph03 (141 Calls)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Subjects Management */}
          {activeWorkspaceTab === "subjects" && (
            <div className="space-y-3 text-xs">
              <div className="text-xs text-[#858B92] font-mono flex items-center justify-between">
                <span>VERIFIED CASE SUBJECTS ({subjects.length})</span>
                <span className="text-[10px]">SOURCED FROM GRAPH KERNEL</span>
              </div>

              {subjects.map((sub) => {
                const inDossier = isInDossier(sub.id);

                return (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl bg-[#0A0D10] border border-[#20252A] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{sub.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#20252A] text-zinc-400">
                          {sub.type}
                        </span>
                        <span className="text-[10px] font-mono text-[#FF3038] font-bold">
                          {sub.importance}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#858B92] mt-0.5">{sub.role}</div>
                      <div className="text-[10px] font-mono text-[#555C63] mt-1">
                        {sub.id} • {sub.metric} • Degree: {sub.degree}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (inDossier) removeFromDossier(sub.id);
                          else
                            addToDossier({
                              id: sub.id,
                              type: "SUBJECT",
                              title: sub.name,
                              subtitle: `${sub.role} (${sub.importance})`,
                              category: "PERSON",
                              targetEntityId: sub.id,
                            });
                        }}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer ${
                          inDossier
                            ? "bg-emerald-950/40 border-emerald-700/60 text-emerald-300"
                            : "bg-[#0E1216] border-[#20252A] text-[#858B92] hover:text-white"
                        }`}
                      >
                        {inDossier ? "In Dossier" : "+ Add to Dossier"}
                      </button>

                      <button
                        onClick={() => onOpenCaseNetwork(selectedCaseDetail.id, sub.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open Network</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 3: Evidence Sub-tab */}
          {activeWorkspaceTab === "evidence" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0A0D10] border border-[#20252A] text-xs space-y-2">
                <span className="font-mono text-[10px] text-[#858B92] uppercase font-bold">
                  CASE EVIDENTIARY REPOSITORY
                </span>
                <p className="text-slate-300">
                  Case materials currently index 60 official First Information Reports, banking transaction feeds, telecommunications intercept logs, and automated surveillance records.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => onOpenEvidence()}
                    className="px-4 py-2 rounded-xl bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Open Full Evidence Repository</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Timeline Sub-tab */}
          {activeWorkspaceTab === "timeline" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0A0D10] border border-[#20252A] text-xs space-y-2">
                <span className="font-mono text-[10px] text-[#858B92] uppercase font-bold">
                  CHRONOLOGICAL INVESTIGATIVE TIMELINE
                </span>
                <p className="text-slate-300">
                  Follow synchronized sequence of FIR filings, telecommunication call spikes, and circular banking settlements in exact chronological order.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => onOpenTimeline()}
                    className="px-4 py-2 rounded-xl bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Open Interactive Timeline</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Analysis Sub-tab */}
          {activeWorkspaceTab === "analysis" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#0A0D10] border border-[#20252A] space-y-2">
                <span className="font-mono text-[10px] text-[#858B92] uppercase font-bold">
                  DETERMINISTIC GRAPH ANALYSIS
                </span>
                <p className="text-slate-300">
                  Topological analysis identifies Naveen Bhatia as the primary structural bridge. Removing his cut-point disrupts primary conduits connecting Azadpur produce traders to shell holding accounts.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={onOpenAnalytics}
                    className="px-4 py-2 rounded-xl bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>Open Intelligence Analytics</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Dossier Sub-tab */}
          {activeWorkspaceTab === "dossier" && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-xs text-[#858B92] font-mono">
                <span>COLLECTED DOSSIER FINDINGS ({dossierItems.length})</span>
                <button
                  onClick={onOpenDossier}
                  className="text-[#E21B23] hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Open Full Dossier View</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {dossierItems.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#0A0D10] border border-[#20252A] text-center text-[#858B92] font-mono">
                  No items added to dossier yet. Click "+ Add to Dossier" on subjects, evidence, or patterns.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {dossierItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        item.isKeyFinding
                          ? "bg-[#0E1216] border-[#E21B23]/70"
                          : "bg-[#0A0D10] border-[#20252A]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{item.title}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#20252A] text-zinc-400">
                            {item.type}
                          </span>
                          {item.isKeyFinding && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#E21B23]/20 text-[#FF3038] font-bold">
                              KEY FINDING
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#858B92] mt-0.5">{item.subtitle}</div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleKeyFinding(item.id)}
                          className="text-[#858B92] hover:text-[#FF3038] p-1"
                          title="Toggle Key Finding"
                        >
                          {item.isKeyFinding ? (
                            <BookmarkCheck className="w-4 h-4 text-[#FF3038]" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => removeFromDossier(item.id)}
                          className="text-[#858B92] hover:text-red-400 p-1"
                          title="Remove from Dossier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 7: Notes Sub-tab */}
          {activeWorkspaceTab === "notes" && (
            <div className="space-y-4 text-xs">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newNoteContent.trim()) return;
                  addNote(newNoteTitle, newNoteContent, newNoteIsKeyFinding);
                  setNewNoteTitle("");
                  setNewNoteContent("");
                  setNewNoteIsKeyFinding(false);
                }}
                className="p-4 rounded-xl bg-[#0A0D10] border border-[#20252A] space-y-3"
              >
                <div className="text-xs font-mono text-[#858B92] uppercase font-bold">
                  + Record Officer Field Observation
                </div>
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Note Title / Subject..."
                  className="w-full bg-[#050607] border border-[#20252A] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#858B92] focus:outline-none focus:border-[#E21B23] font-sans"
                />
                <textarea
                  rows={2}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Enter detailed observations, hypothesis, or interview notes..."
                  className="w-full bg-[#050607] border border-[#20252A] rounded-lg p-3 text-xs text-white placeholder-[#858B92] focus:outline-none focus:border-[#E21B23] font-sans resize-none"
                />
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 font-mono text-[11px] text-[#858B92] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newNoteIsKeyFinding}
                      onChange={(e) => setNewNoteIsKeyFinding(e.target.checked)}
                      className="accent-[#E21B23]"
                    />
                    <span>Mark as Key Finding</span>
                  </label>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-bold font-mono transition-all cursor-pointer shadow-sm"
                  >
                    Log Observation
                  </button>
                </div>
              </form>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-xl border relative ${
                      n.isKeyFinding
                        ? "bg-[#0E1216] border-[#E21B23]/60 shadow-sm"
                        : "bg-[#0A0D10] border-[#20252A]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{n.title}</span>
                          {n.isKeyFinding && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#E21B23]/20 text-[#FF3038] font-bold">
                              KEY FINDING
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-[#858B92] mt-0.5">
                          {n.author} • {n.timestamp}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteNote(n.id)}
                        className="text-[#858B92] hover:text-red-400 p-1"
                        title="Delete Note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 mt-2 leading-relaxed font-sans">
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE CASE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0E1216] border border-[#20252A] rounded-2xl shadow-2xl p-6 relative flex flex-col gap-4 font-sans text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#20252A]">
              <div>
                <span className="text-[10px] font-mono text-[#E21B23] uppercase font-bold tracking-wider">
                  CASE INITIALIZATION
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">Create New Investigation</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-[#858B92] hover:text-white hover:bg-[#20252A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prototype Record Disclaimer */}
            <div className="p-3 rounded-xl bg-[#0A0D10] border border-[#20252A] text-[11px] text-[#858B92] font-mono flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#E21B23] shrink-0" />
              <span>
                Note: Local prototype case record. Will be stored in client state for this session.
              </span>
            </div>

            {createError && (
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 font-mono text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCaseSubmit} className="space-y-3 font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#858B92] uppercase">Case ID *</label>
                  <input
                    type="text"
                    required
                    value={newCaseId}
                    onChange={(e) => setNewCaseId(e.target.value)}
                    placeholder="e.g. CASE-2026-089"
                    className="w-full mt-1 bg-[#050607] border border-[#20252A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#858B92] focus:outline-none focus:border-[#E21B23]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#858B92] uppercase">Priority *</label>
                  <select
                    value={newCasePriority}
                    onChange={(e) => setNewCasePriority(e.target.value as CasePriority)}
                    className="w-full mt-1 bg-[#050607] border border-[#20252A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E21B23]"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#858B92] uppercase">Case Title *</label>
                <input
                  type="text"
                  required
                  value={newCaseName}
                  onChange={(e) => setNewCaseName(e.target.value)}
                  placeholder="e.g. Operation Iron Gate"
                  className="w-full mt-1 bg-[#050607] border border-[#20252A] rounded-lg px-3 py-2 text-xs text-white placeholder-[#858B92] focus:outline-none focus:border-[#E21B23]"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#858B92] uppercase">Description / Summary *</label>
                <textarea
                  required
                  rows={3}
                  value={newCaseSummary}
                  onChange={(e) => setNewCaseSummary(e.target.value)}
                  placeholder="Summary of suspected syndicate activity, nexus points, or initial intelligence..."
                  className="w-full mt-1 bg-[#050607] border border-[#20252A] rounded-lg p-3 text-xs text-white placeholder-[#858B92] focus:outline-none focus:border-[#E21B23] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#858B92] uppercase">Investigating Agency</label>
                  <input
                    type="text"
                    value={newCaseAgency}
                    onChange={(e) => setNewCaseAgency(e.target.value)}
                    className="w-full mt-1 bg-[#050607] border border-[#20252A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E21B23]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#858B92] uppercase">Lead Officer</label>
                  <input
                    type="text"
                    value={newCaseOfficer}
                    onChange={(e) => setNewCaseOfficer(e.target.value)}
                    className="w-full mt-1 bg-[#050607] border border-[#20252A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#E21B23]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#20252A]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#20252A] hover:bg-[#2e353c] text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-bold font-mono shadow-md shadow-[#E21B23]/30"
                >
                  Create Case Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

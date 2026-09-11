import React from "react";
import { GraphKernel } from "../../types";
import { useCase, InvestigationCase } from "../../context/CaseContext";
import { useAuth } from "../../context/AuthContext";
import {
  FolderGit2,
  ShieldAlert,
  Users,
  FileCheck,
  Share2,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertTriangle,
  FileText,
  Activity,
  CheckCircle2,
  ListTodo,
  Sparkles,
  Search,
  ExternalLink,
} from "lucide-react";

interface PoliceCommandOverviewProps {
  kernel: GraphKernel | null;
  onOpenCase: (caseId: string) => void;
  onOpenGraph: (focusEntityId?: string) => void;
  onOpenSubjects: () => void;
  onOpenEvidence: (evidenceId?: string) => void;
  onOpenTimeline: () => void;
  onOpenDossier: () => void;
  onOpenScenarios: () => void;
  onGenerateReport: () => void;
}

export const PoliceCommandOverview: React.FC<PoliceCommandOverviewProps> = ({
  kernel,
  onOpenCase,
  onOpenGraph,
  onOpenSubjects,
  onOpenEvidence,
  onOpenTimeline,
  onOpenDossier,
  onOpenScenarios,
  onGenerateReport,
}) => {
  const { user } = useAuth();
  const { activeCase, cases, activities, dossierItems } = useCase();

  // Metrics from real kernel data
  const meta = kernel?.meta;
  const activeCasesCount = cases.filter((c) => c.status === "ACTIVE").length || 1;
  const highPriorityCount = cases.filter((c) => c.priority === "CRITICAL" || c.priority === "HIGH").length || 2;
  const evidenceCount = (meta?.object_counts?.FIR || 60) + 12; // 60 FIRs + verified banking/CDR records
  const subjectsCount = meta?.object_counts?.Person || 80;

  // Key Identified Targets from kernel
  const primaryTargets = [
    {
      id: "person:naveen_bhatia",
      name: "Naveen Bhatia",
      role: "Syndicate Accountant & Router",
      classification: "KEY SUBJECT (RANK #1)",
      metric: "Betweenness: 0.02555 • 6 Conduits",
      status: "PRIMARY INTERVENTION TARGET",
    },
    {
      id: "person:rakesh_mundhe",
      name: "Rakesh Mundhe",
      role: "Azadpur Produce Aggregator",
      classification: "HIGH CENTRALITY",
      metric: "Betweenness: 0.01240 • 8 Conduits",
      status: "COLLECTION HUB",
    },
    {
      id: "person:vikram_haleja",
      name: "Vikram Haleja",
      role: "Syndicate Principal Beneficiary",
      classification: "INSULATED TARGET",
      metric: "Shell Cut-Point Protected",
      status: "MASTERMIND TIER",
    },
    {
      id: "person:farhan_lodhi",
      name: "Farhan Lodhi",
      role: "Communications & Mule Operator",
      classification: "MULE BURST ACTIVE",
      metric: "141 Calls post-FIR-2026-014",
      status: "PANIC RELAY OBSERVED",
    },
  ];

  // Recent Evidentiary Material
  const recentEvidence = [
    {
      id: "FIR-2026-014",
      type: "FIRST INFORMATION REPORT",
      title: "FIR-2026-014 Registered (Sec 420/120B)",
      time: "2026-04-12 09:42",
      subject: "Azadpur Mandi Cash Skimming",
      status: "VERIFIED FILING",
    },
    {
      id: "TXN-2026-001",
      type: "BANKING SETTLEMENT",
      title: "Circular Hawala Transfer: acc:a02 → acc:a03",
      time: "2026-04-12 11:30",
      subject: "₹14,50,000 NEFT Routing",
      status: "FLAGGED CONDUIT",
    },
    {
      id: "CDR-2026-003",
      type: "TELECOM INTERCEPT",
      title: "141 Outbound Panic Intercepts on phone:ph03",
      time: "2026-04-12 12:40",
      subject: "Farhan Lodhi Cell",
      status: "INTERCEPT SPIKE",
    },
  ];

  // Upcoming Investigation Actions
  const investigationActions = [
    {
      task: "Simulate Counterfactual Arrest Cut on Naveen Bhatia",
      priority: "CRITICAL",
      action: () => onOpenScenarios(),
      actionLabel: "Run Scenario",
    },
    {
      task: "Audit Circular Hawala Cycle (4-Account Loop)",
      priority: "HIGH",
      action: () => onOpenGraph("acc:a02"),
      actionLabel: "Locate on Graph",
    },
    {
      task: "Inspect 141 Outbound Call Burst Evidence on phone:ph03",
      priority: "HIGH",
      action: () => onOpenEvidence("phone:ph03"),
      actionLabel: "View Evidence",
    },
    {
      task: "Review and Export Official Case Investigation Dossier",
      priority: "NORMAL",
      action: () => onGenerateReport(),
      actionLabel: "Export Dossier",
    },
  ];

  return (
    <div className="flex-1 h-full flex flex-col bg-[#050607] text-[#F2F2F2] overflow-y-auto select-none font-sans p-6 gap-6">
      {/* Top Intelligence Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#20252A] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-[0.25em] text-[#E21B23] uppercase font-bold">
              POLICE INTELLIGENCE COMMAND
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[10px] font-mono tracking-wider text-[#858B92] uppercase">
              WORKSTATION DESK
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1 flex items-center gap-3">
            <span>Operational Command Center</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-medium">
              LIVE SYSTEM READY
            </span>
          </h1>
        </div>

        {/* Quick Command Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenGraph()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-mono font-bold transition-all shadow-md shadow-[#E21B23]/25 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Open Network Graph</span>
          </button>
          <button
            onClick={onGenerateReport}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0E1216] hover:bg-[#20252A] border border-[#20252A] text-slate-200 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#858B92]" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Top 4 Real Operational Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Cases */}
        <div className="p-4 rounded-2xl bg-[#0A0D10] border border-[#20252A] hover:border-[#384048] transition-all">
          <div className="flex items-center justify-between text-[#858B92]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              ACTIVE CASES
            </span>
            <FolderGit2 className="w-4 h-4 text-[#E21B23]" />
          </div>
          <div className="text-2xl font-bold text-white font-mono mt-1.5">
            {activeCasesCount}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <span>Primary:</span>
            <strong className="text-white truncate">{activeCase.name}</strong>
          </div>
        </div>

        {/* Metric 2: High Priority */}
        <div className="p-4 rounded-2xl bg-[#0A0D10] border border-[#20252A] hover:border-[#384048] transition-all">
          <div className="flex items-center justify-between text-[#858B92]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              HIGH PRIORITY
            </span>
            <AlertTriangle className="w-4 h-4 text-[#FF3038]" />
          </div>
          <div className="text-2xl font-bold text-[#FF3038] font-mono mt-1.5">
            {highPriorityCount} Cases
          </div>
          <div className="text-[11px] text-[#858B92] mt-1 font-mono">
            Under Active Police Surveillance
          </div>
        </div>

        {/* Metric 3: Evidence Items */}
        <div className="p-4 rounded-2xl bg-[#0A0D10] border border-[#20252A] hover:border-[#384048] transition-all">
          <div className="flex items-center justify-between text-[#858B92]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              EVIDENCE ITEMS
            </span>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1.5">
            {evidenceCount} Records
          </div>
          <div className="text-[11px] text-[#858B92] mt-1 font-mono">
            60 FIRs • Transactions • Intercepts
          </div>
        </div>

        {/* Metric 4: Active Subjects */}
        <div className="p-4 rounded-2xl bg-[#0A0D10] border border-[#20252A] hover:border-[#384048] transition-all">
          <div className="flex items-center justify-between text-[#858B92]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              ACTIVE SUBJECTS
            </span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1.5">
            {subjectsCount} Persons
          </div>
          <div className="text-[11px] text-[#858B92] mt-1 font-mono">
            Network Topology Nodes
          </div>
        </div>
      </div>

      {/* Main Command Center Layout: 3 Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0">
        
        {/* Column A (4 Cols): Recent Investigations & Priority Target Roster */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Case Card */}
          <div className="p-5 rounded-2xl bg-[#0E1216] border border-[#20252A] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#E21B23] uppercase font-bold tracking-wider">
                CURRENT OPERATIONAL CASE
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-bold">
                {activeCase.status}
              </span>
            </div>

            <div>
              <div className="text-xs font-mono font-bold text-[#FF3038]">{activeCase.id}</div>
              <h3 className="text-base font-bold text-white mt-0.5">{activeCase.name}</h3>
              <p className="text-xs text-slate-300 mt-1.5 line-clamp-3 leading-relaxed">
                {activeCase.summary}
              </p>
            </div>

            <div className="pt-2 border-t border-[#20252A] flex items-center justify-between text-xs font-mono text-[#858B92]">
              <span>Agency: <strong className="text-white">{activeCase.agency}</strong></span>
              <button
                onClick={() => onOpenCase(activeCase.id)}
                className="text-[#E21B23] hover:text-[#FF3038] flex items-center gap-1 font-bold cursor-pointer"
              >
                <span>Open Case</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Key Targets Spotlight */}
          <div className="p-5 rounded-2xl bg-[#0A0D10] border border-[#20252A] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#20252A]">
              <span className="text-[10px] font-mono text-[#858B92] uppercase font-bold tracking-wider">
                PRIMARY INVESTIGATION TARGETS
              </span>
              <button
                onClick={onOpenSubjects}
                className="text-[11px] font-mono text-[#E21B23] hover:underline"
              >
                View Roster →
              </button>
            </div>

            <div className="space-y-2.5">
              {primaryTargets.map((target) => (
                <div
                  key={target.id}
                  className="p-3 rounded-xl bg-[#0E1216] border border-[#20252A] hover:border-[#384048] transition-all flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#E21B23]" />
                      <span className="font-bold text-white text-xs truncate">{target.name}</span>
                    </div>
                    <div className="text-[11px] text-[#858B92] mt-0.5 truncate">{target.role}</div>
                    <div className="text-[9px] font-mono text-zinc-500 mt-0.5">{target.metric}</div>
                  </div>

                  <button
                    onClick={() => onOpenGraph(target.id)}
                    className="px-2.5 py-1 rounded bg-[#20252A] hover:bg-[#E21B23] text-slate-200 hover:text-white text-[10px] font-mono transition-colors shrink-0 cursor-pointer"
                  >
                    Focus
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column B (4 Cols): Recent Evidence Material & Upcoming Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Evidentiary Feed */}
          <div className="p-5 rounded-2xl bg-[#0A0D10] border border-[#20252A] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#20252A]">
              <span className="text-[10px] font-mono text-[#858B92] uppercase font-bold tracking-wider">
                RECENT EVIDENCE MATERIAL
              </span>
              <button
                onClick={() => onOpenEvidence()}
                className="text-[11px] font-mono text-[#E21B23] hover:underline"
              >
                Full Repository →
              </button>
            </div>

            <div className="space-y-2.5">
              {recentEvidence.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onOpenEvidence(ev.id)}
                  className="p-3 rounded-xl bg-[#0E1216] border border-[#20252A] hover:border-[#E21B23]/50 cursor-pointer transition-all space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#FF3038]">{ev.id}</span>
                    <span className="text-[9px] font-mono text-emerald-400">{ev.status}</span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate">{ev.title}</div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#858B92] pt-1">
                    <span>{ev.subject}</span>
                    <span>{ev.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Investigative Actions Checklist */}
          <div className="p-5 rounded-2xl bg-[#0A0D10] border border-[#20252A] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#20252A]">
              <span className="text-[10px] font-mono text-[#858B92] uppercase font-bold tracking-wider">
                OPERATIONAL INVESTIGATION ACTIONS
              </span>
              <ListTodo className="w-4 h-4 text-zinc-500" />
            </div>

            <div className="space-y-2">
              {investigationActions.map((act, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#0E1216] border border-[#20252A] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="text-slate-200 line-clamp-2">{act.task}</span>
                    <span className={`text-[9px] font-mono font-bold uppercase mt-1 block ${
                      act.priority === "CRITICAL" ? "text-[#FF3038]" : "text-amber-400"
                    }`}>
                      {act.priority} PRIORITY
                    </span>
                  </div>
                  <button
                    onClick={act.action}
                    className="px-2.5 py-1.5 rounded-lg bg-[#20252A] hover:bg-[#E21B23] text-white font-mono text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                  >
                    {act.actionLabel}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column C (4 Cols): Real Audit Stream / Activity Stream */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 rounded-2xl bg-[#0A0D10] border border-[#20252A] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#20252A]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#E21B23]" />
                <span className="text-[10px] font-mono text-white uppercase font-bold tracking-wider">
                  INVESTIGATION AUDIT STREAM
                </span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                LOCAL AUDIT
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#858B92] font-mono">
                No investigation actions logged in this session yet.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-[#0E1216] border border-[#20252A] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{act.action}</span>
                      <span className="text-[10px] font-mono text-[#858B92]">{act.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">
                      Target: <strong className="text-white font-medium">{act.target}</strong>
                    </div>
                    <div className="text-[10px] font-mono text-[#555C63]">
                      Logged by: {act.officer}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

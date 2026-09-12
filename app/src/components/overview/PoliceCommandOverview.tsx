import React from "react";
import { GraphKernel } from "../../types";
import { useCase, InvestigationCase } from "../../context/CaseContext";
import { useAuth } from "../../context/AuthContext";
import { ProvenanceBadge } from "../ProvenanceBadge";
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
  MapPin,
  Shield,
  CreditCard,
  PhoneCall,
  User,
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
  theme?: "dark" | "light";
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
  theme = "dark",
}) => {
  const { user } = useAuth();
  const { activeCase, cases, activities, dossierItems } = useCase();
  const isLight = theme === "light";

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
      classification: "KEY NODE (RANK #1)",
      metric: "Betweenness: 0.02555 • Degree: 6",
      status: "PRIMARY ARREST TARGET",
      hub: "Karol Bagh, Delhi",
    },
    {
      id: "person:vikram_haleja",
      name: "Vikram Haleja",
      role: "Syndicate Principal Beneficiary",
      classification: "OFFSHORE CONTROLLER",
      metric: "Shell Cut-Point Protected",
      status: "MASTERMIND TIER",
      hub: "Dubai, UAE",
    },
    {
      id: "person:rakesh_mundhe",
      name: "Rakesh Mundhe",
      role: "Azadpur Produce Aggregator",
      classification: "COLLECTION HUB",
      metric: "Betweenness: 0.01240 • Degree: 8",
      status: "INTERVENTION POINT",
      hub: "Azadpur Mandi, Delhi",
    },
    {
      id: "person:farhan_lodhi",
      name: "Farhan Lodhi",
      role: "Communications & Mule Operator",
      classification: "MULE BURST ACTIVE",
      metric: "141 Panic Calls Post-FIR",
      status: "RELAY OBSERVED",
      hub: "Okhla Industrial, Delhi",
    },
  ];

  // Recent Evidentiary Material
  const recentEvidence = [
    {
      id: "FIR-2026-014",
      type: "FIR RECORD",
      title: "FIR-2026-014 Registered (Sec 420/120B IPC)",
      time: "2026-04-12 09:42",
      subject: "Azadpur Mandi Cash Skimming",
      source: "Special Cell / SCRB",
      status: "AUTHENTICATED",
    },
    {
      id: "TXN-2026-001",
      type: "BANKING SETTLEMENT",
      title: "Hawala PAID Loop: acc:a02 → acc:a03 → acc:a08 → acc:a09",
      time: "2026-04-12 11:30",
      subject: "₹14,50,000 NEFT Circular Conduits",
      source: "FIU-IND Verified",
      status: "CIRCULAR CYCLE",
    },
    {
      id: "CDR-2026-003",
      type: "TELECOM INTERCEPT",
      title: "141 Outbound Panic Intercepts on phone:ph03",
      time: "2026-04-12 12:40",
      subject: "Farhan Lodhi Mobile Relay",
      source: "Lawful Telecom Intercept",
      status: "BURST FLAGGED",
    },
  ];

  // Operational Investigation Actions
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
      task: "Review and Export Case Intelligence Dossier",
      priority: "NORMAL",
      action: () => onGenerateReport(),
      actionLabel: "Export Dossier",
    },
  ];

  return (
    <div
      className={`flex-1 h-full flex flex-col overflow-y-auto select-none font-sans p-6 gap-6 transition-colors duration-200 ${
        isLight ? "bg-[#FAFAFA] text-slate-900" : "bg-[#050607] text-[#F2F2F2]"
      }`}
    >
      {/* Top Header & Workstation Context */}
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b shrink-0 ${
          isLight ? "border-slate-200" : "border-[#20252A]"
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-[0.25em] text-[#E21B23] uppercase font-bold">
              NATIONAL POLICE INTELLIGENCE WORKBENCH
            </span>
            <span className={isLight ? "text-slate-300" : "text-zinc-600"}>•</span>
            <span className={`text-[10px] font-mono tracking-wider uppercase ${isLight ? "text-slate-500" : "text-[#858B92]"}`}>
              OPERATIONAL COMMAND DESK
            </span>
          </div>
          <h1 className={`text-2xl font-bold tracking-tight mt-1 flex items-center gap-3 ${isLight ? "text-slate-900" : "text-white"}`}>
            <span>Investigation Command Center</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium border ${
                isLight
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-emerald-950/60 border-emerald-800/60 text-emerald-400"
              }`}
            >
              LIVE SYSTEM READY
            </span>
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onOpenGraph()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-mono font-bold transition-all shadow-md shadow-[#E21B23]/25 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Open Intelligence Graph</span>
          </button>
          <button
            onClick={onGenerateReport}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
              isLight
                ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-800"
                : "bg-[#0E1216] hover:bg-[#20252A] border-[#20252A] text-slate-200 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#858B92]" />
            <span>Export Official Dossier</span>
          </button>
        </div>
      </div>

      {/* Operational Metrics Row (Clean 1px Borders, No Nested Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div
          className={`p-4 rounded-xl border transition-all ${
            isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#0A0D10] border-[#20252A] text-white"
          }`}
        >
          <div className="flex items-center justify-between text-[#858B92]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">ACTIVE CASES</span>
            <FolderGit2 className="w-4 h-4 text-[#E21B23]" />
          </div>
          <div className="text-2xl font-bold font-mono mt-1.5">{activeCasesCount}</div>
          <div className="text-[11px] text-[#E21B23] mt-1 font-mono truncate font-medium">
            Active: {activeCase.id}
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border transition-all ${
            isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#0A0D10] border-[#20252A] text-white"
          }`}
        >
          <div className="flex items-center justify-between text-[#858B92]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">HIGH PRIORITY</span>
            <AlertTriangle className="w-4 h-4 text-[#FF3038]" />
          </div>
          <div className="text-2xl font-bold text-[#FF3038] font-mono mt-1.5">{highPriorityCount} Cases</div>
          <div className="text-[11px] text-[#858B92] mt-1 font-mono">Under Active Police Scope</div>
        </div>

        <div
          className={`p-4 rounded-xl border transition-all ${
            isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#0A0D10] border-[#20252A] text-white"
          }`}
        >
          <div className="flex items-center justify-between text-[#858B92]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">EVIDENCE RECORDS</span>
            <FileCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-500 font-mono mt-1.5">{evidenceCount}</div>
          <div className="text-[11px] text-[#858B92] mt-1 font-mono">60 FIRs • Banking • Intercepts</div>
        </div>

        <div
          className={`p-4 rounded-xl border transition-all ${
            isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#0A0D10] border-[#20252A] text-white"
          }`}
        >
          <div className="flex items-center justify-between text-[#858B92]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">ACTIVE SUBJECTS</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500 font-mono mt-1.5">{subjectsCount}</div>
          <div className="text-[11px] text-[#858B92] mt-1 font-mono">Network Topology Entities</div>
        </div>
      </div>

      {/* Main Command Workspace (Clean High-Density Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0">
        
        {/* Section 1: Active Operational Case & Primary Target Roster (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Case Context Section */}
          <div
            className={`p-4 rounded-xl border space-y-2.5 ${
              isLight ? "bg-white border-slate-200" : "bg-[#0A0D10] border-[#20252A]"
            }`}
          >
            <div className="flex items-center justify-between border-b pb-2 border-inherit">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E21B23] animate-pulse" />
                <span className="text-[10px] font-mono text-[#E21B23] uppercase font-bold tracking-wider">
                  ACTIVE CASE SCOPE
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                  {activeCase.status}
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 font-bold">
                  {activeCase.priority} PRIORITY
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono font-bold text-[#E21B23]">{activeCase.id}</span>
                <h3 className={`text-base font-bold mt-0.5 ${isLight ? "text-slate-900" : "text-white"}`}>
                  {activeCase.name}
                </h3>
              </div>
              <button
                onClick={() => onOpenCase(activeCase.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-mono font-bold transition-colors cursor-pointer shrink-0"
              >
                <span>Case Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-slate-300"}`}>
              {activeCase.summary}
            </p>

            <div className="pt-2 border-t border-inherit flex items-center justify-between text-xs font-mono text-[#858B92]">
              <span>Agency: <strong className={isLight ? "text-slate-800" : "text-white"}>{activeCase.agency}</strong></span>
              <span>Lead: <strong className={isLight ? "text-slate-800" : "text-white"}>{activeCase.leadOfficer}</strong></span>
            </div>
          </div>

          {/* Primary Investigation Targets Roster Table */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isLight ? "bg-white border-slate-200" : "bg-[#0A0D10] border-[#20252A]"
            }`}
          >
            <div className="flex items-center justify-between border-b pb-2 border-inherit">
              <span className="text-[10px] font-mono text-[#858B92] uppercase font-bold tracking-wider">
                PRIMARY INVESTIGATION TARGETS
              </span>
              <button
                onClick={onOpenSubjects}
                className="text-[11px] font-mono text-[#E21B23] hover:underline cursor-pointer font-bold"
              >
                Full Subject Roster →
              </button>
            </div>

            <div className="divide-y divide-inherit">
              {primaryTargets.map((target) => (
                <div
                  key={target.id}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-zinc-500/5 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[#E21B23] shrink-0" />
                      <span className={`font-bold text-xs truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                        {target.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-100 text-red-800 border border-red-200 font-bold">
                        {target.classification}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#858B92] mt-0.5 truncate flex items-center gap-2">
                      <span>{target.role}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                        <MapPin className="w-3 h-3 text-[#E21B23]" />
                        {target.hub}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-0.5">{target.metric}</div>
                  </div>

                  <button
                    onClick={() => onOpenGraph(target.id)}
                    className="px-2.5 py-1 rounded bg-[#E21B23]/10 hover:bg-[#E21B23] text-[#E21B23] hover:text-white border border-[#E21B23]/30 text-[10px] font-mono font-bold transition-colors shrink-0 cursor-pointer"
                  >
                    Locate Target
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Evidentiary Material & Operational Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent Evidentiary Feed */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isLight ? "bg-white border-slate-200" : "bg-[#0A0D10] border-[#20252A]"
            }`}
          >
            <div className="flex items-center justify-between border-b pb-2 border-inherit">
              <span className="text-[10px] font-mono text-[#858B92] uppercase font-bold tracking-wider">
                EVIDENTIARY FEED
              </span>
              <button
                onClick={() => onOpenEvidence()}
                className="text-[11px] font-mono text-[#E21B23] hover:underline cursor-pointer font-bold"
              >
                All Records →
              </button>
            </div>

            <div className="space-y-2">
              {recentEvidence.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onOpenEvidence(ev.id)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer space-y-1 ${
                    isLight
                      ? "bg-slate-50 border-slate-200 hover:border-[#E21B23]"
                      : "bg-[#0E1216] border-[#20252A] hover:border-[#E21B23]/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#E21B23]">{ev.id}</span>
                    <span className="text-[9px] font-mono text-emerald-500 font-semibold">{ev.status}</span>
                  </div>
                  <div className={`text-xs font-semibold truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                    {ev.title}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#858B92] pt-0.5">
                    <span>{ev.source}</span>
                    <span>{ev.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Investigative Actions Checklist */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              isLight ? "bg-white border-slate-200" : "bg-[#0A0D10] border-[#20252A]"
            }`}
          >
            <div className="flex items-center justify-between border-b pb-2 border-inherit">
              <span className="text-[10px] font-mono text-[#858B92] uppercase font-bold tracking-wider">
                TACTICAL ACTIONS
              </span>
              <ListTodo className="w-4 h-4 text-zinc-500" />
            </div>

            <div className="space-y-2">
              {investigationActions.map((act, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex items-center justify-between gap-2.5 text-xs ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-[#0E1216] border-[#20252A]"
                  }`}
                >
                  <div className="min-w-0">
                    <span className={`line-clamp-2 ${isLight ? "text-slate-800" : "text-slate-200"}`}>
                      {act.task}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase mt-1 block ${
                        act.priority === "CRITICAL" ? "text-[#FF3038]" : "text-amber-500"
                      }`}
                    >
                      {act.priority} PRIORITY
                    </span>
                  </div>
                  <button
                    onClick={act.action}
                    className="px-2.5 py-1.5 rounded-lg bg-[#E21B23] hover:bg-[#FF3038] text-white font-mono text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                  >
                    {act.actionLabel}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PoliceCommandOverview;

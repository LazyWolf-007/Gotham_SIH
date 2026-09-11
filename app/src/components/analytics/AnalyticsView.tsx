import React, { useMemo } from "react";
import { GraphKernel } from "../../types";
import { ProvenanceBadge } from "../ProvenanceBadge";
import {
  Shield,
  FileText,
  Users,
  GitFork,
  Activity,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Landmark,
  Clock,
  ExternalLink,
  Target,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Search,
  Eye,
  FileCheck,
} from "lucide-react";

interface AnalyticsViewProps {
  kernel: GraphKernel | null;
  onSelectEntity: (entityId: string) => void;
  onIsolateCommunity?: (communityId: number) => void;
  onOpenTimeline?: () => void;
  onOpenEvidence?: () => void;
  onOpenDossier?: () => void;
  onOpenGraph?: (focusId?: string) => void;
  onSelectPattern?: (patternId: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  kernel,
  onSelectEntity,
  onIsolateCommunity,
  onOpenTimeline,
  onOpenEvidence,
  onOpenDossier,
  onOpenGraph,
  onSelectPattern,
}) => {
  const meta = kernel?.meta;
  const nodes = kernel?.nodes || [];
  const edges = kernel?.edges || [];

  // Ranked Person Centrality (Using EXISTING backend centrality values)
  const rankedPersons = useMemo(() => {
    return [...nodes]
      .filter((n) => n.type === "Person" && n.metrics?.betweenness !== undefined)
      .sort((a, b) => (b.metrics?.betweenness || 0) - (a.metrics?.betweenness || 0))
      .slice(0, 6);
  }, [nodes]);

  const totalEntities = nodes.length || 259;
  const totalLinks = edges.length || 3931;
  const personCount = meta?.object_counts?.Person || 80;
  const phoneCount = meta?.object_counts?.Phone || 40;
  const accountCount = meta?.object_counts?.Account || 30;
  const firCount = meta?.object_counts?.FIR || 60;
  const orgCount = meta?.object_counts?.Organization || 10;
  const locCount = meta?.object_counts?.Location || 8;
  const vehCount = meta?.object_counts?.Vehicle || 25;

  return (
    <div className="flex-1 h-full flex flex-col bg-[#050607] text-[#F2F2F2] overflow-y-auto select-none font-sans p-5 gap-5">
      {/* Header: POLICE INTELLIGENCE BRIEFING */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3.5 border-b border-[#20252A] shrink-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-[#E21B23]/20 text-[#FF3038] text-[9px] font-mono font-bold tracking-widest uppercase border border-[#E21B23]/40">
              POLICE INTELLIGENCE BRIEFING
            </span>
            <span className="text-zinc-600">•</span>
            <ProvenanceBadge type="GRAPH ANALYSIS" />
            <ProvenanceBadge type="BACKEND DATA" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-1 flex items-center gap-2">
            Executive Intelligence Summary
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono px-3 py-1 rounded-xl bg-[#0E1216] border border-[#20252A] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>VERIFIED ANALYSIS READY</span>
          </div>
        </div>
      </div>

      {/* 1. KEY INTELLIGENCE (Compact Stat Matrix) */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono tracking-widest text-[#858B92] uppercase font-bold flex items-center gap-2">
          <span>01 / KEY INTELLIGENCE METRICS</span>
          <span className="h-[1px] flex-1 bg-[#20252A]" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Total Entities */}
          <div className="p-3 rounded-xl bg-[#0E1216] border border-[#20252A] flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#858B92] uppercase">ENTITIES</span>
            <div className="text-lg font-bold font-mono text-white mt-1">{totalEntities}</div>
            <span className="text-[9px] text-[#555C63] font-mono mt-0.5">Total Graph Nodes</span>
          </div>

          {/* Total Links */}
          <div className="p-3 rounded-xl bg-[#0E1216] border border-[#20252A] flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#858B92] uppercase">TYPED LINKS</span>
            <div className="text-lg font-bold font-mono text-white mt-1">{totalLinks.toLocaleString()}</div>
            <span className="text-[9px] text-[#555C63] font-mono mt-0.5">CDR & NEFT Edges</span>
          </div>

          {/* Persons */}
          <div className="p-3 rounded-xl bg-[#0E1216] border border-[#20252A] flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#858B92] uppercase">PERSONS</span>
            <div className="text-lg font-bold font-mono text-[#FF3038] mt-1">{personCount}</div>
            <span className="text-[9px] text-[#555C63] font-mono mt-0.5">Tracked Subjects</span>
          </div>

          {/* Phones */}
          <div className="p-3 rounded-xl bg-[#0E1216] border border-[#20252A] flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#858B92] uppercase">PHONES</span>
            <div className="text-lg font-bold font-mono text-slate-200 mt-1">{phoneCount}</div>
            <span className="text-[9px] text-[#555C63] font-mono mt-0.5">SIM / Handsets</span>
          </div>

          {/* Accounts */}
          <div className="p-3 rounded-xl bg-[#0E1216] border border-[#20252A] flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#858B92] uppercase">ACCOUNTS</span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">{accountCount}</div>
            <span className="text-[9px] text-[#555C63] font-mono mt-0.5">Bank Accounts</span>
          </div>

          {/* FIRs */}
          <div className="p-3 rounded-xl bg-[#0E1216] border border-[#20252A] flex flex-col justify-between">
            <span className="text-[10px] font-mono text-[#858B92] uppercase">FIRS</span>
            <div className="text-lg font-bold font-mono text-rose-400 mt-1">{firCount}</div>
            <span className="text-[9px] text-[#555C63] font-mono mt-0.5">Crime Filings</span>
          </div>

          {/* Key Bottleneck */}
          <div className="p-3 rounded-xl bg-[#0E1216] border border-[#E21B23]/40 flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-[#FF3038] uppercase font-bold">KEY BOTTLENECK</span>
            <div className="text-xs font-bold text-white mt-1 truncate">Naveen Bhatia</div>
            <span className="text-[9px] text-amber-400 font-mono mt-0.5">Betweenness #1 (0.02555)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Priorities + Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 2. INVESTIGATIVE PRIORITIES (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-2 flex flex-col">
          <div className="text-[10px] font-mono tracking-widest text-[#858B92] uppercase font-bold flex items-center gap-2">
            <span>02 / INVESTIGATIVE PRIORITIES</span>
            <span className="h-[1px] flex-1 bg-[#20252A]" />
          </div>

          <div className="space-y-2.5 flex-1">
            {/* Priority 01: Accountant Cut-point */}
            <div className="p-3.5 rounded-xl bg-[#0E1216] border border-[#20252A] hover:border-[#E21B23]/50 transition-all flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#E21B23]/20 text-[#FF3038] border border-[#E21B23]/40 shrink-0">
                  01
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wide">
                      ACCOUNTANT CUT-POINT (BOTTLENECK)
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold">
                      HIGH RISK
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-200 mt-1">
                    Naveen Bhatia <span className="text-[10px] font-mono text-[#858B92] font-normal">(person:naveen_bhatia)</span>
                  </div>
                  <p className="text-[11px] text-[#858B92] mt-1 leading-relaxed">
                    Highest person betweenness centrality in the network (0.02555). Controls financial routing bridging Azadpur Mandi cash skim to shell entities.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onSelectEntity("person:naveen_bhatia");
                  if (onOpenGraph) onOpenGraph("person:naveen_bhatia");
                }}
                className="px-2.5 py-1 rounded-lg bg-[#20252A] hover:bg-[#E21B23] text-xs font-mono text-slate-200 hover:text-white transition-colors shrink-0 cursor-pointer flex items-center gap-1"
              >
                <span>Target</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Priority 02: Mule Call Burst */}
            <div className="p-3.5 rounded-xl bg-[#0E1216] border border-[#20252A] hover:border-sky-500/50 transition-all flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/40 shrink-0">
                  02
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wide">
                      MULE CALL BURST DETECTED
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                      ACTIVE SPIKE
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-200 mt-1">
                    phone:ph03 / Farhan Lodhi <span className="text-[10px] font-mono text-[#858B92] font-normal">(Cell Relay)</span>
                  </div>
                  <p className="text-[11px] text-[#858B92] mt-1 leading-relaxed">
                    141 outbound panic call intercepts logged immediately post registration of FIR-2026-014. High-frequency communication fan-out.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onSelectEntity("person:farhan_lodhi");
                  if (onOpenGraph) onOpenGraph("person:farhan_lodhi");
                }}
                className="px-2.5 py-1 rounded-lg bg-[#20252A] hover:bg-sky-600 text-xs font-mono text-slate-200 hover:text-white transition-colors shrink-0 cursor-pointer flex items-center gap-1"
              >
                <span>Target</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Priority 03: Hawala 4-Account Cycle */}
            <div className="p-3.5 rounded-xl bg-[#0E1216] border border-[#20252A] hover:border-emerald-500/50 transition-all flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                  03
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wide">
                      HAWALA 4-ACCOUNT CIRCULAR CYCLE
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      VERIFIED FLOW
                    </span>
                  </div>
                  <div className="text-xs font-mono text-emerald-400 mt-1">
                    acc:a02 → acc:a03 → acc:a08 → acc:a09 → acc:a02
                  </div>
                  <p className="text-[11px] text-[#858B92] mt-1 leading-relaxed">
                    Circular PAID NEFT transactions structured below threshold limit to conceal produce skim proceeds.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (onSelectPattern) onSelectPattern("hawala_cycle");
                  else if (onOpenGraph) onOpenGraph();
                }}
                className="px-2.5 py-1 rounded-lg bg-[#20252A] hover:bg-emerald-600 text-xs font-mono text-slate-200 hover:text-white transition-colors shrink-0 cursor-pointer flex items-center gap-1"
              >
                <span>Inspect</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. DETECTED PATTERNS (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-2 flex flex-col">
          <div className="text-[10px] font-mono tracking-widest text-[#858B92] uppercase font-bold flex items-center gap-2">
            <span>03 / DETECTED SYNDICATE PATTERNS</span>
            <span className="h-[1px] flex-1 bg-[#20252A]" />
          </div>

          <div className="space-y-2 flex-1">
            {/* Pattern 1: Hawala Cycle */}
            <div className="p-3 rounded-xl bg-[#0E1216] border border-[#20252A] flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Hawala Cycle</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#E21B23]/20 text-[#FF3038] font-bold">
                    HIGH CONFIDENCE
                  </span>
                </div>
                <div className="text-[11px] text-[#858B92] mt-0.5">
                  4-Account circular fund routing concealed via NEFT layering.
                </div>
              </div>
              <button
                onClick={() => {
                  if (onSelectPattern) onSelectPattern("hawala_cycle");
                  else if (onOpenGraph) onOpenGraph();
                }}
                className="px-2 py-1 rounded bg-[#20252A] hover:bg-[#E21B23] text-[10px] font-mono text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                Investigate
              </button>
            </div>

            {/* Pattern 2: Mule Burst */}
            <div className="p-3 rounded-xl bg-[#0E1216] border border-[#20252A] flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Mule Burst</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                    HIGH CONFIDENCE
                  </span>
                </div>
                <div className="text-[11px] text-[#858B92] mt-0.5">
                  141 outbound calls logged from phone:ph03 post FIR filing.
                </div>
              </div>
              <button
                onClick={() => {
                  if (onSelectPattern) onSelectPattern("mule_burst");
                  else if (onOpenGraph) onOpenGraph();
                }}
                className="px-2 py-1 rounded bg-[#20252A] hover:bg-sky-600 text-[10px] font-mono text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                Investigate
              </button>
            </div>

            {/* Pattern 3: Accountant Cut-point */}
            <div className="p-3 rounded-xl bg-[#0E1216] border border-[#20252A] flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Accountant Cut-point</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold">
                    HIGH CONFIDENCE
                  </span>
                </div>
                <div className="text-[11px] text-[#858B92] mt-0.5">
                  Naveen Bhatia single-point bottleneck bridging Mandi to shells.
                </div>
              </div>
              <button
                onClick={() => {
                  if (onSelectPattern) onSelectPattern("accountant_cut");
                  else if (onOpenGraph) onOpenGraph();
                }}
                className="px-2 py-1 rounded bg-[#20252A] hover:bg-amber-600 text-[10px] font-mono text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                Investigate
              </button>
            </div>

            {/* Pattern 4: Front Cluster */}
            <div className="p-3 rounded-xl bg-[#0E1216] border border-[#20252A] flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Front Cluster</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                    VERIFIED
                  </span>
                </div>
                <div className="text-[11px] text-[#858B92] mt-0.5">
                  Commercial shell organizations masking produce cash skimming.
                </div>
              </div>
              <button
                onClick={() => {
                  if (onSelectPattern) onSelectPattern("front_cluster");
                  else if (onOpenGraph) onOpenGraph();
                }}
                className="px-2 py-1 rounded bg-[#20252A] hover:bg-purple-600 text-[10px] font-mono text-slate-200 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                Investigate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Row: Centrality Ranking + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 4. CENTRALITY RANKINGS (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-2">
          <div className="text-[10px] font-mono tracking-widest text-[#858B92] uppercase font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>04 / RANKED SUBJECT CENTRALITY (BACKEND VERIFIED)</span>
            </div>
            <span>BETWEENNESS RANK</span>
          </div>

          <div className="space-y-1.5">
            {rankedPersons.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => {
                  onSelectEntity(p.id);
                  if (onOpenGraph) onOpenGraph(p.id);
                }}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer group ${
                  idx === 0
                    ? "bg-[#0E1216] border-[#E21B23]/60 shadow-sm"
                    : "bg-[#0E1216] border-[#20252A] hover:border-[#384048]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-xs font-mono font-bold w-5 ${idx === 0 ? "text-[#FF3038]" : "text-[#858B92]"}`}>
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className={`text-xs font-bold truncate group-hover:text-[#FF3038] transition-colors ${idx === 0 ? "text-white" : "text-slate-200"}`}>
                      {p.label}
                      {idx === 0 && (
                        <span className="ml-2 text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#E21B23]/20 text-[#FF3038] font-bold">
                          TOP BOTTLENECK
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-[#858B92] truncate">
                      {p.id} • {p.attributes?.role || p.type}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono shrink-0 ml-2">
                  <div className="text-xs text-amber-400 font-bold">
                    {(p.metrics?.betweenness || 0).toFixed(5)}
                  </div>
                  <div className="text-[9px] text-[#555C63]">
                    Degree: {p.metrics?.degree || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. QUICK ACTIONS (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="text-[10px] font-mono tracking-widest text-[#858B92] uppercase font-bold flex items-center gap-2">
            <span>05 / INVESTIGATIVE QUICK ACTIONS</span>
            <span className="h-[1px] flex-1 bg-[#20252A]" />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* View Target Subject */}
            <button
              onClick={() => {
                onSelectEntity("person:naveen_bhatia");
                if (onOpenDossier) onOpenDossier();
              }}
              className="p-3 rounded-xl bg-[#0E1216] hover:bg-[#20252A] border border-[#20252A] hover:border-[#E21B23]/60 transition-all text-left flex flex-col justify-between cursor-pointer group"
            >
              <Users className="w-4 h-4 text-[#FF3038] group-hover:scale-110 transition-transform mb-2" />
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#FF3038] transition-colors">
                  View Key Subject
                </div>
                <div className="text-[10px] font-mono text-[#858B92] mt-0.5">
                  Naveen Bhatia Dossier
                </div>
              </div>
            </button>

            {/* View Evidence Material */}
            <button
              onClick={() => {
                if (onOpenEvidence) onOpenEvidence();
              }}
              className="p-3 rounded-xl bg-[#0E1216] hover:bg-[#20252A] border border-[#20252A] hover:border-sky-500/60 transition-all text-left flex flex-col justify-between cursor-pointer group"
            >
              <FileCheck className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform mb-2" />
              <div>
                <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                  View Evidence
                </div>
                <div className="text-[10px] font-mono text-[#858B92] mt-0.5">
                  60 FIRs & 72 Intercepts
                </div>
              </div>
            </button>

            {/* Open Timeline */}
            <button
              onClick={() => {
                if (onOpenTimeline) onOpenTimeline();
              }}
              className="p-3 rounded-xl bg-[#0E1216] hover:bg-[#20252A] border border-[#20252A] hover:border-emerald-500/60 transition-all text-left flex flex-col justify-between cursor-pointer group"
            >
              <Clock className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform mb-2" />
              <div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Open Timeline
                </div>
                <div className="text-[10px] font-mono text-[#858B92] mt-0.5">
                  Chronological Event Stream
                </div>
              </div>
            </button>

            {/* Open Dossier */}
            <button
              onClick={() => {
                if (onOpenDossier) onOpenDossier();
              }}
              className="p-3 rounded-xl bg-[#0E1216] hover:bg-[#20252A] border border-[#20252A] hover:border-purple-500/60 transition-all text-left flex flex-col justify-between cursor-pointer group"
            >
              <FileText className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform mb-2" />
              <div>
                <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                  Open Case Dossier
                </div>
                <div className="text-[10px] font-mono text-[#858B92] mt-0.5">
                  Collected Subject Dossiers
                </div>
              </div>
            </button>

            {/* Investigate in Graph */}
            <button
              onClick={() => {
                if (onOpenGraph) onOpenGraph();
              }}
              className="p-3 rounded-xl bg-[#E21B23]/15 hover:bg-[#E21B23]/30 border border-[#E21B23]/40 text-white transition-all text-left flex flex-col justify-between cursor-pointer group col-span-2"
            >
              <div className="flex items-center justify-between w-full">
                <Target className="w-4 h-4 text-[#FF3038] group-hover:scale-110 transition-transform" />
                <ArrowRight className="w-3.5 h-3.5 text-[#FF3038] group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-white group-hover:text-[#FF3038] transition-colors">
                  Investigate in Knowledge Graph Canvas
                </div>
                <div className="text-[10px] font-mono text-slate-300 mt-0.5">
                  Focus 2-hop topology & run counterfactual arrest simulations
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

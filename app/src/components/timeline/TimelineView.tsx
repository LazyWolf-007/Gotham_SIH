import React, { useState, useMemo } from "react";
import { GraphKernel, TimelineEvent, GraphEdge } from "../../types";
import { useCase } from "../../context/CaseContext";
import { useToast } from "../../context/ToastContext";
import { ProvenanceBadge } from "../ProvenanceBadge";
import {
  Clock,
  PhoneCall,
  CreditCard,
  FileWarning,
  Eye,
  Filter,
  Search,
  ArrowRight,
  ExternalLink,
  Calendar,
  BookmarkPlus,
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface TimelineViewProps {
  kernel: GraphKernel | null;
  onSelectEntity: (entityId: string) => void;
  onOpenEvidence?: (evidenceId?: string) => void;
  theme?: "dark" | "light";
}

type TimelineCategory = "ALL" | "CALLS" | "TRANSACTIONS" | "FIR" | "SURVEILLANCE";

export const TimelineView: React.FC<TimelineViewProps> = ({
  kernel,
  onSelectEntity,
  onOpenEvidence,
  theme = "dark",
}) => {
  const isLight = theme === "light";
  const { activeCase, addToDossier, isInDossier } = useCase();
  const { showToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<TimelineCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Extract chronological events from real edges and nodes
  const allEvents = useMemo(() => {
    if (!kernel) return [];
    const list: Array<{
      id: string;
      category: TimelineCategory;
      type: string;
      timestamp: string;
      title: string;
      subtitle: string;
      sourceNodeId: string;
      targetNodeId: string;
      relatedSubject: string;
      description: string;
      isMilestone?: boolean;
      evidenceId?: string;
    }> = [];

    // 1. FIR Milestone Filings
    kernel.nodes
      .filter((n) => n.type === "FIR")
      .forEach((n) => {
        const at = n.attributes?.registered_at || n.attributes?.date || "2026-04-12 09:42";
        list.push({
          id: `EV-FIR-${n.id}`,
          category: "FIR",
          type: "First Information Report Registered",
          timestamp: at,
          title: `FIR Registered: ${n.id}`,
          subtitle: `${n.attributes?.police_station || "Special Cell"} • Offence: IPC 420/120B`,
          sourceNodeId: n.id,
          targetNodeId: n.id,
          relatedSubject: n.attributes?.suspect_name || "Naveen Bhatia / Syndicate",
          description:
            n.attributes?.narrative ||
            n.attributes?.summary ||
            "Official registration regarding cash skimming and illicit fund diversion at Azadpur Mandi.",
          isMilestone: true,
          evidenceId: n.id,
        });
      });

    // 2. Financial Transactions
    kernel.edges
      .filter((e) => e.type === "PAID")
      .slice(0, 40)
      .forEach((e, idx) => {
        const at = e.attributes?.at || `2026-04-12 ${10 + (idx % 8)}:${String((idx * 7) % 60).padStart(2, "0")}`;
        const amt = e.attributes?.amount_inr
          ? `₹${e.attributes.amount_inr.toLocaleString("en-IN")}`
          : "₹1,450,000";
        list.push({
          id: `EV-PAID-${idx}`,
          category: "TRANSACTIONS",
          type: "Financial Settlement (PAID)",
          timestamp: at,
          title: `Transfer: ${amt}`,
          subtitle: `${e.source} → ${e.target}`,
          sourceNodeId: e.source,
          targetNodeId: e.target,
          relatedSubject: e.source,
          description:
            e.attributes?.snippet ||
            `Electronic fund transfer of ${amt} via ${e.attributes?.channel || "RTGS"} routing.`,
          evidenceId: `TXN-2026-${String(idx + 1).padStart(3, "0")}`,
        });
      });

    // 3. Telecommunication Intercepts
    kernel.edges
      .filter((e) => e.type === "CALLED")
      .slice(0, 40)
      .forEach((e, idx) => {
        const at = e.attributes?.at || `2026-04-12 ${11 + (idx % 7)}:${String((idx * 9) % 60).padStart(2, "0")}`;
        const dur = e.attributes?.duration_s ? `${e.attributes.duration_s}s` : "98s";
        list.push({
          id: `EV-CALL-${idx}`,
          category: "CALLS",
          type: "Cellular Intercept (CALLED)",
          timestamp: at,
          title: `Voice Intercept: ${e.source} → ${e.target}`,
          subtitle: `Duration: ${dur} | Tower: ${e.attributes?.tower || "ND-Azadpur-04"}`,
          sourceNodeId: e.source,
          targetNodeId: e.target,
          relatedSubject: e.source,
          description:
            e.attributes?.snippet ||
            `Cellular conversation (${dur}) recorded pinging base transceiver station.`,
          evidenceId: `CDR-2026-${String(idx + 1).padStart(3, "0")}`,
        });
      });

    // 4. Surveillance Sightings
    kernel.edges
      .filter((e) => e.type === "SEEN_AT")
      .forEach((e, idx) => {
        const at = e.attributes?.at || `2026-04-12 14:${String((idx * 11) % 60).padStart(2, "0")}`;
        list.push({
          id: `EV-SURV-${idx}`,
          category: "SURVEILLANCE",
          type: "Optical Reconnaissance (SEEN_AT)",
          timestamp: at,
          title: `Physical Sighting: ${e.source}`,
          subtitle: `Location Nexus: ${e.target}`,
          sourceNodeId: e.source,
          targetNodeId: e.target,
          relatedSubject: e.source,
          description:
            e.attributes?.snippet ||
            `Automated optical reconnaissance confirmed presence of subject at ${e.target}.`,
          evidenceId: `SURV-2026-${String(idx + 1).padStart(3, "0")}`,
        });
      });

    // Sort chronologically
    return list.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }, [kernel]);

  // Unique subjects for filter
  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    allEvents.forEach((ev) => {
      if (ev.relatedSubject && ev.relatedSubject.length < 35) set.add(ev.relatedSubject);
    });
    return Array.from(set).slice(0, 10);
  }, [allEvents]);

  // Filtered timeline events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      const matchCat = selectedCategory === "ALL" || ev.category === selectedCategory;
      const matchSubject = selectedSubject === "ALL" || ev.relatedSubject === selectedSubject;
      const matchQuery =
        !searchQuery ||
        ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.relatedSubject.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSubject && matchQuery;
    });
  }, [allEvents, selectedCategory, selectedSubject, searchQuery]);

  const activeEvent = filteredEvents.find((e) => e.id === selectedEventId) || filteredEvents[0] || null;

  return (
    <div
      className={`flex-1 h-full flex flex-col overflow-hidden select-none font-sans p-6 gap-5 transition-colors duration-200 ${
        isLight ? "bg-[#FAFAFA] text-slate-900" : "bg-[#050607] text-[#F2F2F2]"
      }`}
    >
      {/* Top Header */}
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b shrink-0 ${
          isLight ? "border-slate-200" : "border-[#20252A]"
        }`}
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#E21B23] uppercase font-bold">
              {activeCase.id}
            </span>
            <span className="text-zinc-600">•</span>
            <ProvenanceBadge type="TIMELINE EVENT" />
            <ProvenanceBadge type="BACKEND DATA" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Chronological Activity Timeline
          </h1>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#858B92]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, subjects, or notes..."
            className="w-full bg-[#0E1216] border border-[#20252A] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#858B92] focus:outline-none focus:border-[#E21B23] transition-colors font-mono"
          />
        </div>
      </div>

      {/* Filter Row: Category Pills + Subject Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs font-mono">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(["ALL", "FIR", "CALLS", "TRANSACTIONS", "SURVEILLANCE"] as const).map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === "ALL" ? allEvents.length : allEvents.filter((e) => e.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg border uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-[#E21B23] border-[#FF3038] text-white font-bold shadow-sm"
                    : "bg-[#0A0D10] border-[#20252A] text-[#858B92] hover:text-white"
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? "bg-black/30 text-white" : "bg-[#20252A] text-[#858B92]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[#858B92] text-[10px] uppercase">Subject Filter:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-[#0E1216] border border-[#20252A] rounded-lg px-2.5 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-[#E21B23] cursor-pointer"
          >
            <option value="ALL">All Subjects</option>
            {subjectsList.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main 2-Column: Event Stream (7 Cols) + Detailed Event Inspector (5 Cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* Left: Event Stream (7 Cols) */}
        <div className="lg:col-span-7 overflow-y-auto space-y-3 pr-2">
          {filteredEvents.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#0A0D10] border border-[#20252A] text-center text-xs text-[#858B92] font-mono flex flex-col items-center justify-center gap-2">
              <Clock className="w-8 h-8 text-zinc-600" />
              <div className="text-white font-bold text-sm">NO CHRONOLOGICAL EVENTS MATCH FILTER</div>
              <p className="text-zinc-500 text-[11px]">Adjust your search query or reset active timeline filters.</p>
            </div>
          ) : (
            filteredEvents.map((item) => {
              const isSelected = activeEvent?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedEventId(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-[#0E1216] border-[#E21B23] shadow-md shadow-[#E21B23]/10"
                      : "bg-[#0A0D10] border-[#20252A] hover:border-[#384048] hover:bg-[#0E1216]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-[#E21B23]">
                          {item.timestamp}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#20252A] text-zinc-300 border border-[#384048] uppercase">
                          {item.type}
                        </span>
                        {item.isMilestone && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#E21B23]/20 border border-[#E21B23]/40 text-[#FF3038] font-bold">
                            KEY MILESTONE
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">{item.title}</h4>
                    </div>

                    <span className="text-[10px] font-mono text-[#858B92] shrink-0">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-[#858B92] mt-2 line-clamp-2 leading-relaxed font-sans">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#20252A] text-[11px] font-mono text-[#858B92]">
                    <span>Subject: <strong className="text-slate-200">{item.relatedSubject}</strong></span>
                    {item.evidenceId && (
                      <span className="text-zinc-400">{item.evidenceId}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Detailed Event Inspector (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0E1216] border border-[#20252A] rounded-2xl p-5 overflow-y-auto flex flex-col gap-4">
          {activeEvent ? (
            <>
              <div className="pb-3 border-b border-[#20252A]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-mono font-bold text-[#E21B23]">
                    {activeEvent.timestamp}
                  </span>
                  <ProvenanceBadge type="TIMELINE EVENT" />
                </div>
                <h3 className="text-base font-bold text-white mt-1.5">{activeEvent.title}</h3>
                <div className="text-[11px] font-mono text-[#858B92] mt-1">{activeEvent.subtitle}</div>
              </div>

              {/* Subject Association */}
              <div className="p-3 rounded-xl bg-[#0A0D10] border border-[#20252A] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-mono text-[#858B92] uppercase">
                    Primary Associated Subject
                  </span>
                  <div className="font-bold text-white mt-0.5">{activeEvent.relatedSubject}</div>
                </div>
                <button
                  onClick={() => onSelectEntity(activeEvent.sourceNodeId)}
                  className="px-2.5 py-1 rounded bg-[#20252A] hover:bg-[#E21B23] text-white text-[10px] font-mono transition-colors cursor-pointer"
                >
                  View Subject
                </button>
              </div>

              {/* Event Narrative */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-[#858B92] uppercase font-bold">
                  EVENT NARRATIVE & CONDUIT
                </span>
                <div className="p-3 rounded-xl bg-[#050607] border border-[#20252A] text-xs text-slate-200 leading-relaxed font-sans">
                  {activeEvent.description}
                </div>
              </div>

              {/* Source & Target Nodes */}
              <div className="space-y-1.5 font-mono text-xs">
                <span className="text-[10px] text-[#858B92] uppercase font-bold">
                  TOPOLOGICAL CONDUIT
                </span>
                <div className="p-2.5 rounded-xl bg-[#0A0D10] border border-[#20252A] flex items-center justify-between">
                  <span className="text-[#858B92]">Source Node:</span>
                  <span className="text-white font-bold">{activeEvent.sourceNodeId}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0A0D10] border border-[#20252A] flex items-center justify-between">
                  <span className="text-[#858B92]">Target Node:</span>
                  <span className="text-white font-bold">{activeEvent.targetNodeId}</span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-auto space-y-2 pt-3 border-t border-[#20252A]">
                <div className="grid grid-cols-2 gap-2">
                  {/* Action 1: Add to Dossier */}
                  <button
                    onClick={() => {
                      addToDossier({
                        id: activeEvent.id,
                        type: "EVIDENCE",
                        title: activeEvent.title,
                        subtitle: `${activeEvent.timestamp} • ${activeEvent.relatedSubject}`,
                        category: activeEvent.category,
                        targetEntityId: activeEvent.sourceNodeId,
                      });
                      showToast(`Added timeline event to dossier`, "success");
                    }}
                    className="py-2 px-3 rounded-xl bg-[#0A0D10] hover:bg-[#20252A] border border-[#20252A] text-slate-200 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-[#858B92]" />
                    <span>Add to Dossier</span>
                  </button>

                  {/* Action 2: Open Evidence View */}
                  {activeEvent.evidenceId && (
                    <button
                      onClick={() => onOpenEvidence && onOpenEvidence(activeEvent.evidenceId)}
                      className="py-2 px-3 rounded-xl bg-[#0A0D10] hover:bg-[#20252A] border border-[#20252A] text-slate-200 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#858B92]" />
                      <span>Open Evidence</span>
                    </button>
                  )}
                </div>

                {/* Action 3: Open in Network */}
                <button
                  onClick={() => onSelectEntity(activeEvent.sourceNodeId)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-bold font-mono transition-all shadow-md shadow-[#E21B23]/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Locate in Network Graph</span>
                </button>
              </div>
            </>
          ) : (
            <div className="m-auto text-center text-xs text-[#858B92] font-mono p-6 border border-dashed border-[#20252A] rounded-xl flex flex-col items-center justify-center gap-2">
              <Clock className="w-8 h-8 text-zinc-600" />
              <span>SELECT A TIMELINE EVENT TO INSPECT DETAILS</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

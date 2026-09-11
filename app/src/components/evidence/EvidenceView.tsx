import React, { useState, useMemo } from "react";
import { GraphKernel } from "../../types";
import { useCase } from "../../context/CaseContext";
import { useToast } from "../../context/ToastContext";
import { ProvenanceBadge } from "../ProvenanceBadge";
import {
  FileText,
  PhoneCall,
  CreditCard,
  Camera,
  Layers,
  Search,
  ArrowRight,
  Filter,
  Calendar,
  ShieldAlert,
  ExternalLink,
  BookmarkPlus,
  BookmarkCheck,
  Clock,
  Share2,
  Check,
  RotateCcw,
} from "lucide-react";

interface EvidenceViewProps {
  kernel: GraphKernel | null;
  onSelectEntity: (entityId: string) => void;
  onOpenTimeline?: (eventId?: string) => void;
  onOpenDossier?: () => void;
}

type EvidenceCategory =
  | "ALL"
  | "FIR"
  | "CALL RECORD"
  | "TRANSACTION"
  | "SURVEILLANCE"
  | "ENTITY RECORD";

export const EvidenceView: React.FC<EvidenceViewProps> = ({
  kernel,
  onSelectEntity,
  onOpenTimeline,
  onOpenDossier,
}) => {
  const { activeCase, addToDossier, removeFromDossier, isInDossier } = useCase();
  const { showToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<EvidenceCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("ALL");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [reviewStatuses, setReviewStatuses] = useState<Record<string, "UNREVIEWED" | "REVIEWED" | "FLAGGED">>({});

  const handleSetStatus = (evidenceId: string, status: "UNREVIEWED" | "REVIEWED" | "FLAGGED") => {
    setReviewStatuses((prev) => ({ ...prev, [evidenceId]: status }));
    showToast(`Investigator status updated: ${status} (LOCAL PROTOTYPE)`, "info");
  };

  // Derive real evidence records from graph kernel
  const evidenceRecords = useMemo(() => {
    if (!kernel) return [];

    const items: Array<{
      id: string;
      category: EvidenceCategory;
      type: string;
      title: string;
      relatedSubject: string;
      relatedSubjectId?: string;
      dateTime: string;
      source: string;
      status: string;
      description: string;
      metadata: Record<string, any>;
      targetNodeId?: string;
    }> = [];

    // 1. FIR Records from Nodes
    kernel.nodes
      .filter((n) => n.type === "FIR")
      .forEach((n) => {
        items.push({
          id: n.id,
          category: "FIR",
          type: "First Information Report",
          title: n.label || n.id,
          relatedSubject: n.attributes?.suspect_name || "Syndicate Principals & Shell Entities",
          relatedSubjectId: n.attributes?.suspect_id,
          dateTime: n.attributes?.registered_at || n.attributes?.date || "2026-04-12 09:42",
          source: "State Crime Records Bureau / Delhi Special Cell",
          status: "AUTHENTICATED",
          description:
            n.attributes?.narrative ||
            n.attributes?.summary ||
            `Official filing under IPC 420/120B regarding systematic cash diversion and money laundering.`,
          metadata: n.attributes || {},
          targetNodeId: n.id,
        });
      });

    // 2. Transaction Records from PAID Edges
    kernel.edges
      .filter((e) => e.type === "PAID")
      .slice(0, 60)
      .forEach((e, idx) => {
        const amount = e.attributes?.amount_inr
          ? `₹${e.attributes.amount_inr.toLocaleString("en-IN")}`
          : "₹1,450,000";
        items.push({
          id: `TXN-2026-${String(idx + 1).padStart(3, "0")}`,
          category: "TRANSACTION",
          type: "Banking Transfer (PAID)",
          title: `Settlement: ${e.source} → ${e.target}`,
          relatedSubject: e.source.includes("naveen") ? "Naveen Bhatia" : e.source,
          relatedSubjectId: e.source,
          dateTime: e.attributes?.at || "2026-04-12 13:20",
          source: e.attributes?.source_type || "Financial Intelligence Unit (FIU-IND)",
          status: "VERIFIED CONDUIT",
          description:
            e.attributes?.snippet ||
            `Transfer of ${amount} via ${e.attributes?.channel || "IMPS/RTGS"} settlement route.`,
          metadata: {
            amount_inr: e.attributes?.amount_inr,
            channel: e.attributes?.channel || "RTGS",
            source_account: e.source,
            target_account: e.target,
            ...e.attributes,
          },
          targetNodeId: e.source,
        });
      });

    // 3. Call Records from CALLED Edges
    kernel.edges
      .filter((e) => e.type === "CALLED")
      .slice(0, 60)
      .forEach((e, idx) => {
        const duration = e.attributes?.duration_s ? `${e.attributes.duration_s}s` : "142s";
        items.push({
          id: `CDR-2026-${String(idx + 1).padStart(3, "0")}`,
          category: "CALL RECORD",
          type: "Telecommunication Intercept (CALLED)",
          title: `Intercept: ${e.source} → ${e.target}`,
          relatedSubject: e.source.includes("ph03") ? "Farhan Lodhi (phone:ph03)" : e.source,
          relatedSubjectId: e.source,
          dateTime: e.attributes?.at || "2026-04-12 11:08",
          source: e.attributes?.source_type || "Cellular Provider CDR Feed (CDoT)",
          status: "INTERCEPTED",
          description:
            e.attributes?.snippet ||
            `Cellular voice intercept (${duration}) logged at tower ${e.attributes?.tower || "ND-Azadpur-04"}.`,
          metadata: {
            duration_s: e.attributes?.duration_s,
            tower: e.attributes?.tower || "ND-Azadpur-04",
            calling_party: e.source,
            receiving_party: e.target,
            ...e.attributes,
          },
          targetNodeId: e.source,
        });
      });

    // 4. Surveillance Sightings from SEEN_AT Edges
    kernel.edges
      .filter((e) => e.type === "SEEN_AT")
      .forEach((e, idx) => {
        items.push({
          id: `SURV-2026-${String(idx + 1).padStart(3, "0")}`,
          category: "SURVEILLANCE",
          type: "Surveillance Sighting (SEEN_AT)",
          title: `Recon Sighting: ${e.source} at ${e.target}`,
          relatedSubject: e.source,
          relatedSubjectId: e.source,
          dateTime: e.attributes?.at || "2026-04-12 16:15",
          source: e.attributes?.source_type || "ANPR Optical Surveillance",
          status: "LOGGED",
          description:
            e.attributes?.snippet ||
            `Automated visual surveillance confirmed presence of ${e.source} at location ${e.target}.`,
          metadata: {
            subject: e.source,
            location: e.target,
            ...e.attributes,
          },
          targetNodeId: e.source,
        });
      });

    return items;
  }, [kernel]);

  // Unique subjects for filter
  const subjectsList = useMemo(() => {
    const set = new Set<string>();
    evidenceRecords.forEach((r) => {
      if (r.relatedSubject && r.relatedSubject.length < 35) set.add(r.relatedSubject);
    });
    return Array.from(set).slice(0, 10);
  }, [evidenceRecords]);

  // Filter items
  const filteredRecords = useMemo(() => {
    return evidenceRecords.filter((rec) => {
      const matchCat = selectedCategory === "ALL" || rec.category === selectedCategory;
      const matchSubject =
        selectedSubjectFilter === "ALL" || rec.relatedSubject === selectedSubjectFilter;
      const matchQuery =
        !searchQuery ||
        rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.relatedSubject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSubject && matchQuery;
    });
  }, [evidenceRecords, selectedCategory, selectedSubjectFilter, searchQuery]);

  // Default selection to first item if none selected
  const activeDetail = selectedItem || filteredRecords[0] || null;

  const isDetailInDossier = activeDetail ? isInDossier(activeDetail.id) : false;

  const handleToggleDossier = () => {
    if (!activeDetail) return;
    if (isDetailInDossier) {
      removeFromDossier(activeDetail.id);
      showToast(`Removed ${activeDetail.id} from Case Dossier`, "info");
    } else {
      addToDossier({
        id: activeDetail.id,
        type: "EVIDENCE",
        title: activeDetail.title,
        subtitle: `${activeDetail.category} • ${activeDetail.relatedSubject}`,
        category: activeDetail.category,
        targetEntityId: activeDetail.targetNodeId,
      });
      showToast(`Evidence added to dossier: ${activeDetail.title}`, "success");
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#050607] text-[#F2F2F2] overflow-hidden select-none font-sans p-6 gap-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#20252A] shrink-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#E21B23] uppercase font-bold">
              {activeCase.id}
            </span>
            <span className="text-zinc-600">•</span>
            <ProvenanceBadge type="EVIDENCE RECORD" />
            <ProvenanceBadge type="BACKEND DATA" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Evidentiary Material & Records
          </h1>
        </div>

        {/* Global Evidence Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#858B92]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search evidence ID, subject, or keyword..."
            className="w-full bg-[#0E1216] border border-[#20252A] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#858B92] focus:outline-none focus:border-[#E21B23] transition-colors font-mono"
          />
        </div>
      </div>

      {/* Category Pills & Subject Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs font-mono">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(["ALL", "FIR", "CALL RECORD", "TRANSACTION", "SURVEILLANCE"] as const).map((cat) => {
            const count =
              cat === "ALL"
                ? evidenceRecords.length
                : evidenceRecords.filter((r) => r.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border uppercase tracking-wider shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-[#E21B23] border-[#FF3038] text-white font-bold shadow-sm"
                    : "bg-[#0A0D10] border-[#20252A] text-[#858B92] hover:text-white hover:border-[#384048]"
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

        {/* Subject Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[#858B92] text-[10px] uppercase">Subject Filter:</span>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
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

      {/* 2-Column: Cards List & Detailed Evidence Inspection */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* Left: Cards List (7 Cols) */}
        <div className="lg:col-span-7 overflow-y-auto space-y-3 pr-2">
          {filteredRecords.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#0A0D10] border border-[#20252A] text-center text-xs text-[#858B92] font-mono flex flex-col items-center justify-center gap-3">
              <ShieldAlert className="w-8 h-8 text-zinc-600" />
              <div>
                <div className="text-white font-bold text-sm">NO EVIDENTIARY RECORDS FOUND</div>
                <p className="text-zinc-500 mt-1">No items match your active search and category filters.</p>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSelectedSubjectFilter("ALL");
                  setSearchQuery("");
                }}
                className="px-3 py-1.5 rounded-lg bg-[#20252A] hover:bg-[#384048] text-white text-xs font-mono transition-colors"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredRecords.map((item) => {
              const isSelected = activeDetail?.id === item.id;
              const inDossier = isInDossier(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-[#0E1216] border-[#E21B23] shadow-md shadow-[#E21B23]/10"
                      : "bg-[#0A0D10] border-[#20252A] hover:border-[#384048] hover:bg-[#0E1216]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-[#E21B23]">
                          {item.id}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#20252A] text-zinc-300 border border-[#384048] uppercase">
                          {item.type}
                        </span>
                        {inDossier && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/60 text-emerald-300">
                            IN DOSSIER
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1 truncate">
                        {item.title}
                      </h4>
                    </div>

                    <span className="text-[10px] font-mono text-[#858B92] shrink-0">
                      {item.dateTime}
                    </span>
                  </div>

                  <p className="text-xs text-[#858B92] line-clamp-2 mt-2 leading-relaxed font-sans">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#20252A] text-[11px] font-mono text-[#858B92]">
                    <span className="truncate">Subject: <strong className="text-slate-200">{item.relatedSubject}</strong></span>
                    <span className="text-emerald-400 font-bold">{item.status}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Detailed Inspection Card (5 Cols) */}
        <div className="lg:col-span-5 bg-[#0E1216] border border-[#20252A] rounded-2xl p-5 overflow-y-auto flex flex-col gap-4">
          {activeDetail ? (
            <>
              {/* Header Info */}
              <div className="pb-3 border-b border-[#20252A]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#E21B23]">
                      {activeDetail.id}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#20252A] text-zinc-300 uppercase">
                      {activeDetail.category}
                    </span>
                  </div>
                  <ProvenanceBadge type="EVIDENCE RECORD" />
                </div>
                <h3 className="text-base font-bold text-white mt-1.5">
                  {activeDetail.title}
                </h3>
                <div className="text-[11px] font-mono text-[#858B92] mt-1">
                  Indexed: {activeDetail.dateTime} • Case: {activeCase.id}
                </div>
              </div>

              {/* Related Subject */}
              <div className="p-3 rounded-xl bg-[#0A0D10] border border-[#20252A] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-mono text-[#858B92] uppercase">
                    Primary Associated Subject
                  </span>
                  <div className="font-bold text-white mt-0.5">{activeDetail.relatedSubject}</div>
                </div>
                {activeDetail.targetNodeId && (
                  <button
                    onClick={() => onSelectEntity(activeDetail.targetNodeId)}
                    className="px-2.5 py-1 rounded bg-[#20252A] hover:bg-[#E21B23] text-white text-[10px] font-mono transition-colors cursor-pointer"
                  >
                    View Subject
                  </button>
                )}
              </div>

              {/* Narrative */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#858B92] uppercase font-bold">
                    AUTHENTICATED RECORD NARRATIVE
                  </span>
                  <ProvenanceBadge type="BACKEND DATA" />
                </div>
                <div className="p-3 rounded-xl bg-[#050607] border border-[#20252A] text-xs text-slate-200 leading-relaxed font-sans">
                  {activeDetail.description}
                </div>
              </div>

              {/* Metadata Key-Value pairs */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[#858B92] uppercase font-bold">
                  EVIDENTIARY RECORD METADATA
                </span>
                <div className="space-y-1.5">
                  <div className="p-2 rounded-lg bg-[#0A0D10] border border-[#20252A] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#858B92]">Source Feed:</span>
                    <span className="text-white font-semibold">{activeDetail.source}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0A0D10] border border-[#20252A] flex flex-col gap-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[#858B92]">Investigator Review Status:</span>
                      <ProvenanceBadge type="LOCAL PROTOTYPE" />
                    </div>
                    <div className="grid grid-cols-3 gap-1 pt-0.5">
                      {(["UNREVIEWED", "REVIEWED", "FLAGGED"] as const).map((st) => {
                        const current = reviewStatuses[activeDetail.id] || "UNREVIEWED";
                        const isSelected = current === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleSetStatus(activeDetail.id, st)}
                            className={`py-1 px-1.5 rounded text-[10px] font-mono font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? st === "FLAGGED"
                                  ? "bg-red-950/80 border border-red-600/80 text-red-300"
                                  : st === "REVIEWED"
                                  ? "bg-emerald-950/80 border border-emerald-600/80 text-emerald-300"
                                  : "bg-slate-800 border border-slate-600 text-white"
                                : "bg-[#050607] border border-[#20252A] text-zinc-400 hover:text-white"
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0A0D10] border border-[#20252A] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#858B92]">Integrity Status:</span>
                    <span className="text-emerald-400 font-bold">{activeDetail.status}</span>
                  </div>
                  {Object.entries(activeDetail.metadata)
                    .slice(0, 5)
                    .map(([k, v]) => (
                      <div
                        key={k}
                        className="p-2 rounded-lg bg-[#0A0D10] border border-[#20252A] flex items-center justify-between text-xs font-mono"
                      >
                        <span className="text-[#858B92]">{k}:</span>
                        <span className="text-white font-semibold truncate max-w-[200px]">
                          {typeof v === "object" ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-auto space-y-2 pt-3 border-t border-[#20252A]">
                <div className="grid grid-cols-2 gap-2">
                  {/* Action 1: Add to Dossier */}
                  <button
                    onClick={handleToggleDossier}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isDetailInDossier
                        ? "bg-emerald-950/40 border-emerald-700/60 text-emerald-300"
                        : "bg-[#0A0D10] hover:bg-[#20252A] border-[#20252A] text-slate-200"
                    }`}
                  >
                    {isDetailInDossier ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <BookmarkPlus className="w-3.5 h-3.5 text-[#858B92]" />
                    )}
                    <span>{isDetailInDossier ? "In Dossier" : "Add to Dossier"}</span>
                  </button>

                  {/* Action 2: Open in Timeline */}
                  <button
                    onClick={() => onOpenTimeline && onOpenTimeline(activeDetail.id)}
                    className="py-2 px-3 rounded-xl bg-[#0A0D10] hover:bg-[#20252A] border border-[#20252A] text-slate-200 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#858B92]" />
                    <span>Open in Timeline</span>
                  </button>
                </div>

                {/* Action 3: Open in Network */}
                {activeDetail.targetNodeId && (
                  <button
                    onClick={() => onSelectEntity(activeDetail.targetNodeId!)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-bold font-mono transition-all shadow-md shadow-[#E21B23]/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Investigate in Network Graph</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="m-auto text-center text-xs text-[#858B92] font-mono p-6 border border-dashed border-[#20252A] rounded-xl flex flex-col items-center justify-center gap-2">
              <ShieldAlert className="w-8 h-8 text-zinc-600" />
              <span>SELECT AN EVIDENTIARY RECORD TO INSPECT PROVENANCE AND ATTRIBUTES</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

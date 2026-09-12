import React, { useState } from "react";
import { useCase, DossierItem } from "../../context/CaseContext";
import { useToast } from "../../context/ToastContext";
import { ProvenanceBadge } from "../ProvenanceBadge";
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
  Trash2,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Share2,
  Download,
  Printer,
  FileQuestion,
} from "lucide-react";

import { InvestigationReportModal } from "./InvestigationReportModal";

interface DossierViewProps {
  kernel: GraphKernel | null;
  onSelectEntity: (entityId: string) => void;
  onOpenEvidence?: () => void;
  onOpenTimeline?: () => void;
  onOpenCaseNetwork: (caseId: string) => void;
  theme?: "dark" | "light";
}

export const DossierView: React.FC<DossierViewProps> = ({
  kernel,
  onSelectEntity,
  onOpenEvidence,
  onOpenTimeline,
  onOpenCaseNetwork,
  theme = "dark",
}) => {
  const isLight =
    theme === "light" ||
    (typeof document !== "undefined" && document.documentElement.classList.contains("light"));

  const {
    activeCase,
    dossierItems,
    removeFromDossier,
    toggleKeyFinding,
    notes,
    addNote,
    deleteNote,
  } = useCase();

  const { showToast } = useToast();

  const [activeDossierTab, setActiveDossierTab] = useState<
    "ALL" | "SUBJECTS" | "EVIDENCE" | "PATTERNS" | "NOTES"
  >("ALL");

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteIsKeyFinding, setNewNoteIsKeyFinding] = useState(false);

  // Grouped dossier counts
  const subjects = dossierItems.filter((d) => d.type === "SUBJECT");
  const evidence = dossierItems.filter((d) => d.type === "EVIDENCE");
  const patterns = dossierItems.filter((d) => d.type === "PATTERN");
  const keyFindings = dossierItems.filter((d) => d.isKeyFinding);

  const filteredItems = dossierItems.filter((d) => {
    if (activeDossierTab === "ALL") return true;
    if (activeDossierTab === "SUBJECTS") return d.type === "SUBJECT";
    if (activeDossierTab === "EVIDENCE") return d.type === "EVIDENCE";
    if (activeDossierTab === "PATTERNS") return d.type === "PATTERN";
    return true;
  });

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    addNote(newNoteTitle, newNoteContent, newNoteIsKeyFinding);
    showToast("Investigator note saved to dossier (LOCAL PROTOTYPE)", "success");
    setNewNoteTitle("");
    setNewNoteContent("");
    setNewNoteIsKeyFinding(false);
  };

  const handleRemoveDossierItem = (id: string, title: string) => {
    removeFromDossier(id);
    showToast(`Removed "${title}" from dossier`, "info");
  };

  const handleToggleFinding = (id: string) => {
    toggleKeyFinding(id);
    showToast("Key finding status updated", "info");
  };

  return (
    <div
      className={`flex-1 h-full flex flex-col overflow-y-auto select-none font-sans p-6 gap-6 transition-colors duration-200 ${
        isLight ? "bg-[#FAFAFA] text-slate-900" : "bg-[#050607] text-[#F2F2F2]"
      }`}
    >
      {/* Investigation Report Modal */}
      <InvestigationReportModal
        kernel={kernel}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

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
            <span className={isLight ? "text-slate-300" : "text-zinc-600"}>•</span>
            <ProvenanceBadge type={activeCase.isPrototypeRecord ? "LOCAL PROTOTYPE" : "BACKEND DATA"} />
          </div>
          <h1 className={`text-2xl font-bold tracking-tight mt-1 ${isLight ? "text-slate-900" : "text-white"}`}>
            Investigation Case Dossier
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer shadow-sm ${
              isLight
                ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-800"
                : "bg-[#0E1216] hover:bg-[#20252A] border-[#20252A] text-slate-200 hover:text-white"
            }`}
          >
            <Printer className="w-3.5 h-3.5 text-[#E21B23]" />
            <span>Export Official Report</span>
          </button>
          <button
            onClick={() => onOpenCaseNetwork(activeCase.id)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-bold font-mono transition-all shadow-md shadow-[#E21B23]/25 cursor-pointer"
          >
            <span>Open Graph Canvas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Case Header Briefing Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#0E1216] border-[#20252A]"
        }`}
      >
        <div>
          <div
            className={`flex items-center gap-2 font-mono text-xs flex-wrap ${
              isLight ? "text-slate-500" : "text-[#858B92]"
            }`}
          >
            <span className="text-[#FF3038] font-bold">{activeCase.name}</span>
            <span>•</span>
            <span>{activeCase.agency}</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{activeCase.status}</span>
          </div>
          <p className={`text-xs mt-1.5 max-w-3xl leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>
            {activeCase.summary}
          </p>
        </div>

        {/* Dossier Quick Metrics */}
        <div className="flex items-center gap-3 font-mono text-xs shrink-0">
          <div
            className={`p-2.5 rounded-lg border text-center min-w-[70px] ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-[#050607] border-[#20252A]"
            }`}
          >
            <div className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
              {subjects.length}
            </div>
            <div className={`text-[9px] uppercase ${isLight ? "text-slate-500" : "text-[#858B92]"}`}>
              Subjects
            </div>
          </div>
          <div
            className={`p-2.5 rounded-lg border text-center min-w-[70px] ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-[#050607] border-[#20252A]"
            }`}
          >
            <div className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
              {evidence.length}
            </div>
            <div className={`text-[9px] uppercase ${isLight ? "text-slate-500" : "text-[#858B92]"}`}>
              Evidence
            </div>
          </div>
          <div
            className={`p-2.5 rounded-lg border text-center min-w-[70px] ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-[#050607] border-[#20252A]"
            }`}
          >
            <div className="text-xs font-bold text-[#FF3038]">{keyFindings.length}</div>
            <div className={`text-[9px] uppercase ${isLight ? "text-slate-500" : "text-[#858B92]"}`}>
              Findings
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column: Collected Items (7 Cols) + Officer Field Notes (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0">
        {/* Left: Collected Dossier Items (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sub-tabs */}
          <div
            className={`flex items-center gap-1.5 border-b pb-2 text-xs font-mono ${
              isLight ? "border-slate-200" : "border-[#20252A]"
            }`}
          >
            {(["ALL", "SUBJECTS", "EVIDENCE", "PATTERNS"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveDossierTab(tab)}
                className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
                  activeDossierTab === tab
                    ? isLight
                      ? "bg-slate-200 text-slate-900 font-bold border border-slate-300"
                      : "bg-[#20252A] text-white font-bold border border-[#384048]"
                    : isLight
                    ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    : "text-[#858B92] hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <div
              className={`p-8 rounded-xl border text-center text-xs font-mono flex flex-col items-center justify-center gap-2 ${
                isLight ? "bg-white border-slate-200 text-slate-500" : "bg-[#0A0D10] border-[#20252A] text-[#858B92]"
              }`}
            >
              <FileQuestion className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
              <span>NO DOSSIER ITEMS COLLECTED IN THIS CATEGORY YET.</span>
              <p className="text-zinc-500 text-[11px]">
                Bookmark subjects or evidence items from the Graph Canvas or Evidence Repository.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    item.isKeyFinding
                      ? isLight
                        ? "bg-red-50/70 border-red-400 shadow-sm"
                        : "bg-[#0E1216] border-[#E21B23]/70 shadow-sm"
                      : isLight
                      ? "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                      : "bg-[#0A0D10] border-[#20252A] hover:border-[#384048]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                          {item.title}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase border ${
                            isLight
                              ? "bg-slate-100 border-slate-300 text-slate-700"
                              : "bg-[#20252A] border-zinc-700 text-zinc-300"
                          }`}
                        >
                          {item.type}
                        </span>
                        {item.isKeyFinding && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border ${
                              isLight
                                ? "bg-red-100 border-red-300 text-red-700"
                                : "bg-[#E21B23]/20 border-[#E21B23]/40 text-[#FF3038]"
                            }`}
                          >
                            KEY FINDING
                          </span>
                        )}
                        <ProvenanceBadge type={item.type === "EVIDENCE" ? "EVIDENCE RECORD" : "GRAPH ANALYSIS"} />
                      </div>
                      <div
                        className={`text-xs mt-1 leading-relaxed ${
                          isLight ? "text-slate-600" : "text-slate-300"
                        }`}
                      >
                        {item.subtitle}
                      </div>
                      <div
                        className={`text-[10px] font-mono mt-1.5 ${
                          isLight ? "text-slate-500" : "text-[#858B92]"
                        }`}
                      >
                        Added: {item.dateAdded} • ID: {item.id}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleFinding(item.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isLight
                            ? "text-slate-500 hover:text-[#FF3038] hover:bg-slate-100"
                            : "text-[#858B92] hover:text-[#FF3038] hover:bg-[#20252A]"
                        }`}
                        title="Toggle Key Finding"
                      >
                        {item.isKeyFinding ? (
                          <BookmarkCheck className="w-4 h-4 text-[#FF3038]" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>

                      {item.targetEntityId && (
                        <button
                          onClick={() => onSelectEntity(item.targetEntityId!)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer border ${
                            isLight
                              ? "bg-slate-100 hover:bg-red-600 hover:text-white border-slate-300 text-slate-800"
                              : "bg-[#20252A] hover:bg-[#E21B23] border-[#384048] text-white"
                          }`}
                        >
                          View on Graph
                        </button>
                      )}

                      <button
                        onClick={() => handleRemoveDossierItem(item.id, item.title)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isLight
                            ? "text-slate-400 hover:text-red-600 hover:bg-slate-100"
                            : "text-[#858B92] hover:text-red-400 hover:bg-[#20252A]"
                        }`}
                        title="Remove from Dossier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Investigator Notes & Key Findings (5 Cols) */}
        <div
          className={`lg:col-span-5 border rounded-2xl p-5 space-y-4 ${
            isLight ? "bg-white border-slate-200 shadow-sm" : "bg-[#0E1216] border-[#20252A]"
          }`}
        >
          <div
            className={`flex items-center justify-between pb-3 border-b ${
              isLight ? "border-slate-200" : "border-[#20252A]"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#E21B23] uppercase font-bold tracking-wider">
                  INTELLIGENCE LOG
                </span>
                <ProvenanceBadge type="LOCAL PROTOTYPE" />
              </div>
              <h3 className={`text-base font-bold mt-0.5 ${isLight ? "text-slate-900" : "text-white"}`}>
                Investigator Notes ({notes.length})
              </h3>
            </div>
          </div>

          {/* Add Note Form */}
          <form
            onSubmit={handleAddNoteSubmit}
            className={`p-3.5 rounded-xl border space-y-2.5 text-xs font-sans ${
              isLight ? "bg-slate-50 border-slate-200" : "bg-[#0A0D10] border-[#20252A]"
            }`}
          >
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Note Heading / Rationale..."
              className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#E21B23] ${
                isLight
                  ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  : "bg-[#050607] border-[#20252A] text-white placeholder-[#858B92]"
              }`}
            />
            <textarea
              rows={3}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Log investigative rationale, witness statements, or financial nexus findings..."
              className={`w-full border rounded-lg p-2.5 text-xs focus:outline-none focus:border-[#E21B23] resize-none ${
                isLight
                  ? "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
                  : "bg-[#050607] border-[#20252A] text-white placeholder-[#858B92]"
              }`}
            />
            <div className="flex items-center justify-between pt-1">
              <label
                className={`flex items-center gap-2 font-mono text-[11px] cursor-pointer ${
                  isLight ? "text-slate-600" : "text-[#858B92]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={newNoteIsKeyFinding}
                  onChange={(e) => setNewNoteIsKeyFinding(e.target.checked)}
                  className="accent-[#E21B23]"
                />
                <span>Key Finding</span>
              </label>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-bold font-mono transition-all cursor-pointer shadow-sm"
              >
                Log Note
              </button>
            </div>
          </form>

          {/* Notes Stream */}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {notes.length === 0 ? (
              <div
                className={`p-6 rounded-xl border border-dashed text-center text-xs font-mono ${
                  isLight ? "bg-slate-50 border-slate-300 text-slate-500" : "bg-[#050607] border-[#20252A] text-[#858B92]"
                }`}
              >
                No investigator notes logged yet. Use the form above to log observations.
              </div>
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-xl border relative ${
                    n.isKeyFinding
                      ? isLight
                        ? "bg-red-50/70 border-red-300 shadow-sm"
                        : "bg-[#0A0D10] border-[#E21B23]/70 shadow-sm"
                      : isLight
                      ? "bg-slate-50 border-slate-200"
                      : "bg-[#0A0D10] border-[#20252A]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-bold text-sm ${isLight ? "text-slate-900" : "text-white"}`}>
                          {n.title}
                        </span>
                        {n.isKeyFinding && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border ${
                              isLight
                                ? "bg-red-100 border-red-300 text-red-700"
                                : "bg-[#E21B23]/20 border-[#E21B23]/40 text-[#FF3038]"
                            }`}
                          >
                            KEY FINDING
                          </span>
                        )}
                        <ProvenanceBadge type="LOCAL PROTOTYPE" />
                      </div>
                      <div
                        className={`text-[10px] font-mono mt-0.5 ${
                          isLight ? "text-slate-500" : "text-[#858B92]"
                        }`}
                      >
                        {n.author} • {n.timestamp}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        deleteNote(n.id);
                        showToast("Note deleted", "info");
                      }}
                      className={`p-1 ${isLight ? "text-slate-400 hover:text-red-600" : "text-[#858B92] hover:text-red-400"}`}
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p
                    className={`text-xs mt-2 leading-relaxed font-sans ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    {n.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { useCase, DossierItem } from "../../context/CaseContext";
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
} from "lucide-react";

import { InvestigationReportModal } from "./InvestigationReportModal";

interface DossierViewProps {
  kernel: GraphKernel | null;
  onSelectEntity: (entityId: string) => void;
  onOpenEvidence?: () => void;
  onOpenTimeline?: () => void;
  onOpenCaseNetwork: (caseId: string) => void;
}

export const DossierView: React.FC<DossierViewProps> = ({
  kernel,
  onSelectEntity,
  onOpenEvidence,
  onOpenTimeline,
  onOpenCaseNetwork,
}) => {
  const {
    activeCase,
    dossierItems,
    removeFromDossier,
    toggleKeyFinding,
    notes,
    addNote,
    deleteNote,
  } = useCase();

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

  return (
    <div className="flex-1 h-full flex flex-col bg-[#050607] text-[#F2F2F2] overflow-y-auto select-none font-sans p-6 gap-6">
      {/* Investigation Report Modal */}
      <InvestigationReportModal
        kernel={kernel}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#20252A] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#E21B23] uppercase font-bold">
              {activeCase.id}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[10px] font-mono tracking-wider text-[#858B92] uppercase">
              CASE WORKSPACE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Investigation Dossier
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1216] hover:bg-[#20252A] border border-[#20252A] text-slate-200 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-[#E21B23]" />
            <span>Export Investigation Report</span>
          </button>
          <button
            onClick={() => onOpenCaseNetwork(activeCase.id)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-bold font-mono transition-all shadow-md shadow-[#E21B23]/25 cursor-pointer"
          >
            <span>Open Case Graph</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Case Header Briefing Banner */}
      <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20252A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs text-[#858B92]">
            <span className="text-[#FF3038] font-bold">{activeCase.name}</span>
            <span>•</span>
            <span>{activeCase.agency}</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{activeCase.status}</span>
          </div>
          <p className="text-xs text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
            {activeCase.summary}
          </p>
        </div>

        {/* Dossier Quick Metrics */}
        <div className="flex items-center gap-3 font-mono text-xs shrink-0">
          <div className="p-2.5 rounded-lg bg-[#050607] border border-[#20252A] text-center min-w-[70px]">
            <div className="text-xs font-bold text-white">{subjects.length}</div>
            <div className="text-[9px] text-[#858B92] uppercase">Subjects</div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#050607] border border-[#20252A] text-center min-w-[70px]">
            <div className="text-xs font-bold text-white">{evidence.length}</div>
            <div className="text-[9px] text-[#858B92] uppercase">Evidence</div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#050607] border border-[#20252A] text-center min-w-[70px]">
            <div className="text-xs font-bold text-[#FF3038]">{keyFindings.length}</div>
            <div className="text-[9px] text-[#858B92] uppercase">Findings</div>
          </div>
        </div>
      </div>

      {/* Main 2-Column: Collected Items (7 Cols) + Officer Field Notes (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 min-h-0">
        {/* Left: Collected Dossier Items (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sub-tabs */}
          <div className="flex items-center gap-1.5 border-b border-[#20252A] pb-2 text-xs font-mono">
            {(["ALL", "SUBJECTS", "EVIDENCE", "PATTERNS"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveDossierTab(tab)}
                className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
                  activeDossierTab === tab
                    ? "bg-[#20252A] text-white font-bold border border-[#384048]"
                    : "text-[#858B92] hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#0A0D10] border border-[#20252A] text-center text-xs text-[#858B92] font-mono">
              NO DOSSIER ITEMS COLLECTED IN THIS CATEGORY YET.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    item.isKeyFinding
                      ? "bg-[#0E1216] border-[#E21B23]/70 shadow-sm"
                      : "bg-[#0A0D10] border-[#20252A] hover:border-[#384048]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{item.title}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#20252A] text-zinc-300 uppercase">
                          {item.type}
                        </span>
                        {item.isKeyFinding && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#E21B23]/20 border border-[#E21B23]/40 text-[#FF3038] font-bold">
                            KEY FINDING
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {item.subtitle}
                      </div>
                      <div className="text-[10px] font-mono text-[#858B92] mt-1.5">
                        Added: {item.dateAdded} • ID: {item.id}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleKeyFinding(item.id)}
                        className="p-1.5 rounded-lg text-[#858B92] hover:text-[#FF3038] hover:bg-[#20252A] transition-colors cursor-pointer"
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
                          className="px-2.5 py-1 rounded-lg bg-[#20252A] hover:bg-[#E21B23] text-white text-xs font-mono font-medium transition-colors cursor-pointer"
                        >
                          View on Graph
                        </button>
                      )}

                      <button
                        onClick={() => removeFromDossier(item.id)}
                        className="p-1.5 rounded-lg text-[#858B92] hover:text-red-400 hover:bg-[#20252A] transition-colors cursor-pointer"
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
        <div className="lg:col-span-5 bg-[#0E1216] border border-[#20252A] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#20252A]">
            <div>
              <span className="text-[10px] font-mono text-[#E21B23] uppercase font-bold tracking-wider">
                INTELLIGENCE LOG
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">Investigator Notes ({notes.length})</h3>
            </div>
          </div>

          {/* Add Note Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newNoteContent.trim()) return;
              addNote(newNoteTitle, newNoteContent, newNoteIsKeyFinding);
              setNewNoteTitle("");
              setNewNoteContent("");
              setNewNoteIsKeyFinding(false);
            }}
            className="p-3.5 rounded-xl bg-[#0A0D10] border border-[#20252A] space-y-2.5 text-xs font-sans"
          >
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Note Heading / Hypothesis..."
              className="w-full bg-[#050607] border border-[#20252A] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#858B92] focus:outline-none focus:border-[#E21B23]"
            />
            <textarea
              rows={3}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Log investigative rationale, witness statements, or financial nexus findings..."
              className="w-full bg-[#050607] border border-[#20252A] rounded-lg p-2.5 text-xs text-white placeholder-[#858B92] focus:outline-none focus:border-[#E21B23] resize-none"
            />
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 font-mono text-[11px] text-[#858B92] cursor-pointer">
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
            {notes.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border relative ${
                  n.isKeyFinding
                    ? "bg-[#0A0D10] border-[#E21B23]/70 shadow-sm"
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
                <p className="text-xs text-slate-300 mt-2 leading-relaxed font-sans">
                  {n.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

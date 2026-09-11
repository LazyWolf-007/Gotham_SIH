import React from "react";
import { GraphKernel, CutResult } from "../../types";
import { useCase } from "../../context/CaseContext";
import { useAuth } from "../../context/AuthContext";
import {
  Printer,
  Download,
  X,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  BookmarkCheck,
  Building,
  User,
  Calendar,
} from "lucide-react";

interface InvestigationReportModalProps {
  kernel: GraphKernel | null;
  cutResult?: CutResult | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvestigationReportModal: React.FC<InvestigationReportModalProps> = ({
  kernel,
  cutResult,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { activeCase, dossierItems, notes } = useCase();

  if (!isOpen) return null;

  const keyFindings = dossierItems.filter((d) => d.isKeyFinding);
  const subjects = dossierItems.filter((d) => d.type === "SUBJECT");
  const evidence = dossierItems.filter((d) => d.type === "EVIDENCE");
  const patterns = dossierItems.filter((d) => d.type === "PATTERN");

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0A0D10] border border-[#20252A] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#20252A] bg-[#0E1216] shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-[#E21B23]" />
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              OFFICIAL INVESTIGATION REPORT DOSSIER
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-mono font-bold transition-all shadow-md shadow-[#E21B23]/30 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#20252A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="p-8 sm:p-12 overflow-y-auto space-y-8 font-sans text-[#F2F2F2] print:p-0 print:text-black print:bg-white">
          
          {/* Header & Emblem */}
          <div className="border-b-2 border-[#E21B23] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src="/jaal-emblem.png"
                alt="National Emblem"
                className="w-12 h-14 object-contain print:invert"
              />
              <div>
                <div className="text-2xl font-black tracking-widest text-white print:text-black">
                  JAAL
                </div>
                <div className="text-xs font-mono tracking-widest text-[#E21B23] uppercase font-bold mt-0.5">
                  NATIONAL CRIME NETWORK INTELLIGENCE PLATFORM
                </div>
                <div className="text-[11px] font-mono text-zinc-400 print:text-zinc-600 uppercase">
                  OPERATION GREY LEDGER • SPECIAL INVESTIGATION REPORT
                </div>
              </div>
            </div>

            <div className="text-right font-mono text-xs space-y-1 text-zinc-400 print:text-zinc-600">
              <div>Ref: <strong className="text-white print:text-black">{activeCase.id}</strong></div>
              <div>Date: <strong className="text-white print:text-black">{new Date().toLocaleDateString()}</strong></div>
              <div>Investigating Officer: <strong className="text-white print:text-black">{user?.displayName || "Kartik"} ({user?.badgeNumber || "IND-IO-26189"})</strong></div>
            </div>
          </div>

          {/* Prototype Disclaimer Banner */}
          <div className="p-3.5 rounded-xl bg-[#0E1216] border border-[#20252A] print:border-zinc-400 text-xs font-mono text-zinc-400 print:text-zinc-600 flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-[#E21B23] shrink-0" />
            <span>
              <strong>Investigation workspace — prototype record:</strong> This intelligence briefing compiles algorithmic network analysis, authenticated First Information Reports, and local investigator observations for investigative review.
            </span>
          </div>

          {/* Section 1: Case Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-[#E21B23] uppercase tracking-wider border-b border-[#20252A] pb-1">
              1. CASE INFORMATION
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-[#0E1216] border border-[#20252A] print:border-zinc-300">
                <span className="text-[10px] text-zinc-500 uppercase block">Case ID</span>
                <span className="font-bold text-white print:text-black">{activeCase.id}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0E1216] border border-[#20252A] print:border-zinc-300">
                <span className="text-[10px] text-zinc-500 uppercase block">Operation Name</span>
                <span className="font-bold text-white print:text-black">{activeCase.name}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0E1216] border border-[#20252A] print:border-zinc-300">
                <span className="text-[10px] text-zinc-500 uppercase block">Status</span>
                <span className="font-bold text-emerald-400 print:text-emerald-700">{activeCase.status}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0E1216] border border-[#20252A] print:border-zinc-300">
                <span className="text-[10px] text-zinc-500 uppercase block">Priority</span>
                <span className="font-bold text-[#FF3038] print:text-red-700">{activeCase.priority}</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 print:text-zinc-800 leading-relaxed font-sans mt-2">
              {activeCase.summary}
            </p>
          </div>

          {/* Section 2: Key Subjects */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-[#E21B23] uppercase tracking-wider border-b border-[#20252A] pb-1">
              2. KEY INVESTIGATION SUBJECTS
            </h3>
            <div className="space-y-2 text-xs">
              {[
                {
                  id: "person:naveen_bhatia",
                  name: "Naveen Bhatia",
                  role: "Accountant & Chief Financial Router",
                  metrics: "Betweenness Rank #1 (0.02555) • Degree: 6",
                  notes: "Primary topological bottleneck bridging physical traders to shell front entities.",
                },
                {
                  id: "person:vikram_haleja",
                  name: "Vikram Haleja",
                  role: "Syndicate Principal Beneficiary",
                  metrics: "Insulated Kingpin • Shell Protected",
                  notes: "Receives layered fund flows via secondary shell organizations.",
                },
                {
                  id: "person:farhan_lodhi",
                  name: "Farhan Lodhi",
                  role: "Communications & Mule Operator",
                  metrics: "141 Calls Burst following FIR-2026-014",
                  notes: "Operates mule mobile station phone:ph03.",
                },
              ].map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 rounded-lg bg-[#0E1216] border border-[#20252A] print:border-zinc-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-white print:text-black">{sub.name}</span>
                    <span className="text-zinc-400 print:text-zinc-600 text-xs ml-2">({sub.role})</span>
                    <div className="text-[11px] text-zinc-400 print:text-zinc-700 mt-0.5">{sub.notes}</div>
                  </div>
                  <div className="text-[10px] font-mono text-[#E21B23] font-bold shrink-0">
                    {sub.metrics}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Evidence Inventory */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-[#E21B23] uppercase tracking-wider border-b border-[#20252A] pb-1">
              3. EVIDENCE INVENTORY
            </h3>
            <div className="space-y-2 text-xs">
              {[
                {
                  id: "FIR-2026-014",
                  type: "FIR Filing",
                  details: "Special Cell Crime Branch registration under IPC 420/120B for systematic Azadpur cash skimming.",
                },
                {
                  id: "STR-2026-894",
                  type: "FIU Suspicious Transaction",
                  details: "NEFT circular routing of ₹14,50,000 across designated mule accounts.",
                },
                {
                  id: "CDR-2026-014",
                  type: "Call Data Record",
                  details: "141 outbound call surge logged on phone:ph03 within 180 minutes post-FIR filing.",
                },
              ].map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-lg bg-[#0E1216] border border-[#20252A] print:border-zinc-300 flex items-start justify-between gap-3"
                >
                  <div>
                    <span className="font-mono font-bold text-white print:text-black">{ev.id}</span>
                    <span className="text-[10px] font-mono ml-2 px-1.5 py-0.2 rounded bg-zinc-800 print:bg-zinc-200 text-zinc-300 print:text-zinc-800 uppercase">
                      {ev.type}
                    </span>
                    <p className="text-[11px] text-slate-300 print:text-zinc-700 mt-1">{ev.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Timeline Milestones */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-[#E21B23] uppercase tracking-wider border-b border-[#20252A] pb-1">
              4. CHRONOLOGICAL TIMELINE
            </h3>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="p-2 rounded bg-[#0E1216] border border-[#20252A] print:border-zinc-300 flex justify-between">
                <span>2026-04-12 09:42 — FIR-2026-014 Registration</span>
                <span className="text-[#FF3038] font-bold">MILESTONE</span>
              </div>
              <div className="p-2 rounded bg-[#0E1216] border border-[#20252A] print:border-zinc-300 flex justify-between">
                <span>2026-04-12 11:30 — Circular Hawala Transfer Loop (acc:a02 → acc:a03)</span>
                <span className="text-emerald-400 font-bold">TRANSACTION</span>
              </div>
              <div className="p-2 rounded bg-[#0E1216] border border-[#20252A] print:border-zinc-300 flex justify-between">
                <span>2026-04-12 12:40 — Mule Call Panic Spike (phone:ph03, 141 calls)</span>
                <span className="text-amber-400 font-bold">INTERCEPT</span>
              </div>
            </div>
          </div>

          {/* Section 5: Detected Patterns */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-[#E21B23] uppercase tracking-wider border-b border-[#20252A] pb-1">
              5. DETECTED INVESTIGATIVE PATTERNS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#0E1216] border border-[#20252A] print:border-zinc-300">
                <div className="text-emerald-400 print:text-emerald-700 font-bold">Hawala Cycle</div>
                <div className="text-zinc-400 print:text-zinc-700 text-[11px] mt-1">
                  Verified circular route: acc:a02 → acc:a03 → acc:a08 → acc:a09 → acc:a02
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0E1216] border border-[#20252A] print:border-zinc-300">
                <div className="text-[#FF3038] print:text-red-700 font-bold">Accountant Cut-Point</div>
                <div className="text-zinc-400 print:text-zinc-700 text-[11px] mt-1">
                  Target: person:naveen_bhatia (Betweenness Rank #1)
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Key Findings */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-[#E21B23] uppercase tracking-wider border-b border-[#20252A] pb-1">
              6. KEY INVESTIGATIVE FINDINGS
            </h3>
            <div className="space-y-2">
              {keyFindings.map((kf) => (
                <div
                  key={kf.id}
                  className="p-3 rounded-lg bg-[#0E1216] border-l-4 border-l-[#E21B23] border border-[#20252A] print:border-zinc-300 text-xs"
                >
                  <div className="font-bold text-white print:text-black">{kf.title}</div>
                  <div className="text-slate-300 print:text-zinc-700 text-[11px] mt-0.5">{kf.subtitle}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 7: Investigator Field Notes */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-[#E21B23] uppercase tracking-wider border-b border-[#20252A] pb-1">
              7. INVESTIGATOR OBSERVATIONS & FIELD NOTES
            </h3>
            <div className="space-y-2">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-lg bg-[#0E1216] border border-[#20252A] print:border-zinc-300 text-xs font-sans"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white print:text-black">{n.title}</span>
                    <span className="text-[10px] font-mono text-zinc-400">{n.timestamp}</span>
                  </div>
                  <p className="text-slate-300 print:text-zinc-700 text-xs mt-1 leading-relaxed">
                    {n.content}
                  </p>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1">
                    Author: {n.author}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 8: Counterfactual Scenario Simulation */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-[#E21B23] uppercase tracking-wider border-b border-[#20252A] pb-1">
              8. COUNTERFACTUAL INTERVENTION SIMULATION (WHAT-IF)
            </h3>
            <div className="p-3.5 rounded-lg bg-[#0E1216] border border-[#20252A] print:border-zinc-300 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Simulation Target:</span>
                <span className="text-white print:text-black font-bold">person:naveen_bhatia</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Component Disruption:</span>
                <span className="text-[#FF3038] font-bold">1 Component → 2 Disrupted Components</span>
              </div>
              <div className="text-[11px] text-slate-300 print:text-zinc-700 pt-1 border-t border-[#20252A] print:border-zinc-200">
                Surviving Residual Channel: <strong>phone:ph02 ↔ phone:ph03</strong> remains active as the alternate emergency communication conduit.
              </div>
            </div>
          </div>

          {/* Footer Signature Block */}
          <div className="pt-8 border-t-2 border-[#20252A] grid grid-cols-2 gap-8 text-xs font-mono">
            <div>
              <div className="text-zinc-500 uppercase text-[10px]">Investigating Officer</div>
              <div className="font-bold text-white print:text-black mt-1">
                {user?.displayName || "Kartik"}
              </div>
              <div className="text-[11px] text-zinc-400">
                Badge: {user?.badgeNumber || "IND-IO-26189"} • Special Cell
              </div>
            </div>
            <div className="text-right">
              <div className="text-zinc-500 uppercase text-[10px]">Supervisory Endorsement</div>
              <div className="font-bold text-white print:text-black mt-1">
                ACP V. K. Malhotra
              </div>
              <div className="text-[11px] text-zinc-400">
                Cyber Intelligence Command • NCRB
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

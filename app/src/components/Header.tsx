import React from "react";
import { GraphKernel } from "../types";
import {
  Shield,
  Activity,
  FileText,
  Clock,
  Bot,
  Layers,
  Sparkles,
  Database,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";

interface HeaderProps {
  kernel: GraphKernel | null;
  activeTab: "dossier" | "timeline" | "copilot";
  onTabChange: (tab: "dossier" | "timeline" | "copilot") => void;
  onBackToLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  kernel,
  activeTab,
  onTabChange,
  onBackToLanding,
}) => {
  const meta = kernel?.meta;
  const personCount = meta?.object_counts?.Person || 80;
  const phoneCount = meta?.object_counts?.Phone || 40;
  const accCount = meta?.object_counts?.Account || 30;
  const callCount = meta?.link_counts?.CALLED || 3000;
  const txnCount = meta?.link_counts?.PAID || 800;

  return (
    <header className="h-14 bg-[#090d16] border-b border-slate-800 px-4 flex items-center justify-between select-none z-40">
      {/* Brand & Case Identification */}
      <div className="flex items-center gap-3">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            title="Return to Landing Page & Case Briefing"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-sky-400" />
            <span>Landing</span>
          </button>
        )}

        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 shadow-md shadow-sky-600/30">
          <Shield className="w-4 h-4 text-white" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
              <span>GOTHAM_SIH</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800 font-mono">
                SIH26189
              </span>
            </h1>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-semibold text-slate-300">Operation Grey Ledger</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
            NCRB / MHA Criminal Network Intelligence Workbench
          </div>
        </div>
      </div>

      {/* Network Scale Chips */}
      <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono">
        <div className="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400">
          <span className="text-sky-400 font-bold">{personCount}</span> Persons
        </div>
        <div className="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400">
          <span className="text-cyan-400 font-bold">{phoneCount}</span> Phones
        </div>
        <div className="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400">
          <span className="text-emerald-400 font-bold">{accCount}</span> Accounts
        </div>
        <div className="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400">
          <span className="text-sky-300 font-bold">{callCount}</span> CDRs
        </div>
        <div className="px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400">
          <span className="text-emerald-300 font-bold">{txnCount}</span> Txns
        </div>
      </div>

      {/* Right Tab Switchers */}
      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => onTabChange("dossier")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "dossier"
              ? "bg-slate-800 text-sky-400 shadow-sm border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Dossier</span>
        </button>

        <button
          onClick={() => onTabChange("timeline")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "timeline"
              ? "bg-slate-800 text-sky-400 shadow-sm border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Timeline</span>
        </button>

        <button
          onClick={() => onTabChange("copilot")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "copilot"
              ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25"
              : "text-sky-400 hover:text-sky-300"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Copilot</span>
        </button>
      </div>
    </header>
  );
};

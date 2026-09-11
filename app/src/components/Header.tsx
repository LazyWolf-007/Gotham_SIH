import React from "react";
import { GraphKernel } from "../types";
import { useAuth } from "../context/AuthContext";
import { CaseSelector } from "./case/CaseSelector";
import {
  Shield,
  FileText,
  Clock,
  Bot,
  ArrowLeft,
  UserPlus,
  LogOut,
  UserCheck,
} from "lucide-react";

interface HeaderProps {
  kernel: GraphKernel | null;
  activeTab: "dossier" | "timeline" | "copilot";
  onTabChange: (tab: "dossier" | "timeline" | "copilot") => void;
  onBackToLanding?: () => void;
  onOpenAdminModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  kernel,
  activeTab,
  onTabChange,
  onBackToLanding,
  onOpenAdminModal,
}) => {
  const { user, logout } = useAuth();
  const meta = kernel?.meta;
  const personCount = meta?.object_counts?.Person || 80;
  const phoneCount = meta?.object_counts?.Phone || 40;
  const accCount = meta?.object_counts?.Account || 30;

  return (
    <header className="h-14 bg-[#090d16] border-b border-slate-800 px-4 flex items-center justify-between select-none z-40">
      {/* Brand & Case Selector */}
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

        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-md shadow-emerald-600/30">
          <Shield className="w-4 h-4 text-white" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
              <span>GOTHAM_SIH</span>
            </h1>
            <span className="text-slate-600">/</span>
            {/* Case Management Selector */}
            <CaseSelector />
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
      </div>

      {/* User Profile, Admin Console & Tab Switchers */}
      <div className="flex items-center gap-3">
        {/* User Role Badge & Admin Registration Button */}
        {user && (
          <div className="flex items-center gap-2">
            {user.role === "admin" && onOpenAdminModal && (
              <button
                onClick={onOpenAdminModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition-all shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Investigator</span>
              </button>
            )}

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200 flex items-center justify-end gap-1">
                <UserCheck className="w-3 h-3 text-teal-400" />
                {user.displayName || "Officer"}
              </span>
              <span className="text-[9px] font-mono text-emerald-400 uppercase">
                {user.role === "admin" ? "Master Admin" : `IO • ${user.badgeNumber}`}
              </span>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/80 hover:text-rose-400 text-slate-400 border border-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Switchers */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onTabChange("dossier")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "dossier"
                ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700"
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
                ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700"
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
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
                : "text-emerald-400 hover:text-emerald-300"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Copilot</span>
          </button>
        </div>
      </div>
    </header>
  );
};

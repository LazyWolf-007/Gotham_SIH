import React from "react";
import {
  LayoutDashboard,
  FolderGit2,
  Share2,
  FileText,
  FileCheck,
  Clock,
  BarChart3,
  Users2,
  GitFork,
  MessageSquare,
  ChevronRight,
  Shield,
  LogOut,
  Lock,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export type SidebarTab =
  | "overview"
  | "cases"
  | "graph"
  | "dossier"
  | "evidence"
  | "timeline"
  | "analytics"
  | "communities"
  | "scenarios"
  | "copilot";

interface SidebarNavProps {
  activeTab: SidebarTab;
  onSelectTab: (tab: SidebarTab) => void;
  onOpenAdminModal?: () => void;
  theme?: "dark" | "light";
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAdminModal,
  theme = "dark",
}) => {
  const { user, lockWorkstation, logout } = useAuth();
  const isLight = theme === "light";

  const navItems: { id: SidebarTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "cases", label: "Cases", icon: FolderGit2 },
    { id: "graph", label: "Graph", icon: Share2 },
    { id: "dossier", label: "Dossier", icon: FileText },
    { id: "evidence", label: "Evidence", icon: FileCheck },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "communities", label: "Communities", icon: Users2 },
    { id: "scenarios", label: "Scenarios", icon: GitFork },
    { id: "copilot", label: "Copilot", icon: MessageSquare },
  ];

  return (
    <aside
      className={`w-56 h-full flex flex-col justify-between border-r px-2.5 py-3.5 select-none shrink-0 z-30 transition-colors duration-200 ${
        isLight ? "bg-white border-slate-200 text-slate-900" : "bg-[#050607] border-[#20252A] text-white"
      }`}
    >
      {/* Top Navigation Items */}
      <div className="space-y-0.5">
        <div
          className={`px-3 pb-2 text-[10px] font-mono tracking-widest uppercase font-bold ${
            isLight ? "text-slate-400" : "text-[#555C63]"
          }`}
        >
          NAVIGATION
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? isLight
                    ? "bg-slate-100 text-slate-900 font-bold border-l-2 border-l-[#E21B23] shadow-xs"
                    : "bg-[#141A23] text-white font-bold border-l-2 border-l-[#E21B23]"
                  : isLight
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-l-2 border-l-transparent"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#0E1216] border-l-2 border-l-transparent"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive
                    ? "text-[#E21B23]"
                    : isLight
                    ? "text-slate-400 group-hover:text-slate-700"
                    : "text-[#555C63] group-hover:text-slate-200"
                }`}
              />
              <span className="truncate tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Officer Identity Workstation Area */}
      <div
        className={`mt-auto pt-3 border-t space-y-2 ${
          isLight ? "border-slate-200" : "border-[#20252A]"
        }`}
      >
        <div
          className={`px-2 text-[9px] font-mono uppercase tracking-wider flex items-center justify-between ${
            isLight ? "text-slate-400" : "text-[#555C63]"
          }`}
        >
          <span>WORKSTATION</span>
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            OPERATIONAL
          </span>
        </div>

        <div
          onClick={onOpenAdminModal}
          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-colors group ${
            isLight
              ? "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80 shadow-xs"
              : "bg-[#0A0D10] border-[#20252A] hover:border-[#384048] hover:bg-[#0E1216]"
          }`}
          title="Click to view officer credentials & case settings"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                isLight
                  ? "bg-red-100 border border-red-300 text-red-700"
                  : "bg-[#E21B23]/20 border border-[#E21B23]/40 text-[#FF3038]"
              }`}
            >
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "K"}
            </div>
            <div className="min-w-0 text-left">
              <div
                className={`text-xs font-bold truncate group-hover:text-[#E21B23] transition-colors ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                {user?.displayName || "Kartik"}
              </div>
              <div
                className={`text-[10px] font-mono truncate ${
                  isLight ? "text-slate-500" : "text-[#858B92]"
                }`}
              >
                {user?.role === "admin" ? "Master Admin" : "Investigator"} • {user?.badgeNumber || "IND-IO-26189"}
              </div>
            </div>
          </div>
          <ChevronRight
            className={`w-3.5 h-3.5 transition-colors shrink-0 ${
              isLight ? "text-slate-400 group-hover:text-slate-900" : "text-[#555C63] group-hover:text-white"
            }`}
          />
        </div>

        {/* Workstation Actions: Lock & Logout */}
        <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
          <button
            onClick={() => lockWorkstation()}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border transition-colors cursor-pointer ${
              isLight
                ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                : "bg-[#0E1216] border-[#20252A] text-zinc-400 hover:text-white hover:border-[#384048]"
            }`}
            title="Lock active workstation session"
          >
            <Lock className="w-3 h-3 text-[#E21B23]" />
            <span>Lock</span>
          </button>
          <button
            onClick={() => logout()}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border transition-colors cursor-pointer ${
              isLight
                ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-700"
                : "bg-[#0E1216] border-[#20252A] text-zinc-400 hover:text-white hover:border-[#384048]"
            }`}
            title="Sign out of workbench"
          >
            <LogOut className="w-3 h-3 text-slate-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

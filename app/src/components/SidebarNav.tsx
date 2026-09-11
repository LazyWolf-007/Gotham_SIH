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
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenAdminModal,
}) => {
  const { user, lockWorkstation, logout } = useAuth();

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
    <aside className="w-56 h-full flex flex-col justify-between bg-[#050607] border-r border-[#20252A] px-3 py-4 select-none shrink-0 z-30">
      {/* Top Navigation Items */}
      <div className="space-y-1">
        <div className="px-3 pb-2 text-[10px] font-mono tracking-widest text-[#555C63] uppercase font-bold">
          NAVIGATION
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group relative ${
                isActive
                  ? "text-white bg-[#E21B23]/15 border border-[#E21B23]/40 shadow-sm"
                  : "text-[#858B92] hover:text-white hover:bg-[#0E1216] border border-transparent"
              }`}
            >
              {/* Active left indicator */}
              {isActive && (
                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-3.5 bg-[#E21B23] rounded-full shadow-[0_0_8px_rgba(226,27,35,0.8)]" />
              )}
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? "text-[#FF3038]" : "text-[#555C63] group-hover:text-slate-200"
                }`}
              />
              <span className="truncate tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Officer Identity Workstation Area */}
      <div className="mt-auto pt-3 border-t border-[#20252A] space-y-2">
        <div className="px-2 text-[9px] font-mono text-[#555C63] uppercase tracking-wider flex items-center justify-between">
          <span>WORKSTATION</span>
          <span className="text-emerald-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            OPERATIONAL
          </span>
        </div>

        <div
          onClick={onOpenAdminModal}
          className="flex items-center justify-between p-2 rounded-xl bg-[#0A0D10] border border-[#20252A] hover:border-[#384048] cursor-pointer transition-colors group"
          title="Click to view officer credentials & case settings"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#E21B23]/20 border border-[#E21B23]/40 flex items-center justify-center text-xs font-bold text-[#FF3038] shadow-inner shrink-0">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "K"}
            </div>
            <div className="min-w-0 text-left">
              <div className="text-xs font-bold text-white truncate group-hover:text-[#FF3038] transition-colors">
                {user?.displayName || "Kartik"}
              </div>
              <div className="text-[10px] font-mono text-[#858B92] truncate">
                {user?.role === "admin" ? "Master Admin" : "Investigator"} • {user?.badgeNumber || "IND-IO-26189"}
              </div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#555C63] group-hover:text-white transition-colors shrink-0" />
        </div>

        {/* Workstation Actions: Lock & Logout */}
        <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
          <button
            onClick={() => lockWorkstation()}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#0E1216] border border-[#20252A] text-zinc-400 hover:text-white hover:border-[#384048] transition-colors cursor-pointer"
            title="Lock active workstation session"
          >
            <Lock className="w-3 h-3 text-[#FF3038]" />
            <span>Lock</span>
          </button>
          <button
            onClick={() => logout()}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#0E1216] border border-[#20252A] text-zinc-400 hover:text-red-400 hover:border-red-900/40 transition-colors cursor-pointer"
            title="Sign out of workstation"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

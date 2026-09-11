import React from "react";
import { RefreshCcw, Zap, Split, Building2 } from "lucide-react";

interface DetectedPatternsRowProps {
  activePattern: string | null;
  onSelectPattern: (patternId: string | null) => void;
}

export const DetectedPatternsRow: React.FC<DetectedPatternsRowProps> = ({
  activePattern,
  onSelectPattern,
}) => {
  const patterns = [
    {
      id: "hawala_cycle",
      title: "Hawala Cycle",
      subtitle: "1 high-confidence match",
      icon: RefreshCcw,
      badgeColor: "bg-red-950/50 border-red-800/60 text-red-400",
      activeColor: "border-red-500/80 bg-red-950/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]",
    },
    {
      id: "mule_burst",
      title: "Mule Burst",
      subtitle: "2 high-confidence matches",
      icon: Zap,
      badgeColor: "bg-blue-950/50 border-blue-800/60 text-blue-400",
      activeColor: "border-blue-500/80 bg-blue-950/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]",
    },
    {
      id: "accountant_betweenness",
      title: "Accountant Cut-point",
      subtitle: "1 key node identified",
      icon: Split,
      badgeColor: "bg-amber-950/50 border-amber-800/60 text-amber-400",
      activeColor: "border-amber-500/80 bg-amber-950/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]",
    },
    {
      id: "front_cluster",
      title: "Front Cluster",
      subtitle: "3 related organizations",
      icon: Building2,
      badgeColor: "bg-purple-950/50 border-purple-800/60 text-purple-400",
      activeColor: "border-purple-500/80 bg-purple-950/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    },
  ];

  return (
    <div className="w-full select-none">
      <div className="text-xs font-bold text-slate-300 tracking-wider mb-2.5 flex items-center gap-2">
        <span>Detected Patterns</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {patterns.map((p) => {
          const Icon = p.icon;
          const isSelected = activePattern === p.id;

          return (
            <div
              key={p.id}
              onClick={() => onSelectPattern(isSelected ? null : p.id)}
              className={`flex items-center gap-3 p-3 rounded-2xl border bg-[#0a0f1d]/90 hover:bg-[#0e1529] cursor-pointer transition-all duration-200 group ${
                isSelected
                  ? p.activeColor
                  : "border-slate-800/80 hover:border-slate-700 shadow-sm"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${p.badgeColor}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                  {p.title}
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {p.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

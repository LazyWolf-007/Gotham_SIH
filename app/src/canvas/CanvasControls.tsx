import React from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Tag,
  Share2,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
} from "lucide-react";

interface CanvasControlsProps {
  layoutName: string;
  onLayoutChange: (layout: string) => void;
  colorByCommunity: boolean;
  onToggleCommunity: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  onFit: () => void;
  onReset: () => void;
  onExportPng?: () => void;
  activePattern: string | null;
  onSelectPattern: (pat: string | null) => void;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  layoutName,
  onLayoutChange,
  colorByCommunity,
  onToggleCommunity,
  showLabels,
  onToggleLabels,
  onFit,
  onReset,
  activePattern,
  onSelectPattern,
}) => {
  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
      {/* Top Glass Control Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#0f172a]/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-xl">
        {/* Layout Selector */}
        <select
          value={layoutName}
          onChange={(e) => onLayoutChange(e.target.value)}
          className="bg-slate-900/80 border border-slate-700/70 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 font-medium outline-none focus:border-sky-500 cursor-pointer"
        >
          <option value="cose">Force Directed (CoSE)</option>
          <option value="concentric">Concentric Centrality</option>
          <option value="breadthfirst">Hierarchical Flow</option>
          <option value="circle">Circular Ring</option>
          <option value="grid">Orthogonal Grid</option>
        </select>

        <div className="w-[1px] h-5 bg-slate-700 mx-1" />

        {/* Community Partition Toggle */}
        <button
          onClick={onToggleCommunity}
          title="Toggle Community Louvain Partition"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            colorByCommunity
              ? "bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-sm"
              : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Communities</span>
        </button>

        {/* Labels Toggle */}
        <button
          onClick={onToggleLabels}
          title="Toggle Node Labels"
          className={`p-1.5 rounded-lg text-xs transition-all ${
            showLabels
              ? "bg-sky-600/30 text-sky-300 border border-sky-500/50"
              : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
        </button>

        {/* Reset & Fit */}
        <button
          onClick={onFit}
          title="Fit Canvas to Screen"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800 border border-transparent transition-all"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Pattern Quick Pills */}
      <div className="flex items-center gap-1 self-end p-1 bg-[#0f172a]/80 backdrop-blur-md border border-slate-800/80 rounded-lg text-[11px] shadow-lg">
        <span className="text-slate-500 px-1.5 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Patterns:
        </span>
        <button
          onClick={() => onSelectPattern(activePattern === "hawala_cycle" ? null : "hawala_cycle")}
          className={`px-2 py-0.5 rounded font-medium transition-all ${
            activePattern === "hawala_cycle"
              ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30"
              : "text-emerald-400 hover:bg-slate-800"
          }`}
        >
          Hawala Cycle
        </button>
        <button
          onClick={() => onSelectPattern(activePattern === "mule_burst" ? null : "mule_burst")}
          className={`px-2 py-0.5 rounded font-medium transition-all ${
            activePattern === "mule_burst"
              ? "bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/30"
              : "text-sky-400 hover:bg-slate-800"
          }`}
        >
          Mule Burst
        </button>
        <button
          onClick={() => onSelectPattern(activePattern === "accountant_cutpoint" ? null : "accountant_cutpoint")}
          className={`px-2 py-0.5 rounded font-medium transition-all ${
            activePattern === "accountant_cutpoint"
              ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30"
              : "text-amber-400 hover:bg-slate-800"
          }`}
        >
          Accountant Cut
        </button>
        {activePattern && (
          <button
            onClick={() => onSelectPattern(null)}
            className="text-rose-400 hover:text-rose-300 px-1.5 py-0.5 font-bold"
            title="Clear Pattern Overlay"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

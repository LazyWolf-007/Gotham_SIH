import React from "react";
import { FilterState, ObjectType, LinkType, OBJECT_TYPES, LINK_TYPES } from "../types";
import { OBJECT_TYPE_COLORS, LINK_TYPE_COLORS } from "../lib/theme";
import { Filter, DollarSign, PhoneCall, Search, RotateCcw } from "lucide-react";

interface FilterToolbarProps {
  filterState: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
  totalNodes: number;
  totalEdges: number;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filterState,
  onChange,
  onReset,
  totalNodes,
  totalEdges,
}) => {
  const toggleObjectType = (type: ObjectType) => {
    const next = new Set(filterState.selectedObjectTypes);
    if (next.has(type)) {
      if (next.size > 1) next.delete(type);
    } else {
      next.add(type);
    }
    onChange({ ...filterState, selectedObjectTypes: next });
  };

  const toggleLinkType = (type: LinkType) => {
    const next = new Set(filterState.selectedLinkTypes);
    if (next.has(type)) {
      if (next.size > 1) next.delete(type);
    } else {
      next.add(type);
    }
    onChange({ ...filterState, selectedLinkTypes: next });
  };

  const setCallsOnly = () => {
    onChange({
      ...filterState,
      selectedLinkTypes: new Set(["CALLED"]),
      selectedObjectTypes: new Set(["Person", "Phone"]),
    });
  };

  const setMoneyOnly = () => {
    onChange({
      ...filterState,
      selectedLinkTypes: new Set(["PAID"]),
      selectedObjectTypes: new Set(["Person", "Account", "Organization"]),
    });
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-3 p-2.5 bg-[#0b1120]/90 backdrop-blur-md border border-slate-800/90 rounded-2xl shadow-2xl text-xs">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Filter nodes by name / ID..."
          value={filterState.searchQuery}
          onChange={(e) => onChange({ ...filterState, searchQuery: e.target.value })}
          className="w-full pl-9 pr-3 py-1.5 bg-slate-900/90 border border-slate-700/70 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-sky-500 font-mono"
        />
        {filterState.searchQuery && (
          <button
            onClick={() => onChange({ ...filterState, searchQuery: "" })}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs font-bold"
          >
            ×
          </button>
        )}
      </div>

      {/* Quick Mode Filters */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={setCallsOnly}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
            filterState.selectedLinkTypes.size === 1 && filterState.selectedLinkTypes.has("CALLED")
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/50"
              : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
          <span>Calls Only</span>
        </button>

        <button
          onClick={setMoneyOnly}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
            filterState.selectedLinkTypes.size === 1 && filterState.selectedLinkTypes.has("PAID")
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
              : "bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>Money Only</span>
        </button>
      </div>

      {/* Object Type Chips */}
      <div className="hidden lg:flex items-center gap-1 bg-slate-900/70 p-1 rounded-xl border border-slate-800/80">
        {OBJECT_TYPES.map((t: ObjectType) => {
          const isSelected = filterState.selectedObjectTypes.has(t);
          const colorCfg = OBJECT_TYPE_COLORS[t];
          return (
            <button
              key={t}
              onClick={() => toggleObjectType(t)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                isSelected
                  ? "text-slate-100 shadow-sm"
                  : "text-slate-500 opacity-40 hover:opacity-80"
              }`}
              style={{
                backgroundColor: isSelected ? `${colorCfg.bg}25` : "transparent",
                border: isSelected ? `1px solid ${colorCfg.border}60` : "1px solid transparent",
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: colorCfg.bg }}
              />
              {t}
            </button>
          );
        })}
      </div>

      {/* Reset Filter Button */}
      <button
        onClick={onReset}
        title="Reset All Filters"
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-[11px] transition-all"
      >
        <RotateCcw className="w-3 h-3" />
        <span className="hidden sm:inline">Reset</span>
      </button>
    </div>
  );
};

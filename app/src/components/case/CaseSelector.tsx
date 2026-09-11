import React, { useState, useRef, useEffect } from "react";
import { useCase } from "../../context/CaseContext";
import { FolderGit2, ChevronDown, Check, ShieldAlert } from "lucide-react";

export const CaseSelector: React.FC = () => {
  const { activeCase, cases, selectCase } = useCase();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 hover:border-emerald-500/50 text-slate-200 text-xs font-mono transition-all shadow-inner"
      >
        <FolderGit2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="font-semibold text-emerald-300">{activeCase.id}:</span>
        <span className="truncate max-w-[140px] text-slate-100">{activeCase.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#0f172a] border border-slate-700/80 rounded-xl shadow-2xl z-50 p-2 overflow-hidden backdrop-blur-xl">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1 border-b border-slate-800 mb-1">
            <ShieldAlert className="w-3 h-3 text-emerald-400" />
            Active Investigation Cases
          </div>

          <div className="space-y-1">
            {cases.map((c) => {
              const isSelected = c.id === activeCase.id;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    selectCase(c.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg transition-all text-xs flex items-start gap-2.5 ${
                    isSelected
                      ? "bg-emerald-950/60 border border-emerald-500/30 text-emerald-200"
                      : "hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  <div className="mt-0.5">
                    {isSelected ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-bold flex items-center justify-between">
                      <span className={isSelected ? "text-emerald-300" : "text-white"}>{c.id}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400 font-normal">
                        {c.status}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-200 truncate">{c.name}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{c.agency}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

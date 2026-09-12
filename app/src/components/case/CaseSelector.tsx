import React, { useState, useRef, useEffect } from "react";
import { useCase } from "../../context/CaseContext";
import { FolderGit2, ChevronDown, Check, ShieldAlert } from "lucide-react";

export const CaseSelector: React.FC = () => {
  const { activeCase, cases, selectCase } = useCase();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLight =
    typeof document !== "undefined" && document.documentElement.classList.contains("light");

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
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer shadow-xs ${
          isLight
            ? "bg-slate-50 border-slate-300 hover:border-emerald-600 text-slate-800"
            : "bg-slate-900/90 border-slate-700 hover:border-emerald-500/50 text-slate-200"
        }`}
      >
        <FolderGit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="font-bold text-emerald-700 dark:text-emerald-300">{activeCase.id}:</span>
        <span className={`truncate max-w-[140px] font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
          {activeCase.name}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-1.5 w-72 rounded-xl shadow-2xl z-50 p-2 overflow-hidden backdrop-blur-xl border ${
            isLight
              ? "bg-white border-slate-200 text-slate-900"
              : "bg-[#0f172a] border-slate-700/80 text-white"
          }`}
        >
          <div
            className={`text-[10px] font-mono uppercase tracking-wider px-2 py-1 flex items-center gap-1 border-b mb-1 ${
              isLight ? "text-slate-500 border-slate-200" : "text-slate-400 border-slate-800"
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Active Investigation Cases</span>
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
                  className={`w-full text-left p-2 rounded-lg transition-all text-xs flex items-start gap-2.5 cursor-pointer ${
                    isSelected
                      ? isLight
                        ? "bg-emerald-50 border border-emerald-300 text-emerald-950"
                        : "bg-emerald-950/60 border border-emerald-500/30 text-emerald-200"
                      : isLight
                      ? "hover:bg-slate-100 text-slate-700"
                      : "hover:bg-slate-800 text-slate-300"
                  }`}
                >
                  <div className="mt-0.5">
                    {isSelected ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <div
                        className={`w-4 h-4 rounded-full border ${
                          isLight ? "border-slate-300 bg-slate-50" : "border-slate-600"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-bold flex items-center justify-between">
                      <span className={isSelected ? "text-emerald-700 dark:text-emerald-300" : isLight ? "text-slate-900" : "text-white"}>
                        {c.id}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded uppercase border font-normal ${
                          isLight
                            ? "bg-slate-100 border-slate-200 text-slate-600"
                            : "bg-slate-800 border-slate-700 text-slate-400"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div className={`font-semibold truncate ${isLight ? "text-slate-900" : "text-slate-200"}`}>
                      {c.name}
                    </div>
                    <div className={`text-[10px] truncate mt-0.5 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                      {c.agency}
                    </div>
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

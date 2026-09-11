import React from "react";
import { Shield, Github, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#05080f] border-t border-slate-800/80 py-10 px-4 lg:px-8 text-slate-500 text-xs select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-slate-300">Gotham_SIH (SIH26189)</span>
          <span>•</span>
          <span className="font-mono text-slate-400">Operation Grey Ledger</span>
        </div>

        <div className="text-center font-mono text-[11px] text-slate-500">
          Synthetic Case Study (NCRB / MHA Criminal Network Analysis) • No Living Persons Named
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span className="font-mono text-[10px] bg-slate-900 px-2 py-1 rounded border border-slate-800">
            NetworkX 3.6 • Cytoscape.js • Vite
          </span>
        </div>
      </div>
    </footer>
  );
}

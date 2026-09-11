import React from "react";
import { Shield, ArrowRight, Sparkles, Terminal, Layers } from "lucide-react";

export default function CallToAction({ onLaunchWorkbench }: { onLaunchWorkbench: () => void }) {
  return (
    <section className="py-20 bg-gradient-to-b from-[#090d16] to-[#070b13] border-t border-slate-800/80 text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 lg:px-8 space-y-6 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-sky-400 text-xs font-mono font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ZERO HARDCODING • PURE GRAPH INTELLIGENCE</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
          Ready to Explore <br />
          <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Operation Grey Ledger?
          </span>
        </h2>

        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Open the full Palantir-lite investigation workbench with Cytoscape canvas, dossier inspector, operational timeline, and graph-local copilot.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onLaunchWorkbench}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-2xl text-sm shadow-2xl shadow-sky-500/30 transition-all cursor-pointer group"
          >
            <Shield className="w-4 h-4" />
            <span>Launch Investigation Workbench</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}

import React from "react";
import DecryptedText from "./DecryptedText";
import LanyardWithControls from "./lanyard-with-controls";
import { ArrowRight, ShieldCheck, Cpu, Database, Activity, Sparkles, Terminal } from "lucide-react";

interface HeroSectionProps {
  onLaunchWorkbench: () => void;
}

export default function HeroSection({ onLaunchWorkbench }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
      {/* Background Subtle Gradient Lights */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Hero Text & Call to Actions */}
          <div className="space-y-6 text-center lg:text-left">
            {/* Top Decrypted Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-300 text-xs shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <DecryptedText
                text="NCRB / MHA SYNTHETIC CASE STUDY — OP GREY LEDGER"
                speed={35}
                className="font-mono text-slate-300 font-semibold text-[11px]"
              />
            </div>

            {/* Main Title */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-slate-100 tracking-tight leading-tight">
                Palantir-Lite <br />
                <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  Investigation Workbench
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
              <strong className="text-slate-200">Graph is the brain. LLM is a mouth.</strong>{" "}
              Uncover complex multi-hop hawala cycles, mule call bursts, and financial cut-points with deterministic in-memory graph algorithms and graph-local RAG.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={onLaunchWorkbench}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-sm shadow-xl shadow-sky-500/25 transition-all cursor-pointer group"
              >
                <span>Enter Investigation Workbench</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#innovations"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100 font-medium rounded-xl text-sm border border-slate-800 transition-all"
              >
                <Terminal className="w-4 h-4 text-sky-400" />
                <span>Explore 4 Innovations</span>
              </a>
            </div>

            {/* Key Invariant Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-800/80 text-left">
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                <div className="text-sky-400 font-mono font-bold text-lg">8 Types</div>
                <div className="text-[11px] text-slate-400">Frozen Link Ontology</div>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                <div className="text-emerald-400 font-mono font-bold text-lg">100% Pass</div>
                <div className="text-[11px] text-slate-400">Gold Gate Invariants</div>
              </div>
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
                <div className="text-purple-400 font-mono font-bold text-lg">2-Hop</div>
                <div className="text-[11px] text-slate-400">Bounded Copilot RAG</div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Physics Lanyard Card */}
          <div className="relative w-full h-[540px] lg:h-[620px] rounded-3xl bg-slate-950/60 border border-slate-800/80 shadow-2xl flex items-center justify-center overflow-hidden">
            <div className="absolute top-3 left-4 z-20 flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>OFFICIAL CLEARANCE PASS (3D INTERACTIVE)</span>
            </div>

            <LanyardWithControls
              position={[0, 0, 19]}
              containerClassName="w-full h-full"
              defaultName="AGENT GOTHAM"
              onLaunchWorkbench={onLaunchWorkbench}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

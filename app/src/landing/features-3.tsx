import React from "react";
import {
  Layers,
  Scissors,
  FileCode,
  Bot,
  ShieldAlert,
  ArrowUpRight,
  Database,
  Search,
  Zap,
} from "lucide-react";

export default function Features3({ onLaunchWorkbench }: { onLaunchWorkbench: () => void }) {
  return (
    <section id="innovations" className="py-20 bg-[#070b13] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950/60 border border-sky-800/60 text-sky-400 text-xs font-mono font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>SIH26189 PRODUCT INNOVATIONS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight">
            The 4 Core Architectural Pillars
          </h2>
          <p className="text-slate-400 text-sm">
            Strict laws built directly into code, not just slide presentations.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1 */}
          <div className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 hover:border-sky-500/40 rounded-3xl p-6 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono text-sky-400 font-bold mb-1">INNOVATION #1</div>
              <h3 className="text-lg font-bold text-slate-100">
                Strict 8-Link Typed Ontology & Provenance
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Link types are frozen at 8: <code className="text-sky-300">CALLED</code>, <code className="text-emerald-300">PAID</code>, <code className="text-amber-300">OWNS</code>, <code className="text-indigo-300">USES</code>, <code className="text-purple-300">SEEN_AT</code>, <code className="text-violet-300">MEMBER_OF</code>, <code className="text-rose-300">MENTIONED_IN</code>, <code className="text-teal-300">SAME_AS</code>. Every single edge carries immutable provenance metadata: <span className="font-mono text-slate-300">{`{source_type, source_id, snippet}`}</span>.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-slate-500">
              <span>Zero drift law</span>
              <span>•</span>
              <span>No ASSOCIATED links</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 rounded-3xl p-6 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono text-amber-400 font-bold mb-1">INNOVATION #2</div>
              <h3 className="text-lg font-bold text-slate-100">
                Counterfactual Arrest Simulation (<code className="text-amber-300 font-mono text-sm">engine/cut.py</code>)
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              In-memory graph surgery simulates the arrest of network bottlenecks (e.g. Naveen Bhatia). Cuts the primary financial conduit without touching disk storage, exposing surviving fallback bridges like <code className="text-amber-300">phone:ph02 ↔ phone:ph03</code>.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-slate-500">
              <span>Non-destructive overlay</span>
              <span>•</span>
              <span>Residual BFS analysis</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 rounded-3xl p-6 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono text-emerald-400 font-bold mb-1">INNOVATION #3</div>
              <h3 className="text-lg font-bold text-slate-100">
                Declarative DSL Pattern Engine (<code className="text-emerald-300 font-mono text-sm">pattern.dsl.yaml</code>)
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complex criminal patterns (Hawala cycles, mule call bursts, accountant cutpoints, front corporate clusters) are defined declaratively in YAML and evaluated in <code className="text-emerald-300">engine/patterns.py</code>, completely eliminating hardcoded UI conditionals.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-slate-500">
              <span>4 DSL patterns</span>
              <span>•</span>
              <span>Deterministic matching</span>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 rounded-3xl p-6 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono text-purple-400 font-bold mb-1">INNOVATION #4</div>
              <h3 className="text-lg font-bold text-slate-100">
                Graph-Local 2-Hop Bounded Copilot RAG (<code className="text-purple-300 font-mono text-sm">engine/rag.py</code>)
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Seed entity extraction strictly bounded to &le; 40 nodes and top 5 provenance snippets. Anti-hallucination law prohibits LLM from naming unextracted entities, and returns interactive citation badges that highlight live on the canvas.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-slate-500">
              <span>Offline deterministic fallback</span>
              <span>•</span>
              <span>Interactive citation pins</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

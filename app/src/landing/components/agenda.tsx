import { TextEffect } from "@/components/motion-primitives/text-effect";
import React from "react";
import { transitionVariants } from "@/lib/utils";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";
import { Clock, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function Agenda() {
  return (
    <section id="use-cases" className="py-20 md:py-32 bg-transparent text-white border-t border-zinc-900/60">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-y-12 lg:grid-cols-[1fr_1.2fr] items-start">
          <div className="text-center lg:text-left space-y-4">
            <p className="font-mono text-xs font-semibold tracking-[0.25em] text-red-500 uppercase">
              CASE TIMELINE
            </p>
            <TextEffect
              triggerOnView
              preset="fade-in-blur"
              speedSegment={0.3}
              as="h2"
              className="text-3xl md:text-5xl font-bold tracking-tight text-white"
            >
              Operation Grey Ledger Phases
            </TextEffect>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-md">
              From the initial FIR filings to cross-border Hawala ring disruption and targeted kingpin interdiction.
            </p>
          </div>

          <AnimatedGroup
            triggerOnView
            variants={{
              container: {
                visible: {
                  transition: {
                    staggerChildren: 0.08,
                    delayChildren: 0.3,
                  },
                },
              },
              ...transitionVariants,
            }}
            className="space-y-6"
          >
            {/* Phase 1 */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/90 relative pl-8 border-l-4 border-l-red-500">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="font-mono text-xs text-red-400 font-bold">PHASE 01 // INGESTION</span>
                <span className="text-xs text-zinc-500 font-mono">60 FIRs + 3,000 CDRs</span>
              </div>
              <h3 className="text-base font-bold text-white mb-1">Entity Extraction & Provenance</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Automated parsing of multi-jurisdictional police reports, cell tower handoffs, and suspicious transaction logs into typed graph links.
              </p>
            </div>

            {/* Phase 2 */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/90 relative pl-8 border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="font-mono text-xs text-amber-400 font-bold">PHASE 02 // PATTERN DETECTION</span>
                <span className="text-xs text-zinc-500 font-mono">DSL Engine</span>
              </div>
              <h3 className="text-base font-bold text-white mb-1">Nexus Node Identification</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Uncovering the intermediary accountant Naveen Bhatia connecting separate criminal cells via betweenness centrality analysis.
              </p>
            </div>

            {/* Phase 3 */}
            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/90 relative pl-8 border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="font-mono text-xs text-emerald-400 font-bold">PHASE 03 // ACTION & REMEDIATION</span>
                <span className="text-xs text-zinc-500 font-mono">Residual Path Check</span>
              </div>
              <h3 className="text-base font-bold text-white mb-1">Counterfactual Raid Planning</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Pre-operation simulation verifying all secondary phone channels (ph02, ph03) are neutralized to prevent syndicate reconstitution.
              </p>
            </div>
          </AnimatedGroup>
        </div>
      </div>
    </section>
  );
}

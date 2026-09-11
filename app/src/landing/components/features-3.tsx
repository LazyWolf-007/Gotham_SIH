import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { GitFork, ShieldAlert, Cpu, Eye, Network, FileSearch } from 'lucide-react';
import React, { ReactNode } from 'react';
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { transitionVariants } from "@/lib/utils";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-32 bg-transparent text-white relative">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <p className="font-mono text-xs font-semibold tracking-[0.25em] text-red-500 uppercase">
            CORE CAPABILITIES
          </p>
          <TextEffect
            triggerOnView
            preset="fade-in-blur"
            speedSegment={0.3}
            as="h2"
            className="text-balance text-3xl md:text-5xl font-bold tracking-tight text-white"
          >
            Tactical Intelligence for Complex Syndicates
          </TextEffect>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            Engineered specifically for law enforcement officers, investigators, and intelligence analysts to uncover hidden criminal structures.
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
          className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Feature 1 */}
          <div className="group relative p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-red-500/50 transition-all hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400 mb-6 group-hover:scale-110 transition-transform">
                <Network className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Hawala Flow Cycles</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Graph-local cycle detection isolating circular layered transactions across mule accounts (<code>acc:a02 → acc:a03 → acc:a08 → acc:a09 → acc:a02</code>).
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 font-mono text-xs text-red-400">
              PATTERN DSL: HAWALA_CYCLE
            </div>
          </div>

          {/* Feature 2 */}
          <div className="group relative p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-red-500/50 transition-all hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400 mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Key Bridge Accountant</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Betweenness centrality filtering isolating hidden nexus nodes like Naveen Bhatia (low degree, high bridge rank) holding cross-community logistics.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 font-mono text-xs text-red-400">
              PATTERN DSL: ACCOUNTANT_BETWEENNESS
            </div>
          </div>

          {/* Feature 3 */}
          <div className="group relative p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800 hover:border-red-500/50 transition-all hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-400 mb-6 group-hover:scale-110 transition-transform">
                <GitFork className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Counterfactual Arrest Sim</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Simulate node removals before raids to verify whether network connectivity severs or fallback channels persist (e.g. ph02 / ph03).
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-zinc-800/80 font-mono text-xs text-red-400">
              CUT ENGINE: RESIDUAL_PATH
            </div>
          </div>
        </AnimatedGroup>
      </div>
    </section>
  );
}

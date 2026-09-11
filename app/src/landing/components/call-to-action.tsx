import { ArrowRight, Shield, Terminal } from 'lucide-react';
import { TextEffect } from "./motion-primitives/text-effect";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";
import { transitionVariants } from "@/lib/utils";

interface CallToActionProps {
  onLaunchWorkbench?: () => void;
}

export default function CallToAction({ onLaunchWorkbench }: CallToActionProps) {
  const handleLaunch = () => {
    if (onLaunchWorkbench) {
      onLaunchWorkbench();
    } else {
      window.dispatchEvent(new CustomEvent('navigate-workbench'));
    }
  };

  return (
    <section id="impact" className="py-20 bg-black text-white relative">
      <div className="mx-auto max-w-5xl rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-black px-6 py-16 md:py-24 text-center relative overflow-hidden shadow-2xl">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-red-400 font-mono text-xs">
            <Terminal className="w-3.5 h-3.5" /> READY FOR DEPLOYMENT
          </div>

          <TextEffect
            triggerOnView
            preset="fade-in-blur"
            speedSegment={0.3}
            as="h2"
            className="text-balance text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight"
          >
            Access the Live Investigation Desk
          </TextEffect>

          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            Explore the complete 259-node knowledge graph, run graph-local copilot queries, filter Hawala transaction cycles, and simulate tactical warrants.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <button
              onClick={handleLaunch}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-xl shadow-red-600/30 hover:shadow-red-600/50 transition-all cursor-pointer transform hover:scale-[1.02]"
            >
              <span>Launch JAAL Workbench</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

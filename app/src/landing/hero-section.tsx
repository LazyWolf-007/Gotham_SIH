import React from "react";
import DecryptedText from "./DecryptedText";
import LanyardWithControls from "./lanyard-with-controls";
import { ArrowRight, Terminal } from "lucide-react";

interface HeroSectionProps {
  onLaunchWorkbench: () => void;
}

export default function HeroSection({ onLaunchWorkbench }: HeroSectionProps) {
  return (
    <section id="home" className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 bg-[#050607]">
      {/* Background Subtle Red Ambience */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#E21B23]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Hero Text & Call to Actions */}
          <div className="space-y-6 text-center lg:text-left">
            {/* Top Decrypted Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E1216] border border-[#20252A] text-[#858B92] text-xs shadow-inner">
              <span className="w-2 h-2 rounded-full bg-[#E21B23] animate-pulse" />
              <DecryptedText
                text="NCRB / MHA SYNTHETIC CASE STUDY — OP GREY LEDGER"
                speed={35}
                className="font-mono text-slate-300 font-semibold text-[11px]"
              />
            </div>

            {/* Main Title */}
            <div className="space-y-2">
              <div className="text-xs font-mono tracking-[0.25em] text-[#FF3038] uppercase font-bold">
                JAAL • OPERATION GREY LEDGER
              </div>
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-white tracking-tight leading-tight uppercase font-sans">
                TURN FRAGMENTS <br />
                <span className="text-[#FF3038]">
                  INTO TRUTH.
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p className="text-[#858B92] text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 font-sans">
              A graph-powered intelligence platform for complex criminal investigations.
              Uncover hidden financial routing cycles, telecommunication call bursts, and structural cut-points with deterministic in-memory graph algorithms and graph-local RAG.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={onLaunchWorkbench}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#E21B23] hover:bg-[#FF3038] text-white font-bold rounded-xl text-sm shadow-xl shadow-[#E21B23]/25 transition-all cursor-pointer group font-mono"
              >
                <span>ENTER INVESTIGATION DESK</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#features"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-[#0E1216] hover:bg-[#20252A] text-slate-300 hover:text-white font-medium rounded-xl text-sm border border-[#20252A] transition-all font-mono"
              >
                <Terminal className="w-4 h-4 text-[#858B92]" />
                <span>VIEW CAPABILITIES</span>
              </a>
            </div>

            {/* Restrained System Statistics Sourced from Actual Data */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#20252A] text-left">
              <div className="bg-[#0A0D10] p-3 rounded-xl border border-[#20252A]">
                <div className="text-white font-mono font-bold text-lg">80</div>
                <div className="text-[11px] text-[#858B92] font-mono">Persons Identified</div>
              </div>

              <div className="bg-[#0A0D10] p-3 rounded-xl border border-[#20252A]">
                <div className="text-white font-mono font-bold text-lg">40</div>
                <div className="text-[11px] text-[#858B92] font-mono">Phones Tracked</div>
              </div>

              <div className="bg-[#0A0D10] p-3 rounded-xl border border-[#20252A]">
                <div className="text-emerald-400 font-mono font-bold text-lg">30</div>
                <div className="text-[11px] text-[#858B92] font-mono">Bank Accounts</div>
              </div>

              <div className="bg-[#0A0D10] p-3 rounded-xl border border-[#20252A]">
                <div className="text-[#FF3038] font-mono font-bold text-lg">60</div>
                <div className="text-[11px] text-[#858B92] font-mono">FIR Filings</div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Interactive Lanyard ID Badge */}
          <div className="flex items-center justify-center relative min-h-[480px] lg:min-h-[580px]">
            <LanyardWithControls onLaunchWorkbench={onLaunchWorkbench} />
          </div>
        </div>
      </div>
    </section>
  );
}

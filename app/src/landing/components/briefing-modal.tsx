import React from "react";
import { X, Play, ShieldAlert, Cpu, Activity, Database, Users, ArrowRight } from "lucide-react";

interface BriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchWorkbench: () => void;
}

export const BriefingModal: React.FC<BriefingModalProps> = ({ isOpen, onClose, onLaunchWorkbench }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-mono text-xs font-bold text-red-400 tracking-wider uppercase">
              TOP SECRET // TACTICAL INTELLIGENCE BRIEFING
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-zinc-800 bg-black flex flex-col items-center justify-center group">
            <img
              src="/jaal-bg.jpg"
              alt="Tactical Surveillance Grid"
              className="absolute inset-0 w-full h-full object-cover opacity-50 filter saturate-150 contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            
            {/* Scanlines Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none opacity-60" />

            {/* Tactical HUD overlays */}
            <div className="absolute top-4 left-4 font-mono text-[11px] text-red-400/90 space-y-1 bg-black/60 p-2 rounded border border-red-900/40">
              <div>CASE: OP-GREY-LEDGER</div>
              <div>TARGET: HALEJA SYNDICATE</div>
              <div>STATUS: CRITICAL THREAT</div>
            </div>

            <div className="absolute bottom-4 right-4 font-mono text-[11px] text-cyan-400/90 bg-black/60 p-2 rounded border border-cyan-900/40">
              <div>259 NODES // 3,927 EDGES</div>
              <div>HAWALA CYCLE DETECTED</div>
            </div>

            {/* Play Button Simulation */}
            <div className="relative z-10 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-red-600/90 text-white flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.7)] group-hover:scale-110 transition-transform cursor-pointer">
                <Play className="w-8 h-8 fill-white translate-x-0.5" />
              </div>
              <div className="font-mono text-sm text-zinc-200 font-bold tracking-wide">
                OPERATIONAL OVERVIEW (03:45)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-bold">
                <ShieldAlert className="w-4 h-4" /> 01. THE SYNDICATE
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Unifying 60 FIRs, 3,000 CDR logs, and 800 Hawala transactions into a single deterministic knowledge graph.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold">
                <Cpu className="w-4 h-4" /> 02. PATTERN DSL
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Detects the hidden accountant Naveen Bhatia (high betweenness, low degree) and Hawala laundering cycles automatically.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
                <Activity className="w-4 h-4" /> 03. ARREST SIMULATION
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Simulate removing any kingpin or node to calculate residual paths before warrant execution.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-500">
            CONFIDENTIAL // LAW ENFORCEMENT & INTELLIGENCE ACCESS ONLY
          </span>
          <button
            onClick={() => {
              onClose();
              onLaunchWorkbench();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer"
          >
            <span>Launch Live Desk</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

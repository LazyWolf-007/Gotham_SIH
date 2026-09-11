import React from "react";
import { AshokaEmblem } from "./icons/ashoka-emblem";
import { Shield, Lock } from "lucide-react";

export default function FooterSection() {
  return (
    <footer id="team" className="py-16 bg-black border-t border-zinc-900 text-white">
      <div className="mx-auto max-w-6xl px-6 flex flex-col items-center text-center space-y-6">
        <div className="flex items-center gap-3">
          <img
            src="/jaal-emblem.png"
            alt="JAAL Logo"
            className="w-7 h-9 object-contain"
          />
          <div className="text-left">
            <span className="font-serif font-black text-xl tracking-wider text-white">JAAL</span>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              OPERATION GREY LEDGER // SIH26189
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-xs text-zinc-400 font-mono">
          <span>MINISTRY OF HOME AFFAIRS (MHA)</span>
          <span>•</span>
          <span>NATIONAL CRIME RECORDS BUREAU (NCRB)</span>
          <span>•</span>
          <span>SMART INDIA HACKATHON 2024-2026</span>
        </div>

        <p className="text-xs text-zinc-500 max-w-xl leading-relaxed font-sans">
          A Palantir-lite tactical criminal network intelligence workbench powered by deterministic graph analytics, pattern DSL matching, and graph-local copilot RAG.
        </p>

        <div className="pt-4 text-[11px] font-mono text-zinc-600 flex items-center gap-2">
          <Lock className="w-3 h-3 text-red-500" />
          <span>SYNTHETIC CASE STUDY // LAW ENFORCEMENT INTELLIGENCE DEMO</span>
        </div>
      </div>
    </footer>
  );
}

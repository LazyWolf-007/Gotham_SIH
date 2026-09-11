import React from "react";
import { Clock, AlertTriangle, FileWarning, Shield, CheckCircle2, ArrowRight } from "lucide-react";

export default function Agenda({ onLaunchWorkbench }: { onLaunchWorkbench: () => void }) {
  const milestones = [
    {
      time: "Phase 1: Procurement",
      title: "Mandi Skimming Operations",
      location: "Azadpur Sabzi Mandi, Delhi",
      desc: "Unregulated produce collections orchestrated by Imtiaz Qureshi (Qadir Cold Store) and Rakesh Mundhe (Panchsheel Spices).",
      tag: "INBOUND FLOW",
      tagColor: "bg-red-950/60 text-red-400 border-red-800/60",
    },
    {
      time: "Phase 2: Split-Ledger",
      title: "Accountant Laundering Bridge",
      location: "Bhatia Associates, NCR",
      desc: "Naveen Bhatia manages inbound account acc:a00 and distributes laundered tranches through outbound account acc:a01 to insulated mule accounts.",
      tag: "BOTTLENECK CUT-POINT",
      tagColor: "bg-amber-950/60 text-amber-400 border-amber-800/60",
    },
    {
      time: "Phase 3: Layering",
      title: "Circular Hawala Cycle",
      location: "Multi-Bank Mule Accounts",
      desc: "Directed 4-hop circular PAID ring among accounts acc:a02 → acc:a03 → acc:a08 → acc:a09 → acc:a02 to create synthetic commercial transactions.",
      tag: "DSL PATTERN HIT",
      tagColor: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
    },
    {
      time: "12 April 2026",
      title: "Trigger Event: FIR-2026-014 Registered",
      location: "Azadpur Police Station",
      desc: "Formal police complaint filed for cheating and GST fabrication, triggering panic communication across syndicate channels.",
      tag: "CRITICAL TRIGGER",
      tagColor: "bg-rose-950/60 text-rose-400 border-rose-800/60",
    },
    {
      time: "12-14 April 2026",
      title: "Mule CDR Call Spike (141 Calls)",
      location: "Burner Handset (phone:ph03)",
      desc: "Farhan Lodhi's burner phone receives 141 calls within 48h of the FIR filing (vs 34 calls baseline), uncovering covert panic links.",
      tag: "CDR ANOMALY",
      tagColor: "bg-sky-950/60 text-sky-400 border-sky-800/60",
    },
  ];

  return (
    <section id="timeline" className="py-20 bg-[#090d16] border-t border-slate-800/80">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono font-semibold">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>CASE BIBLE CHRONOLOGY</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight">
            Operation Grey Ledger Timeline
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Chronological progression of criminal conduct, triggers, and intelligence artifacts.
          </p>
        </div>

        {/* Timeline Items */}
        <div className="relative border-l-2 border-slate-800 ml-4 sm:ml-32 space-y-8 pl-6 sm:pl-8">
          {milestones.map((m, idx) => (
            <div key={idx} className="relative group">
              {/* Bullet Node */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-[#090d16] border-2 border-sky-500 group-hover:bg-sky-400 group-hover:scale-125 transition-all" />

              {/* Time Label for larger screens */}
              <div className="hidden sm:block absolute -left-36 top-1.5 text-right w-28 font-mono text-[11px] font-bold text-slate-400">
                {m.time}
              </div>

              {/* Card */}
              <div className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 space-y-2 transition-all shadow-md">
                <div className="sm:hidden font-mono text-[11px] font-bold text-sky-400">
                  {m.time}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-100">{m.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${m.tagColor}`}>
                    {m.tag}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-400">{m.location}</div>
                <p className="text-xs text-slate-300 leading-relaxed pt-1">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-6">
          <button
            onClick={onLaunchWorkbench}
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
          >
            <span>Analyze Timeline in Interactive Workbench</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

import React from "react";
import {
  Sparkles,
  Layers,
  Search,
  Repeat,
  Scissors,
  Bot,
  ChevronRight,
  CheckCircle,
  PlayCircle,
  Info,
} from "lucide-react";

export interface DemoStep {
  id: number;
  title: string;
  shortName: string;
  icon: any;
  badge: string;
  summary: string;
  actionDesc: string;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    title: "Step 1: Total Hairball View",
    shortName: "1. Hairball",
    icon: PlayCircle,
    badge: "80 Persons | 40 Phones | 30 Accounts | 3.8k Links",
    summary:
      "Inspect the unpartitioned complex network comprising agricultural mandi collections, shell corporations, burner handsets, and mule accounts.",
    actionDesc: "Reset all filters and view full force-directed graph canvas.",
  },
  {
    id: 2,
    title: "Step 2: Louvain Community Partition",
    shortName: "2. Communities",
    icon: Layers,
    badge: "Mandi vs Front Clusters",
    summary:
      "Apply Louvain community detection to segment the graph into operational clusters: Azadpur Mandi skimmers vs NCR shell company front entities.",
    actionDesc: "Color and group nodes by modularity communities.",
  },
  {
    id: 3,
    title: "Step 3: Accountant Identification (Top Betweenness)",
    shortName: "3. Accountant Cut-point",
    icon: Search,
    badge: "Rank #1 Betweenness (0.0255) | Low Degree (6)",
    summary:
      "Filter by betweenness centrality to isolate Naveen Bhatia (Bhatia Associates), who acts as the primary money laundering bridge between inbound mandi funds and outbound mule accounts.",
    actionDesc: "Focus on person:naveen_bhatia and highlight high-centrality cut-points.",
  },
  {
    id: 4,
    title: "Step 4: Hawala PAID Cycle Discovery",
    shortName: "4. Hawala Loop",
    icon: Repeat,
    badge: "4-Hop Directed Loop (acc:a02 → a03 → a08 → a09 → a02)",
    summary:
      "DSL pattern engine matches a circular PAID transaction loop among mule bank accounts designed to create synthetic layering and obfuscate audit trails.",
    actionDesc: "Highlight 4-node circular PAID loop in pulsing emerald rings.",
  },
  {
    id: 5,
    title: "Step 5: Counterfactual Arrest Simulation",
    shortName: "5. Arrest Simulation",
    icon: Scissors,
    badge: "Cuts Financial Conduit | Exposes ph02 ↔ ph03 Phone Fallback",
    summary:
      "Execute engine/cut.py on Naveen Bhatia. In-memory surgery cuts the direct financial pipeline, but immediately reveals the secondary covert liaison channel via phone:ph02 (Mundhe) & phone:ph03 (Lodhi).",
    actionDesc: "Simulate arrest on Naveen Bhatia and render surviving residual bridge.",
  },
  {
    id: 6,
    title: "Step 6: Graph-Local Copilot RAG Synthesis",
    shortName: "6. Copilot RAG",
    icon: Bot,
    badge: "Strict 2-Hop Bounded | Anti-Hallucination Verified",
    summary:
      "Query Copilot on seed entities. Every finding is strictly bounded to the 2-hop neighborhood with interactive citation pins that zoom on canvas.",
    actionDesc: "Open Copilot panel with active seed entity briefing.",
  },
];

interface DemoScriptTourProps {
  currentStep: number;
  onSelectStep: (stepId: number) => void;
}

export const DemoScriptTour: React.FC<DemoScriptTourProps> = ({
  currentStep,
  onSelectStep,
}) => {
  const active = DEMO_STEPS.find((s) => s.id === currentStep) || DEMO_STEPS[0];

  return (
    <div className="bg-[#0b1120] border-b border-slate-800 p-2 text-xs select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Step Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Sacred Demo:
          </span>

          {DEMO_STEPS.map((step) => {
            const Icon = step.icon;
            const isSelected = currentStep === step.id;

            return (
              <button
                key={step.id}
                onClick={() => onSelectStep(step.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25"
                    : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{step.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Step Info Box */}
        <div className="flex items-center gap-2 text-[11px] bg-slate-900/90 border border-slate-800/80 px-3 py-1 rounded-xl">
          <span className="text-sky-400 font-bold">{active.badge}</span>
          <span className="text-slate-500 hidden md:inline">|</span>
          <span className="text-slate-300 hidden md:inline truncate max-w-md">{active.summary}</span>
        </div>
      </div>
    </div>
  );
};

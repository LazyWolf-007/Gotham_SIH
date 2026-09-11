import React from "react";
import { GraphNode, GraphEdge, PatternHit } from "../types";
import { OBJECT_TYPE_COLORS, LINK_TYPE_COLORS } from "../lib/theme";
import {
  ShieldAlert,
  User,
  Phone,
  CreditCard,
  Building2,
  FileWarning,
  MapPin,
  Camera,
  Car,
  Activity,
  Layers,
  Scissors,
  Bot,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface DossierPanelProps {
  node: GraphNode | null;
  selectedEdge: GraphEdge | null;
  incidentEdges: GraphEdge[];
  onSelectNeighbor: (nodeId: string) => void;
  onIsolateNeighborhood: (seedId: string) => void;
  onRunArrestSimulation: (targetId: string) => void;
  onAskCopilot: (seedId: string) => void;
  patterns: PatternHit[];
}

export const DossierPanel: React.FC<DossierPanelProps> = ({
  node,
  selectedEdge,
  incidentEdges,
  onSelectNeighbor,
  onIsolateNeighborhood,
  onRunArrestSimulation,
  onAskCopilot,
  patterns,
}) => {
  if (!node && !selectedEdge) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-[#090d16]/90 select-none">
        <ShieldAlert className="w-12 h-12 mb-3 text-slate-700 stroke-[1.5]" />
        <h3 className="text-sm font-semibold text-slate-300">No Target Selected</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Click any node or transaction on the canvas or timeline to inspect its intelligence dossier and provenance.
        </p>
      </div>
    );
  }

  // Edge Dossier View
  if (selectedEdge && !node) {
    const linkCfg = LINK_TYPE_COLORS[selectedEdge.type] || { color: "#64748b" };
    return (
      <div className="h-full flex flex-col overflow-y-auto bg-[#090d16]/95 border-l border-slate-800 text-slate-200 text-xs p-4 space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-mono"
              style={{ backgroundColor: `${linkCfg.color}25`, color: linkCfg.color }}
            >
              LINK: {selectedEdge.type}
            </span>
          </div>
          <div className="text-sm font-bold text-slate-100 font-mono mt-2">
            <span
              className="text-sky-400 cursor-pointer hover:underline"
              onClick={() => onSelectNeighbor(selectedEdge.source)}
            >
              {selectedEdge.source}
            </span>{" "}
            &rarr;{" "}
            <span
              className="text-sky-400 cursor-pointer hover:underline"
              onClick={() => onSelectNeighbor(selectedEdge.target)}
            >
              {selectedEdge.target}
            </span>
          </div>
        </div>

        {/* Provenance Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-slate-400">Provenance Evidence</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-400 font-mono text-[10px]">
              {selectedEdge.attributes?.source_type || "RECORD"}
            </span>
          </div>
          <div className="text-slate-400 font-mono text-[10px]">
            Source ID: <span className="text-slate-200">{selectedEdge.attributes?.source_id || "N/A"}</span>
          </div>
          {selectedEdge.attributes?.snippet && (
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 text-slate-300 italic text-[11px] leading-relaxed">
              "{selectedEdge.attributes.snippet}"
            </div>
          )}
        </div>

        {/* Edge Attributes */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
          <span className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider block">
            Edge Attributes
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {selectedEdge.attributes?.amount_inr !== undefined && (
              <div className="bg-emerald-950/30 border border-emerald-800/40 p-2 rounded-lg col-span-2">
                <span className="text-slate-400 block text-[10px]">Transaction Amount</span>
                <span className="text-emerald-400 font-bold text-sm font-mono">
                  ₹{Number(selectedEdge.attributes.amount_inr).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            {selectedEdge.attributes?.at && (
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px]">Timestamp</span>
                <span className="font-mono text-slate-300">{selectedEdge.attributes.at}</span>
              </div>
            )}
            {selectedEdge.attributes?.duration_s !== undefined && (
              <div>
                <span className="text-slate-500 block text-[10px]">Call Duration</span>
                <span className="font-mono text-sky-400">{selectedEdge.attributes.duration_s}s</span>
              </div>
            )}
            {selectedEdge.attributes?.tower && (
              <div>
                <span className="text-slate-500 block text-[10px]">Cell Tower</span>
                <span className="font-mono text-slate-300">{selectedEdge.attributes.tower}</span>
              </div>
            )}
            {selectedEdge.attributes?.note && (
              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px]">Note / Remark</span>
                <span className="text-slate-300">{selectedEdge.attributes.note}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!node) return null;

  const typeCfg = OBJECT_TYPE_COLORS[node.type] || { bg: "#64748b", border: "#94a3b8" };
  const isAccountant = node.id === "person:naveen_bhatia";
  const isKingpin = node.id === "person:vikram_haleja";

  // Check matching patterns
  const matchedPatterns = patterns.filter((p) => p.nodes.includes(node.id));

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-[#090d16]/95 border-l border-slate-800 text-slate-200 text-xs p-4 space-y-4">
      {/* Header Profile */}
      <div className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: typeCfg.bg }}
            />
            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
              {node.type}
            </span>
          </div>

          {node.metrics?.community !== undefined && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 text-purple-300 border border-purple-800/60">
              Cluster #{node.metrics.community}
            </span>
          )}
        </div>

        <h2 className="text-base font-bold text-slate-100 font-mono tracking-tight">{node.label}</h2>
        <div className="text-[11px] font-mono text-sky-400 mt-0.5">{node.id}</div>

        {/* Special Role Tag */}
        {isAccountant && (
          <div className="mt-2 px-2 py-1 rounded-lg bg-amber-950/50 border border-amber-500/50 text-amber-300 text-[11px] font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Top Centrality Cut-Point (Accountant)
          </div>
        )}
        {isKingpin && (
          <div className="mt-2 px-2 py-1 rounded-lg bg-purple-950/50 border border-purple-500/50 text-purple-300 text-[11px] font-semibold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            Syndicate Kingpin (Insulated)
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onIsolateNeighborhood(node.id)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-[11px] transition-all"
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Isolate 2-Hop</span>
        </button>

        <button
          onClick={() => onAskCopilot(node.id)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sky-950/50 hover:bg-sky-900/60 text-sky-300 border border-sky-600/50 font-medium text-[11px] transition-all"
        >
          <Bot className="w-3.5 h-3.5 text-sky-400" />
          <span>Ask Copilot</span>
        </button>

        <button
          onClick={() => onRunArrestSimulation(node.id)}
          className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-600/40 font-semibold text-[11px] transition-all"
        >
          <Scissors className="w-3.5 h-3.5 text-rose-400" />
          <span>Simulate Counterfactual Arrest Cut</span>
        </button>
      </div>

      {/* Centrality Metrics Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2">
        <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block">
          Network Centrality Metrics
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Betweenness</span>
            <span className="text-amber-400 font-bold font-mono text-xs">
              {(node.metrics?.betweenness || 0).toFixed(6)}
            </span>
            {node.metrics?.betweenness_rank_persons && (
              <span className="text-amber-300 text-[10px] block mt-0.5">
                Rank #{node.metrics.betweenness_rank_persons} (Persons)
              </span>
            )}
          </div>
          <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Degree</span>
            <span className="text-emerald-400 font-bold font-mono text-sm">
              {node.metrics?.degree || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Matched Patterns Indicator */}
      {matchedPatterns.length > 0 && (
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3 space-y-1.5">
          <span className="font-semibold text-emerald-400 text-[10px] uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Detected DSL Patterns
          </span>
          {matchedPatterns.map((pat) => (
            <div key={pat.pattern} className="text-[11px] font-mono text-slate-200">
              • <span className="font-bold text-emerald-300">{pat.pattern}</span> (Confidence: {(pat.confidence * 100).toFixed(0)}%)
            </div>
          ))}
        </div>
      )}

      {/* Raw Attributes */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-1.5">
        <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block">
          Entity Attributes
        </span>
        <div className="space-y-1 text-[11px] font-mono">
          {Object.entries(node.attributes || {}).map(([key, val]) => (
            <div key={key} className="flex justify-between items-start border-b border-slate-800/60 pb-1">
              <span className="text-slate-500">{key}:</span>
              <span className="text-slate-300 text-right max-w-[180px] break-words">
                {String(val)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Incident Links & Provenance */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">
            Connected Links ({incidentEdges.length})
          </span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {incidentEdges.slice(0, 15).map((edge, idx) => {
            const isOutgoing = edge.source === node.id;
            const neighborId = isOutgoing ? edge.target : edge.source;
            const linkCfg = LINK_TYPE_COLORS[edge.type] || { color: "#64748b" };

            return (
              <div
                key={idx}
                className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-lg p-2 transition-all"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className="font-mono font-bold px-1.5 py-0.5 rounded text-[10px]"
                    style={{ backgroundColor: `${linkCfg.color}20`, color: linkCfg.color }}
                  >
                    {isOutgoing ? "→" : "←"} {edge.type}
                  </span>
                  <button
                    onClick={() => onSelectNeighbor(neighborId)}
                    className="text-sky-400 hover:text-sky-300 font-mono text-[10px] flex items-center gap-0.5"
                  >
                    <span>{neighborId}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {edge.attributes?.snippet && (
                  <div className="mt-1.5 text-[10px] text-slate-400 italic border-l-2 border-slate-700 pl-2">
                    "{edge.attributes.snippet}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from "react";
import { GraphNode, GraphEdge, TimelineEvent } from "../types";
import { LINK_TYPE_COLORS } from "../lib/theme";
import {
  Clock,
  PhoneCall,
  DollarSign,
  FileWarning,
  Eye,
  Filter,
  AlertTriangle,
  Play,
  Pause,
  ChevronRight,
} from "lucide-react";

interface TimelinePanelProps {
  edges: GraphEdge[];
  nodes: GraphNode[];
  onSelectEvent: (sourceId: string, targetId: string, edge?: GraphEdge) => void;
  onFilterAfterTime: (time: string | null) => void;
  selectedTimeFilter: string | null;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  edges,
  nodes,
  onSelectEvent,
  onFilterAfterTime,
  selectedTimeFilter,
}) => {
  const [activeTab, setActiveTab] = useState<"ALL" | "PAID" | "CALLED" | "FIR">("ALL");

  // Extract events from edges and FIR nodes
  const events: TimelineEvent[] = useMemo(() => {
    const list: TimelineEvent[] = [];

    // Edge events (calls, transactions, sightings)
    edges.forEach((e, idx) => {
      const at = e.attributes?.at;
      if (!at) return;

      if (e.type === "CALLED") {
        list.push({
          id: `call-${idx}`,
          type: "CALLED",
          timestamp: at,
          title: `Call: ${e.source} → ${e.target}`,
          subtitle: `Duration: ${e.attributes.duration_s || 0}s | Tower: ${e.attributes.tower || "Unknown"}`,
          sourceNodeId: e.source,
          targetNodeId: e.target,
          duration: e.attributes.duration_s,
          snippet: e.attributes.snippet,
          rawEdge: e,
        });
      } else if (e.type === "PAID") {
        const amt = Number(e.attributes.amount_inr) || 0;
        list.push({
          id: `paid-${idx}`,
          type: "PAID",
          timestamp: at,
          title: `Transfer: ₹${amt.toLocaleString("en-IN")}`,
          subtitle: `${e.source} → ${e.target} | Note: ${e.attributes.note || "N/A"}`,
          sourceNodeId: e.source,
          targetNodeId: e.target,
          amount: amt,
          snippet: e.attributes.snippet,
          rawEdge: e,
        });
      } else if (e.type === "SEEN_AT") {
        list.push({
          id: `seen-${idx}`,
          type: "SEEN_AT",
          timestamp: at,
          title: `Surveillance Sighting: ${e.source}`,
          subtitle: `Location: ${e.target} (Confidence: ${Math.round((e.attributes.confidence || 1) * 100)}%)`,
          sourceNodeId: e.source,
          targetNodeId: e.target,
          snippet: e.attributes.snippet,
          rawEdge: e,
        });
      }
    });

    // FIR nodes as key milestone events
    nodes.forEach((n) => {
      if (n.type === "FIR" && n.attributes?.filed_at) {
        list.push({
          id: `fir-${n.id}`,
          type: "FIR",
          timestamp: n.attributes.filed_at,
          title: `FIR Registered: ${n.id}`,
          subtitle: `${n.attributes.station || "PS"} | Offence: ${n.attributes.offence || "IPC"}`,
          sourceNodeId: n.id,
          targetNodeId: n.id,
          snippet: n.attributes.narrative || n.label,
        });
      }
    });

    // Sort chronologically descending
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [edges, nodes]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (activeTab !== "ALL" && ev.type !== activeTab) return false;
      if (selectedTimeFilter && new Date(ev.timestamp) < new Date(selectedTimeFilter)) return false;
      return true;
    });
  }, [events, activeTab, selectedTimeFilter]);

  return (
    <div className="h-full flex flex-col bg-[#090d16]/95 border-l border-slate-800 text-slate-200 text-xs">
      {/* Header & Filter Tabs */}
      <div className="p-3 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-slate-100 uppercase tracking-wider text-xs">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Operational Timeline</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-mono">
            {filteredEvents.length} Events
          </span>
        </div>

        {/* Mule Burst Alert Card */}
        <div className="bg-sky-950/40 border border-sky-500/40 rounded-xl p-2.5 space-y-1">
          <div className="flex items-center justify-between text-sky-400 font-semibold text-[11px]">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-sky-400" />
              Mule Call Burst Trigger
            </span>
            <span className="text-[10px] bg-sky-900/60 px-1.5 py-0.5 rounded text-sky-200 font-mono">
              FIR-2026-014
            </span>
          </div>
          <p className="text-[10px] text-slate-300 leading-relaxed">
            Burner phone <span className="font-mono text-sky-300">phone:ph03</span> (Farhan Lodhi) recorded{" "}
            <span className="font-bold text-sky-300">141 calls</span> in 48h following the FIR trigger (vs 34 calls baseline).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-4 gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          {(["ALL", "PAID", "CALLED", "FIR"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-1 text-[10px] font-bold rounded transition-all ${
                activeTab === tab
                  ? "bg-slate-800 text-sky-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredEvents.slice(0, 100).map((ev) => {
          let badgeColor = "#38bdf8";
          let Icon = PhoneCall;

          if (ev.type === "PAID") {
            badgeColor = "#10b981";
            Icon = DollarSign;
          } else if (ev.type === "FIR") {
            badgeColor = "#ef4444";
            Icon = FileWarning;
          } else if (ev.type === "SEEN_AT") {
            badgeColor = "#a855f7";
            Icon = Eye;
          }

          return (
            <div
              key={ev.id}
              onClick={() => onSelectEvent(ev.sourceNodeId, ev.targetNodeId, ev.rawEdge)}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl p-2.5 cursor-pointer transition-all space-y-1 group"
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span
                    className="p-1 rounded-md"
                    style={{ backgroundColor: `${badgeColor}20`, color: badgeColor }}
                  >
                    <Icon className="w-3 h-3" />
                  </span>
                  <span className="font-bold text-slate-200 group-hover:text-sky-300 transition-colors">
                    {ev.title}
                  </span>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-300 transition-colors" />
              </div>

              <div className="text-[10px] font-mono text-slate-400 pl-6">
                {ev.subtitle}
              </div>

              <div className="text-[10px] font-mono text-slate-500 pl-6 flex justify-between items-center">
                <span>{new Date(ev.timestamp).toLocaleString("en-IN")}</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-600 font-semibold">
                  {ev.type}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

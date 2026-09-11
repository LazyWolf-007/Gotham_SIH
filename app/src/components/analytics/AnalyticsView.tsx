import React, { useMemo } from "react";
import { GraphKernel } from "../../types";
import {
  BarChart3,
  Users,
  GitFork,
  Layers,
  Activity,
  AlertCircle,
  TrendingUp,
  Shield,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface AnalyticsViewProps {
  kernel: GraphKernel | null;
  onSelectEntity: (entityId: string) => void;
  onIsolateCommunity: (communityId: number) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  kernel,
  onSelectEntity,
  onIsolateCommunity,
}) => {
  const meta = kernel?.meta;
  const nodes = kernel?.nodes || [];
  const edges = kernel?.edges || [];
  const patterns = kernel?.patterns || [];

  // 1. Top Betweenness Nodes (WHO MATTERS?)
  const topBetweennessNodes = useMemo(() => {
    return [...nodes]
      .filter((n) => n.metrics?.betweenness !== undefined)
      .sort((a, b) => (b.metrics?.betweenness || 0) - (a.metrics?.betweenness || 0))
      .slice(0, 8);
  }, [nodes]);

  // 2. Top Degree Nodes (HOW CONNECTED?)
  const topDegreeNodes = useMemo(() => {
    return [...nodes]
      .filter((n) => n.metrics?.degree !== undefined)
      .sort((a, b) => (b.metrics?.degree || 0) - (a.metrics?.degree || 0))
      .slice(0, 8);
  }, [nodes]);

  // 3. Community Distribution (WHERE ARE THE CLUSTERS?)
  const communityCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    nodes.forEach((n) => {
      const comm = n.metrics?.community;
      if (comm !== undefined) {
        counts[comm] = (counts[comm] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([comm, count]) => ({ community: Number(comm), count }))
      .sort((a, b) => b.count - a.count);
  }, [nodes]);

  return (
    <div className="flex-1 h-full flex flex-col bg-[#050607] text-[#F2F2F2] overflow-y-auto select-none font-sans p-6 gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#20252A]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#E21B23] uppercase font-bold">
              INVESTIGATION WORKSTATION
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[10px] font-mono tracking-wider text-[#858B92] uppercase">
              NETWORK TOPOLOGY & CENTRALITY ANALYTICS
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Criminal Network Intelligence
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#858B92]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>REAL-TIME IN-MEMORY GRAPH KERNEL</span>
        </div>
      </div>

      {/* Top 4 Restrained System Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20252A]">
          <div className="flex items-center justify-between text-[#858B92] text-xs font-mono">
            <span>NETWORK VOLUME</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {nodes.length} Nodes
          </div>
          <div className="text-[11px] text-[#858B92] mt-1 font-mono">
            {meta?.object_counts?.Person || 80} Persons • {meta?.object_counts?.Account || 30} Accounts
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20252A]">
          <div className="flex items-center justify-between text-[#858B92] text-xs font-mono">
            <span>TYPED CONNECTIONS</span>
            <GitFork className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {edges.length.toLocaleString()} Edges
          </div>
          <div className="text-[11px] text-[#858B92] mt-1 font-mono">
            {meta?.link_counts?.CALLED || 3000} Calls • {meta?.link_counts?.PAID || 800} Payments
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20252A]">
          <div className="flex items-center justify-between text-[#858B92] text-xs font-mono">
            <span>KEY BOTTLENECK</span>
            <Activity className="w-4 h-4 text-[#E21B23]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#FF3038] mt-2">
            Naveen Bhatia
          </div>
          <div className="text-[11px] text-amber-400 mt-1 font-mono">
            Betweenness: 0.02555 (Rank #1)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E1216] border border-[#20252A]">
          <div className="flex items-center justify-between text-[#858B92] text-xs font-mono">
            <span>DETECTED PATTERNS</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {patterns.length} Identified
          </div>
          <div className="text-[11px] text-[#858B92] mt-1 font-mono">
            Hawala Cycle • Mule Burst • Cut-points
          </div>
        </div>
      </div>

      {/* Triad Framework: WHO? HOW? WHAT IF? */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel 1: WHO MATTERS? (Betweenness Centrality) */}
        <div className="bg-[#0E1216] border border-[#20252A] rounded-2xl p-5 flex flex-col gap-4">
          <div className="border-b border-[#20252A] pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#E21B23] tracking-widest uppercase">
                1. WHO MATTERS?
              </span>
              <span className="text-[10px] font-mono text-[#858B92]">BETWEENNESS RANK</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              Top Structural Intermediaries
            </h3>
            <p className="text-[11px] text-[#858B92] mt-0.5 leading-relaxed">
              Brokers controlling transaction and communication flow across disparate sub-networks.
            </p>
          </div>

          <div className="space-y-2 flex-1">
            {topBetweennessNodes.map((n, idx) => (
              <div
                key={n.id}
                onClick={() => onSelectEntity(n.id)}
                className="p-2.5 rounded-xl bg-[#0A0D10] border border-[#20252A] hover:border-[#E21B23]/60 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-mono font-bold text-[#858B92] w-4">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-[#FF3038] transition-colors truncate">
                      {n.label}
                    </div>
                    <div className="text-[10px] font-mono text-[#858B92] truncate">
                      {n.id} • {n.type}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono shrink-0 ml-2">
                  <div className="text-xs text-amber-400 font-bold">
                    {(n.metrics?.betweenness || 0).toFixed(5)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: HOW CONNECTED? (Degree Connectivity) */}
        <div className="bg-[#0E1216] border border-[#20252A] rounded-2xl p-5 flex flex-col gap-4">
          <div className="border-b border-[#20252A] pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 tracking-widest uppercase">
                2. HOW CONNECTED?
              </span>
              <span className="text-[10px] font-mono text-[#858B92]">TOTAL DEGREE</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              High-Frequency Nodes
            </h3>
            <p className="text-[11px] text-[#858B92] mt-0.5 leading-relaxed">
              Entities with largest direct linkages (active callers, high-volume accounts).
            </p>
          </div>

          <div className="space-y-2 flex-1">
            {topDegreeNodes.map((n, idx) => (
              <div
                key={n.id}
                onClick={() => onSelectEntity(n.id)}
                className="p-2.5 rounded-xl bg-[#0A0D10] border border-[#20252A] hover:border-emerald-500/60 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-mono font-bold text-[#858B92] w-4">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                      {n.label}
                    </div>
                    <div className="text-[10px] font-mono text-[#858B92] truncate">
                      {n.id} • {n.type}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono shrink-0 ml-2">
                  <div className="text-xs text-emerald-400 font-bold">
                    {n.metrics?.degree || 0} Links
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 3: WHERE ARE CLUSTERS? (Community Detection) */}
        <div className="bg-[#0E1216] border border-[#20252A] rounded-2xl p-5 flex flex-col gap-4">
          <div className="border-b border-[#20252A] pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-400 tracking-widest uppercase">
                3. WHERE ARE CLUSTERS?
              </span>
              <span className="text-[10px] font-mono text-[#858B92]">MODULARITY</span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              Detected Communities
            </h3>
            <p className="text-[11px] text-[#858B92] mt-0.5 leading-relaxed">
              Algorithmic grouping of tightly knit criminal cells and financial conduits.
            </p>
          </div>

          <div className="space-y-2 flex-1">
            {communityCounts.map(({ community, count }) => (
              <div
                key={community}
                onClick={() => onIsolateCommunity(community)}
                className="p-2.5 rounded-xl bg-[#0A0D10] border border-[#20252A] hover:border-purple-500/60 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                    Community #{community}
                  </div>
                  <div className="text-[10px] font-mono text-[#858B92]">
                    {community === 0 && "Front Organizations & Mastermind Nexus"}
                    {community === 1 && "Accountant & Central Financial Conduit"}
                    {community === 2 && "Mule Call & Logistics Network"}
                    {community === 3 && "Azadpur Mandi Cash Skimming Operators"}
                    {community > 3 && "Peripheral Financial/Communication Cell"}
                  </div>
                </div>
                <div className="text-right font-mono shrink-0 ml-2">
                  <div className="text-xs text-purple-400 font-bold">
                    {count} Entities
                  </div>
                  <div className="text-[9px] text-[#858B92] group-hover:text-white transition-colors">
                    Isolate →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from "react";
import { GraphKernel, GraphNode } from "../../types";
import { COMMUNITY_PALETTE } from "../../lib/theme";
import { Users2, ArrowRight, ShieldAlert, Search, Filter } from "lucide-react";

interface CommunitiesViewProps {
  kernel: GraphKernel | null;
  onSelectEntity: (entityId: string) => void;
  onIsolateCommunity: (communityId: number) => void;
}

export const CommunitiesView: React.FC<CommunitiesViewProps> = ({
  kernel,
  onSelectEntity,
  onIsolateCommunity,
}) => {
  const [selectedCommunity, setSelectedCommunity] = useState<number | null>(1); // Default to Bhatia's community
  const [searchQuery, setSearchQuery] = useState("");

  const nodes = kernel?.nodes || [];

  // Group real nodes by community metric
  const communities = useMemo(() => {
    const map: Record<number, GraphNode[]> = {};
    nodes.forEach((n) => {
      const comm = n.metrics?.community;
      if (comm !== undefined) {
        if (!map[comm]) map[comm] = [];
        map[comm].push(n);
      }
    });

    return Object.entries(map)
      .map(([comm, memberNodes]) => ({
        id: Number(comm),
        name:
          Number(comm) === 1
            ? "Accountant & Routing Nexus (Naveen Bhatia)"
            : Number(comm) === 0
            ? "Front Companies & Core Syndicate"
            : Number(comm) === 2
            ? "Mule Call Relay & Telecommunications"
            : Number(comm) === 3
            ? "Azadpur Mandi Produce Skimming"
            : `Syndicate Sub-cluster #${comm}`,
        members: memberNodes,
        color: COMMUNITY_PALETTE[Number(comm) % COMMUNITY_PALETTE.length],
      }))
      .sort((a, b) => b.members.length - a.members.length);
  }, [nodes]);

  const activeCommunityData = communities.find((c) => c.id === selectedCommunity) || communities[0];

  const filteredMembers = useMemo(() => {
    if (!activeCommunityData) return [];
    return activeCommunityData.members.filter(
      (m) =>
        m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeCommunityData, searchQuery]);

  return (
    <div className="flex-1 h-full flex flex-col bg-[#050607] text-[#F2F2F2] overflow-hidden select-none font-sans p-6 gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#20252A] shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-[0.2em] text-[#E21B23] uppercase font-bold">
              INVESTIGATION WORKSTATION
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[10px] font-mono tracking-wider text-[#858B92] uppercase">
              MODULAR COMMUNITY PARTITIONING
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Detected Criminal Cells
          </h1>
        </div>

        <div className="text-xs font-mono text-[#858B92]">
          TOTAL PARTITIONS: <strong className="text-white">{communities.length} Communities</strong>
        </div>
      </div>

      {/* Main 2-Column: Community Cards List & Selected Community Members */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* Left: Community Cards (5 Cols) */}
        <div className="lg:col-span-5 overflow-y-auto space-y-3 pr-2">
          {communities.map((comm) => {
            const isSelected = selectedCommunity === comm.id;

            return (
              <div
                key={comm.id}
                onClick={() => setSelectedCommunity(comm.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-[#0E1216] border-[#E21B23] shadow-md shadow-[#E21B23]/10"
                    : "bg-[#0A0D10] border-[#20252A] hover:border-[#384048] hover:bg-[#0E1216]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: comm.color }}
                    />
                    <span className="text-xs font-mono font-bold text-white">
                      COMMUNITY {String(comm.id).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#858B92]">
                    {comm.members.length} Entities
                  </span>
                </div>

                <div className="text-sm font-semibold text-slate-200 mt-2">
                  {comm.name}
                </div>

                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#20252A] text-[11px] font-mono">
                  <span className="text-[#858B92]">
                    {comm.members.filter((m) => m.type === "Person").length} Persons •{" "}
                    {comm.members.filter((m) => m.type === "Account").length} Accounts
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onIsolateCommunity(comm.id);
                    }}
                    className="text-[#E21B23] hover:text-[#FF3038] font-bold flex items-center gap-1 hover:underline"
                  >
                    <span>Isolate on Canvas</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Members of Selected Community (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0E1216] border border-[#20252A] rounded-2xl p-5 overflow-hidden flex flex-col gap-4">
          {activeCommunityData && (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#20252A] shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: activeCommunityData.color }}
                    />
                    <span className="text-xs font-mono font-bold text-white">
                      COMMUNITY {String(activeCommunityData.id).padStart(2, "0")}
                    </span>
                    <span className="text-xs font-mono text-[#858B92]">
                      ({activeCommunityData.members.length} Entities)
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {activeCommunityData.name}
                  </h3>
                </div>

                <button
                  onClick={() => onIsolateCommunity(activeCommunityData.id)}
                  className="px-3 py-1.5 rounded-xl bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-bold font-mono transition-all shadow-sm cursor-pointer shrink-0"
                >
                  Isolate Entire Cluster
                </button>
              </div>

              {/* Search Inside Community */}
              <div className="relative shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#858B92]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter community entities by name or type..."
                  className="w-full bg-[#050607] border border-[#20252A] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#858B92] focus:outline-none focus:border-[#E21B23] font-mono"
                />
              </div>

              {/* Members List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => onSelectEntity(member.id)}
                    className="p-3 rounded-xl bg-[#0A0D10] border border-[#20252A] hover:border-[#E21B23]/60 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white group-hover:text-[#FF3038] transition-colors truncate">
                          {member.label}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#20252A] text-zinc-400">
                          {member.type}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-[#858B92] truncate mt-0.5">
                        {member.id}
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0 ml-2 text-[11px]">
                      {member.metrics?.betweenness !== undefined && (
                        <div className="text-amber-400 font-bold">
                          BW: {member.metrics.betweenness.toFixed(4)}
                        </div>
                      )}
                      <div className="text-[#858B92] text-[10px]">
                        Deg: {member.metrics?.degree || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

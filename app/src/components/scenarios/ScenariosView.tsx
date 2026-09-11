import React, { useState } from "react";
import { GraphKernel, CutResult } from "../../types";
import { runCutSimulation } from "../../lib/api";
import {
  Scissors,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  GitFork,
  ArrowRight,
  Activity,
  CheckCircle2,
} from "lucide-react";

interface ScenariosViewProps {
  kernel: GraphKernel | null;
  token: string | null;
  onApplySimulationToGraph: (targetId: string | null, result: CutResult | null) => void;
  onSelectEntity: (entityId: string) => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({
  kernel,
  token,
  onApplySimulationToGraph,
  onSelectEntity,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>("person:naveen_bhatia");
  const [loading, setLoading] = useState(false);
  const [cutResult, setCutResult] = useState<CutResult | null>(kernel?.cut || null);
  const [isAppliedToCanvas, setIsAppliedToCanvas] = useState(false);

  const scenarioTargets = [
    {
      id: "person:naveen_bhatia",
      name: "Naveen Bhatia",
      role: "Accountant & Central Cut-point",
      badge: "Rank #1 Betweenness",
      description:
        "Primary financial router connecting Azadpur mandi cash conduits to front companies.",
    },
    {
      id: "person:rakesh_mundhe",
      name: "Rakesh Mundhe",
      role: "Mandi Produce Coordinator",
      badge: "Rank #2 Betweenness",
      description: "Direct merchant aggregator handling cash collections across Azadpur Mandi.",
    },
    {
      id: "person:vikram_haleja",
      name: "Vikram Haleja",
      role: "Syndicate Principal",
      badge: "Isolated Mastermind",
      description: "Indirect beneficiary shielded by shell accounts and corporate front layers.",
    },
  ];

  const handleRunSimulation = async (targetId: string) => {
    setSelectedTarget(targetId);
    setLoading(true);
    try {
      const res = await runCutSimulation(targetId, undefined, undefined, token);
      if (res && res.result) {
        setCutResult(res.result);
      }
    } catch (err) {
      console.error("Cut simulation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToCanvas = () => {
    onApplySimulationToGraph(selectedTarget, cutResult);
    setIsAppliedToCanvas(true);
  };

  const handleResetSimulation = () => {
    onApplySimulationToGraph(null, null);
    setIsAppliedToCanvas(false);
  };

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
              COUNTERFACTUAL INTERVENTION SIMULATION (WHAT IF?)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Operational Scenarios
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {isAppliedToCanvas ? (
            <button
              onClick={handleResetSimulation}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-all cursor-pointer border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Graph Intervention</span>
            </button>
          ) : (
            <button
              onClick={handleApplyToCanvas}
              disabled={!cutResult}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-md shadow-[#E21B23]/25 disabled:opacity-50"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Apply Cut to Main Canvas</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Scenario Target Selector & Impact Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interdiction Targets (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs text-[#858B92] font-mono pb-1">
            SELECT INTERVENTION TARGET
          </div>

          {scenarioTargets.map((target) => {
            const isSelected = selectedTarget === target.id;

            return (
              <div
                key={target.id}
                onClick={() => handleRunSimulation(target.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-[#0E1216] border-[#E21B23] shadow-md shadow-[#E21B23]/10"
                    : "bg-[#0A0D10] border-[#20252A] hover:border-[#384048] hover:bg-[#0E1216]"
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#E21B23] rounded-r" />
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{target.name}</h3>
                    <div className="text-xs font-mono text-[#858B92] mt-0.5">
                      {target.id} • {target.role}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#E21B23]/20 border border-[#E21B23]/40 text-[#FF3038] uppercase">
                    {target.badge}
                  </span>
                </div>

                <p className="text-xs text-[#858B92] mt-2 leading-relaxed">
                  {target.description}
                </p>

                <div className="mt-3 pt-2.5 border-t border-[#20252A] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-500">
                    Deterministic Cut Algorithm
                  </span>
                  <button
                    disabled={loading}
                    className="text-xs font-mono font-bold text-[#E21B23] hover:text-[#FF3038] flex items-center gap-1 cursor-pointer"
                  >
                    <span>{loading && isSelected ? "Simulating..." : "Run Simulation →"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Simulation Impact Analysis (7 Cols) */}
        <div className="lg:col-span-7 bg-[#0E1216] border border-[#20252A] rounded-2xl p-6 flex flex-col gap-5">
          <div className="pb-3 border-b border-[#20252A]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-[#E21B23] uppercase tracking-wider flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-[#FF3038] font-bold">
                  COUNTERFACTUAL SIMULATION
                </span>
                <span>• TARGET: {selectedTarget}</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 uppercase">
                AUTHENTICATED BACKEND CALCULATION
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-2">
              Topological Network Disruption (What-If Analysis)
            </h2>
          </div>

          {cutResult ? (
            <div className="space-y-4 text-xs">
              {/* Distinct Panels: OBSERVED NETWORK vs SIMULATED RESULT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                {/* Panel 1: OBSERVED NETWORK */}
                <div className="p-3.5 rounded-xl bg-[#050607] border border-[#20252A] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#858B92] uppercase font-bold">
                      OBSERVED NETWORK
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                      CURRENT BASELINE
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {cutResult.components_before} Component
                  </div>
                  <div className="text-[11px] text-[#858B92]">
                    Intact Criminal Network • All primary routes operational
                  </div>
                </div>

                {/* Panel 2: SIMULATED RESULT */}
                <div className="p-3.5 rounded-xl bg-[#050607] border border-[#E21B23]/50 space-y-1 shadow-[0_0_15px_rgba(226,27,35,0.1)]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#FF3038] uppercase font-bold">
                      SIMULATED RESULT (CUT)
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-950/80 border border-red-500/40 text-red-300">
                      SIMULATED
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#FF3038] mt-1">
                    {cutResult.components_after} Components
                  </div>
                  <div className="text-[11px] text-[#FF3038]">
                    {cutResult.components_after > cutResult.components_before
                      ? "Fractured Syndicate Topology: Target Cut-Point Neutralized"
                      : "Unchanged Topology"}
                  </div>
                </div>
              </div>

              {/* Severed Primary Path */}
              {cutResult.path_before && (
                <div className="p-4 rounded-xl bg-[#0A0D10] border border-[#20252A] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E21B23]" />
                    <span className="text-[10px] font-mono text-[#858B92] uppercase font-bold tracking-wider">
                      PRIMARY SEVERED FINANCIAL CONDUIT (DISRUPTED)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs pt-1">
                    {cutResult.path_before.map((nodeId, idx) => (
                      <React.Fragment key={idx}>
                        <span
                          onClick={() => onSelectEntity(nodeId)}
                          className={`px-2 py-1 rounded border cursor-pointer hover:underline ${
                            nodeId === selectedTarget
                              ? "bg-[#E21B23]/20 border-[#E21B23] text-[#FF3038] font-bold"
                              : "bg-[#050607] border-[#20252A] text-slate-200"
                          }`}
                        >
                          {nodeId}
                        </span>
                        {idx < cutResult.path_before!.length - 1 && (
                          <span className="text-zinc-600">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Residual Surviving Path */}
              {cutResult.residual_path_ph02_ph03 && (
                <div className="p-4 rounded-xl bg-[#0A0D10] border border-[#20252A] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                      CRITICAL RESIDUAL SURVIVING RELAY (ALTERNATE CHANNEL)
                    </span>
                  </div>
                  <p className="text-[#858B92] text-[11px] leading-relaxed">
                    Even after neutralizing {selectedTarget}, communication and fund flow persists through alternate burner phones <strong>phone:ph02</strong> and <strong>phone:ph03</strong>:
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] pt-1">
                    {cutResult.residual_path_ph02_ph03.map((nodeId, idx) => (
                      <React.Fragment key={idx}>
                        <span
                          onClick={() => onSelectEntity(nodeId)}
                          className={`px-2 py-1 rounded border cursor-pointer hover:underline ${
                            nodeId.includes("phone:ph02") || nodeId.includes("phone:ph03")
                              ? "bg-amber-950/40 border-amber-500/50 text-amber-300 font-bold"
                              : "bg-[#050607] border-[#20252A] text-slate-300"
                          }`}
                        >
                          {nodeId}
                        </span>
                        {idx < cutResult.residual_path_ph02_ph03!.length - 1 && (
                          <span className="text-zinc-600">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Operational Action */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#858B92]">
                  Status: {isAppliedToCanvas ? "Active on Canvas" : "Ready to Apply"}
                </span>
                {isAppliedToCanvas ? (
                  <button
                    onClick={handleResetSimulation}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold transition-all cursor-pointer"
                  >
                    Reset Canvas
                  </button>
                ) : (
                  <button
                    onClick={handleApplyToCanvas}
                    className="px-4 py-2 rounded-xl bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-mono font-bold transition-all shadow-md shadow-[#E21B23]/25 cursor-pointer"
                  >
                    Apply Disruption to Graph Canvas →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#858B92] font-mono">
              SELECT AN ENTITY AND RUN COUNTERFACTUAL ARREST CUT SIMULATION
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

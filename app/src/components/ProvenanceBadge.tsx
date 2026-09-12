import React from "react";
import { Database, Network, Shield, Clock, GitFork, Code } from "lucide-react";

export type ProvenanceType =
  | "BACKEND DATA"
  | "GRAPH ANALYSIS"
  | "EVIDENCE RECORD"
  | "TIMELINE EVENT"
  | "COUNTERFACTUAL SIMULATION"
  | "LOCAL PROTOTYPE";

interface ProvenanceBadgeProps {
  type: ProvenanceType;
  className?: string;
  size?: "sm" | "md";
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ type, className = "", size = "sm" }) => {
  const isSm = size === "sm";
  const isLight = typeof document !== "undefined" && document.documentElement.classList.contains("light");

  const getConfig = () => {
    switch (type) {
      case "BACKEND DATA":
        return {
          bg: isLight
            ? "bg-cyan-50 border-cyan-300 text-cyan-800"
            : "bg-cyan-950/80 border-cyan-500/40 text-cyan-300",
          icon: <Database className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />,
        };
      case "GRAPH ANALYSIS":
        return {
          bg: isLight
            ? "bg-purple-50 border-purple-300 text-purple-800"
            : "bg-purple-950/80 border-purple-500/40 text-purple-300",
          icon: <Network className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />,
        };
      case "EVIDENCE RECORD":
        return {
          bg: isLight
            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
            : "bg-emerald-950/80 border-emerald-500/40 text-emerald-300",
          icon: <Shield className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />,
        };
      case "TIMELINE EVENT":
        return {
          bg: isLight
            ? "bg-amber-50 border-amber-300 text-amber-800"
            : "bg-amber-950/80 border-amber-500/40 text-amber-300",
          icon: <Clock className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />,
        };
      case "COUNTERFACTUAL SIMULATION":
        return {
          bg: isLight
            ? "bg-red-50 border-red-300 text-red-800"
            : "bg-red-950/80 border-red-500/40 text-red-300",
          icon: <GitFork className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />,
        };
      case "LOCAL PROTOTYPE":
        return {
          bg: isLight
            ? "bg-slate-100 border-slate-300 text-slate-700"
            : "bg-slate-800/80 border-slate-600 text-slate-300",
          icon: <Code className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />,
        };
      default:
        return {
          bg: isLight
            ? "bg-slate-100 border-slate-300 text-slate-700"
            : "bg-zinc-800 border-zinc-700 text-zinc-300",
          icon: null,
        };
    }
  };

  const config = getConfig();

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono uppercase font-bold tracking-wider rounded border ${
        isSm ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]"
      } ${config.bg} ${className}`}
      title={`Data Provenance: ${type}`}
    >
      {config.icon}
      <span>{type}</span>
    </span>
  );
};

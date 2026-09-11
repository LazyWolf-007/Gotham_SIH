import React from "react";
import { Shield, Sparkles, ArrowRight, ExternalLink, Activity } from "lucide-react";

interface HeaderProps {
  onLaunchWorkbench: () => void;
}

export default function Header({ onLaunchWorkbench }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#070b13]/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 shadow-md shadow-sky-600/30">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-tight">GOTHAM_SIH</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800 font-mono font-bold">
                SIH26189
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
              NCRB / MHA Criminal Network Analysis
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs text-slate-400 font-medium">
          <a href="#overview" className="hover:text-sky-400 transition-colors">
            Case Overview
          </a>
          <a href="#innovations" className="hover:text-sky-400 transition-colors">
            4 Innovation Pillars
          </a>
          <a href="#timeline" className="hover:text-sky-400 transition-colors">
            Operation Timeline
          </a>
          <a href="#architecture" className="hover:text-sky-400 transition-colors">
            Graph Engine Spec
          </a>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLaunchWorkbench}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-sky-500/20 transition-all cursor-pointer group"
          >
            <span>Launch Workbench</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
}

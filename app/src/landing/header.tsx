import React from "react";
import { ArrowRight } from "lucide-react";

interface HeaderProps {
  onLaunchWorkbench: () => void;
}

export default function Header({ onLaunchWorkbench }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#050607]/90 backdrop-blur-md border-b border-[#20252A] px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/jaal-emblem.png"
            alt="National Emblem"
            className="w-7 h-9 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-base tracking-[0.1em]">JAAL</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#E21B23]/20 text-[#FF3038] border border-[#E21B23]/40 font-mono font-bold">
                SIH26189
              </span>
            </div>
            <div className="text-[10px] text-[#858B92] font-mono tracking-wider">
              OPERATION GREY LEDGER
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs text-[#858B92] font-mono tracking-wider uppercase">
          <a href="#home" className="hover:text-white transition-colors">
            Home
          </a>
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#impact" className="hover:text-white transition-colors">
            Impact
          </a>
          <a href="#team" className="hover:text-white transition-colors">
            Team
          </a>
          <button
            onClick={onLaunchWorkbench}
            className="hover:text-[#FF3038] transition-colors cursor-pointer"
          >
            Login
          </button>
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLaunchWorkbench}
            className="flex items-center gap-2 px-4 py-2 bg-[#E21B23] hover:bg-[#FF3038] text-white font-bold rounded-xl text-xs shadow-lg shadow-[#E21B23]/25 transition-all cursor-pointer group font-mono"
          >
            <span>Enter Investigation Desk</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
}

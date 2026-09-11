'use client';
import React, { useState } from 'react';
import { Menu, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { AshokaEmblem } from './icons/ashoka-emblem';

interface HeroHeaderProps {
  onLaunchWorkbench?: () => void;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({ onLaunchWorkbench }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLaunch = () => {
    if (onLaunchWorkbench) {
      onLaunchWorkbench();
    } else {
      window.dispatchEvent(new CustomEvent('navigate-workbench'));
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-black/40 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Brand: Ashoka Emblem + JAAL */}
        <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="text-zinc-200 hover:text-white transition-colors flex items-center">
            <img
              src="/jaal-emblem.png"
              alt="JAAL National Emblem Logo"
              className="w-10 h-12 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-sans font-bold text-2xl sm:text-3xl tracking-[0.08em] text-white leading-none">
              JAAL
            </span>
            <span className="text-[11px] sm:text-xs tracking-[0.22em] text-zinc-300 font-sans font-medium uppercase mt-1">
              OPERATION GREY LEDGER
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a
            href="#home"
            className="text-white relative pb-1 border-b-2 border-red-500 transition-colors"
          >
            Home
          </a>
          <a
            href="#features"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#use-cases"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Use Cases
          </a>
          <a
            href="#impact"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Impact
          </a>
          <a
            href="#team"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Team
          </a>
        </nav>

        {/* Right CTA: Access Desk Button */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={handleLaunch}
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-black/60 border border-red-500/40 hover:border-red-500 hover:bg-red-950/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_rgba(239,68,68,0.35)] transition-all cursor-pointer backdrop-blur-md"
          >
            <span>Access Desk</span>
            <ArrowRight className="w-3.5 h-3.5 text-red-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-zinc-400 hover:text-white"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-zinc-950/95 border-b border-zinc-800 px-6 py-6 space-y-4 backdrop-blur-xl">
          <a
            href="#home"
            onClick={() => setMenuOpen(false)}
            className="block text-white font-medium"
          >
            Home
          </a>
          <a
            href="#features"
            onClick={() => setMenuOpen(false)}
            className="block text-zinc-400 hover:text-white"
          >
            Features
          </a>
          <a
            href="#use-cases"
            onClick={() => setMenuOpen(false)}
            className="block text-zinc-400 hover:text-white"
          >
            Use Cases
          </a>
          <a
            href="#impact"
            onClick={() => setMenuOpen(false)}
            className="block text-zinc-400 hover:text-white"
          >
            Impact
          </a>
          <a
            href="#team"
            onClick={() => setMenuOpen(false)}
            className="block text-zinc-400 hover:text-white"
          >
            Team
          </a>
          <button
            onClick={() => {
              setMenuOpen(false);
              handleLaunch();
            }}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/30"
          >
            <span>Access Desk</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};

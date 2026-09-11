import React, { useState } from 'react';
import { ArrowRight, Play, Crosshair, Network, Scan, ShieldCheck } from 'lucide-react';
import LanyardWithControls from './lanyard-with-controls';
import { BriefingModal } from './briefing-modal';

interface HeroSectionProps {
  onLaunchWorkbench?: () => void;
}

const CATEGORIES = [
  { label: 'PEOPLE', active: true },
  { label: 'TRANSACTIONS', active: false },
  { label: 'LOCATIONS', active: false },
  { label: 'COMMUNICATIONS', active: false },
  { label: 'ORGANIZATIONS', active: false },
  { label: 'VEHICLES', active: false },
  { label: 'EVIDENCE', active: false },
];

export default function HeroSection({ onLaunchWorkbench }: HeroSectionProps) {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('PEOPLE');

  const handleLaunch = () => {
    if (onLaunchWorkbench) {
      onLaunchWorkbench();
    } else {
      window.dispatchEvent(new CustomEvent('navigate-workbench'));
    }
  };

  return (
    <section id="home" className="relative min-h-screen w-full bg-black text-white flex flex-col justify-between overflow-hidden pt-20 md:pt-24 select-none">
      {/* Background Tactical Image with Crisp Visibility */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src="/jaal-bg.png"
          alt="JAAL War Room Intelligence Map"
          className="w-full h-full object-cover object-center filter brightness-[1.15] contrast-[1.08] saturate-[1.08]"
        />
        {/* Soft, minimal left gradient only behind the headline for clean readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
      </div>

      {/* Main Center Container */}
      <div className="relative z-10 max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-4 md:py-8 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center">
          
          {/* Left Sub-Sidebar (Category items) */}
          <div className="hidden lg:flex lg:col-span-2 flex-col space-y-5 border-l border-zinc-800/80 pl-3 py-1">
            <div className="w-6 h-[2px] bg-red-500 mb-2 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.label;
              return (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(cat.label)}
                  className={`text-left font-mono text-[10px] xl:text-[11px] tracking-[0.22em] transition-all flex items-center gap-2 group cursor-pointer ${
                    isSelected
                      ? 'text-white font-bold translate-x-1'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      isSelected
                        ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]'
                        : 'bg-zinc-700 group-hover:bg-zinc-500'
                    }`}
                  />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Center-Left Hero Main Typography */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col space-y-5 lg:-ml-4 xl:-ml-8">
            {/* Tagline / Overline */}
            <div className="space-y-0.5">
              <p className="font-mono text-xs md:text-sm font-semibold tracking-[0.22em] text-zinc-400 uppercase leading-snug">
                A SAFER TOMORROW
              </p>
              <p className="font-mono text-xs md:text-sm font-semibold tracking-[0.22em] text-zinc-400 uppercase leading-snug">
                THROUGH CLEARER CONNECTIONS.
              </p>
            </div>

            {/* Giant Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-sans font-black tracking-tight leading-[0.98] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
              INTELLIGENCE
              <br />
              THAT BRINGS
              <br />
              CRIMINAL NETWORKS
              <br />
              <span className="text-[#f83a3a] drop-shadow-[0_0_35px_rgba(248,58,58,0.7)]">
                INTO FOCUS.
              </span>
            </h1>

            {/* Paragraph Description */}
            <p className="text-zinc-200 text-xs sm:text-sm md:text-base leading-relaxed max-w-md font-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              JAAL is an investigation workbench that unifies disparate data, reveals hidden links,
              and helps officers act faster with evidence-backed insights.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={handleLaunch}
                className="group relative inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-[0_0_25px_rgba(239,68,68,0.45)] hover:shadow-[0_0_35px_rgba(239,68,68,0.65)] transform hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Explore JAAL</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium text-zinc-200 bg-black/60 hover:bg-black/80 border border-zinc-800 hover:border-zinc-600 backdrop-blur-md transition-all cursor-pointer shadow-lg"
              >
                <div className="w-5 h-5 rounded-full border border-zinc-400/80 flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-current translate-x-0.2" />
                </div>
                <span>Watch Video</span>
              </button>
            </div>
          </div>

          {/* Right Side: Interactive 3D Lanyard ID Card */}
          <div className="lg:col-span-5 xl:col-span-5 relative h-[520px] sm:h-[600px] lg:h-[660px] w-full flex items-center justify-center lg:justify-end lg:translate-x-8 xl:translate-x-16">
            <div className="absolute inset-0 flex items-center justify-center lg:justify-end">
              <LanyardWithControls
                position={[0.5, 0, 18]}
                containerClassName="relative w-full h-full select-none"
                defaultName="OFFICER-01"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom HUD Metrics & Quote Bar */}
      <div className="relative z-10 w-full border-t border-white/10 bg-black/70 backdrop-blur-xl py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Metrics Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 w-full md:w-auto">
            {/* Metric 1 */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-red-500">
                <Crosshair className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                  259
                </div>
                <div className="text-[11px] text-zinc-400 font-medium">Entities</div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="flex items-center gap-3 sm:border-l sm:border-zinc-800 sm:pl-8">
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-red-500">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                  3.9K
                </div>
                <div className="text-[11px] text-zinc-400 font-medium">Connections</div>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="flex items-center gap-3 sm:border-l sm:border-zinc-800 sm:pl-8">
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-red-500">
                <Scan className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                  8
                </div>
                <div className="text-[11px] text-zinc-400 font-medium">Link Types</div>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="flex items-center gap-3 sm:border-l sm:border-zinc-800 sm:pl-8">
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800 text-red-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                  1
                </div>
                <div className="text-[11px] text-zinc-400 font-medium">Mission</div>
              </div>
            </div>
          </div>

          {/* Right Quote */}
          <div className="text-center md:text-right space-y-0.5 border-t md:border-t-0 border-zinc-800/80 pt-3 md:pt-0 w-full md:w-auto">
            <p className="text-xs md:text-sm italic text-zinc-300 font-serif">
              “Information finds its own connections.”
            </p>
            <p className="text-[10px] tracking-[0.25em] text-zinc-500 font-mono uppercase">
              — OPERATION GREY LEDGER
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Video / Briefing Modal */}
      <BriefingModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onLaunchWorkbench={handleLaunch}
      />
    </section>
  );
}

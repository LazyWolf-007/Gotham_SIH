import React, { useState, useRef, useEffect } from "react";
import { GraphKernel, ObjectType } from "../types";
import { CaseSelector } from "./case/CaseSelector";
import {
  Search,
  User,
  Phone,
  Landmark,
  FileText,
  Upload,
  Radio,
  Building,
  MapPin,
  Car,
  X,
  ArrowRight,
} from "lucide-react";

interface HeaderProps {
  kernel: GraphKernel | null;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSelectEntity?: (entityId: string) => void;
  onBackToLanding?: () => void;
  onUploadClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  kernel,
  searchQuery = "",
  onSearchChange,
  onSelectEntity,
  onBackToLanding,
  onUploadClick,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const meta = kernel?.meta;
  const personCount = meta?.object_counts?.Person || 80;
  const phoneCount = meta?.object_counts?.Phone || 40;
  const accCount = meta?.object_counts?.Account || 30;
  const firCount = meta?.object_counts?.FIR || 60;

  // Search Results preview
  const searchResults = React.useMemo(() => {
    if (!kernel || !searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return kernel.nodes
      .filter((n) => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q))
      .slice(0, 6);
  }, [kernel, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-[#050607] border-b border-[#20252A] px-4 flex items-center justify-between select-none z-40 shrink-0 gap-4">
      {/* Left: Ashoka Emblem + JAAL Branding + Case Selector */}
      <div className="flex items-center gap-4 shrink-0">
        <div
          onClick={onBackToLanding}
          className="flex items-center gap-3 cursor-pointer group"
          title="Return to Public Portal"
        >
          <img
            src="/jaal-emblem.png"
            alt="National Emblem Logo"
            className="w-8 h-9 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col justify-center">
            <span className="font-sans font-black text-xl tracking-[0.1em] text-white leading-none group-hover:text-[#FF3038] transition-colors">
              JAAL
            </span>
            <span className="text-[10px] tracking-[0.2em] text-[#858B92] font-mono font-medium uppercase mt-0.5">
              OPERATION GREY LEDGER
            </span>
          </div>
        </div>

        {/* Case Selector Dropdown */}
        <div className="hidden xl:block">
          <CaseSelector />
        </div>
      </div>

      {/* Center: Global Entity Search Bar with Quick Results */}
      <div className="flex-1 max-w-xl hidden md:block relative" ref={searchRef}>
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#858B92]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              onSearchChange && onSearchChange(e.target.value);
              setIsSearchOpen(true);
            }}
            placeholder="Search people, phones, accounts, organizations..."
            className="w-full bg-[#0E1216] border border-[#20252A] rounded-xl pl-10 pr-9 py-2 text-xs text-white placeholder-[#858B92] focus:outline-none focus:border-[#E21B23] focus:ring-1 focus:ring-[#E21B23]/50 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange && onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#858B92] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Search Suggestions Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0E1216] border border-[#20252A] rounded-xl shadow-2xl p-2 z-50 space-y-1">
            <div className="text-[10px] font-mono text-[#858B92] uppercase px-2 py-1 flex items-center justify-between border-b border-[#20252A] mb-1">
              <span>MATCHED ENTITIES ({searchResults.length})</span>
              <span>CLICK TO FOCUS CANVAS</span>
            </div>
            {searchResults.map((res) => (
              <div
                key={res.id}
                onClick={() => {
                  if (onSelectEntity) onSelectEntity(res.id);
                  setIsSearchOpen(false);
                }}
                className="p-2 rounded-lg hover:bg-[#20252A] transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-[#FF3038] transition-colors">
                    {res.label}
                  </div>
                  <div className="text-[10px] font-mono text-[#858B92]">
                    {res.id} • {res.type}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#555C63] group-hover:text-white transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Stats Pills & Action Desk */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Stat Pills */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Persons */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1216] border border-[#20252A] text-slate-200 text-xs font-mono shadow-sm">
            <User className="w-3.5 h-3.5 text-[#E21B23]" />
            <span>{personCount} Persons</span>
          </div>

          {/* Phones */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1216] border border-[#20252A] text-slate-200 text-xs font-mono shadow-sm">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{phoneCount} Phones</span>
          </div>

          {/* Accounts */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1216] border border-[#20252A] text-slate-200 text-xs font-mono shadow-sm">
            <Landmark className="w-3.5 h-3.5 text-emerald-400" />
            <span>{accCount} Accounts</span>
          </div>

          {/* FIRs */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0E1216] border border-[#20252A] text-slate-200 text-xs font-mono shadow-sm">
            <FileText className="w-3.5 h-3.5 text-[#FF3038]" />
            <span>{firCount} FIRs</span>
          </div>
        </div>

        {/* Live Surveillance Radar Indicator */}
        <div
          title="Live Tactical Surveillance Feed Active"
          className="w-8 h-8 rounded-xl bg-[#0E1216] border border-[#20252A] flex items-center justify-center text-[#E21B23] shadow-sm cursor-pointer hover:border-[#E21B23]/50 transition-colors"
        >
          <Radio className="w-4 h-4 animate-pulse" />
        </div>

        {/* Upload Data Button */}
        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0E1216] hover:bg-[#20252A] text-slate-200 hover:text-white border border-[#20252A] hover:border-[#384048] text-xs font-semibold transition-all shadow-sm cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-[#858B92]" />
          <span>Upload Data</span>
        </button>
      </div>
    </header>
  );
};

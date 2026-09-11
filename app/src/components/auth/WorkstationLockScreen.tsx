import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Lock, Unlock, ShieldAlert, KeyRound, UserCheck } from "lucide-react";

export const WorkstationLockScreen: React.FC = () => {
  const { user, unlockWorkstation, logout } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // In local prototype, any input or clicking unlock unlocks the workstation
    unlockWorkstation();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030712] text-white flex flex-col items-center justify-center p-6 select-none font-sans overflow-hidden">
      {/* Background Ambience */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
        style={{ backgroundImage: `url('/login-bg.png')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/90 to-[#030712]/80 pointer-events-none" />

      {/* Lock Panel */}
      <div className="relative z-10 w-full max-w-md bg-[#0A0D10]/95 border border-[#20252A] rounded-3xl p-8 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col items-center text-center">
        {/* Emblem & Branding */}
        <div className="flex items-center gap-3 mb-6">
          <img
            src="/jaal-emblem.png"
            alt="National Emblem"
            className="w-9 h-11 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
          />
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-widest text-white leading-none">
                JAAL
              </span>
              <span className="text-[9px] font-mono bg-red-950/80 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded uppercase">
                SECURE
              </span>
            </div>
            <p className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase mt-0.5">
              OPERATION GREY LEDGER
            </p>
          </div>
        </div>

        {/* Lock Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-[#E21B23]/10 border border-[#E21B23]/40 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(226,27,35,0.2)]">
          <Lock className="w-8 h-8 text-[#FF3038]" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-white">
          Workstation Locked
        </h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
          Active investigative session is secured to protect sensitive criminal intelligence.
        </p>

        {/* Officer Identity Card */}
        <div className="w-full mt-6 p-3.5 rounded-2xl bg-[#0E1216] border border-[#20252A] flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-[#E21B23]/20 border border-[#E21B23]/40 flex items-center justify-center text-sm font-bold text-[#FF3038] shrink-0">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "K"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white truncate">
              {user?.displayName || "Kartik"}
            </div>
            <div className="text-xs font-mono text-zinc-400">
              {user?.role === "admin" ? "Master Admin" : "Investigator"} • {user?.badgeNumber || "IND-IO-26189"}
            </div>
            <div className="text-[10px] text-zinc-500 truncate mt-0.5">
              {user?.department || "Special Cell (Delhi Police)"}
            </div>
          </div>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="w-full mt-5 space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter passcode or click Unlock..."
              className="w-full bg-[#050607] border border-[#20252A] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E21B23] transition-all font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-bold font-mono tracking-wider uppercase transition-all shadow-lg shadow-[#E21B23]/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock Workstation</span>
          </button>
        </form>

        {/* Alternate Action: Logout */}
        <div className="mt-5 flex items-center justify-between w-full text-xs font-mono text-zinc-500 pt-3 border-t border-[#20252A]">
          <span className="text-[10px]">LOCAL PROTOTYPE SESSION</span>
          <button
            type="button"
            onClick={logout}
            className="text-zinc-400 hover:text-red-400 transition-colors cursor-pointer text-[11px]"
          >
            Switch Officer / Logout
          </button>
        </div>
      </div>
    </div>
  );
};

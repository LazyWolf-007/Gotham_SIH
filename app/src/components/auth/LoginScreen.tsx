import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { User, Lock, Eye, EyeOff, ShieldCheck, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";

interface LoginScreenProps {
  onBackToLanding?: () => void;
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onBackToLanding, onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      if (
        err?.code === "auth/invalid-credential" ||
        err?.code === "auth/user-not-found" ||
        err?.code === "auth/wrong-password"
      ) {
        setError("Invalid email or passcode. Please check your credentials.");
      } else if (err?.code === "auth/network-request-failed") {
        setError("Network connection issue to Firebase Auth servers (Check AdBlocker/Firewall).");
      } else {
        setError(err?.message || "Authentication failed. Please verify authorization.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#030712] text-white font-sans flex">
      {/* Background Image Container (login-bg.png containing left uniform + right parliament) */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url('/login-bg.png')` }}
      >
        {/* Subtle Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
      </div>

      {/* Back to Portal Button */}
      {onBackToLanding && (
        <button
          onClick={onBackToLanding}
          className="absolute top-5 left-5 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/70 hover:bg-black/90 border border-white/20 text-xs text-zinc-300 hover:text-white transition-all backdrop-blur-md cursor-pointer shadow-lg group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-red-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Portal</span>
        </button>
      )}

      {/* TWO SECTIONS LAYOUT */}
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row">

        {/* ================= SECTION 1: LEFT PANEL (~30% Width) ================= */}
        <div className="w-full md:w-[30%] xl:w-[28%] h-auto md:h-full p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 bg-black/30 backdrop-blur-[2px]">
          {/* Top Slogan */}
          <div>
            <div className="text-xs font-semibold tracking-[0.25em] text-zinc-300 uppercase">
              SAME DATA.
            </div>
            <div className="text-xs font-extrabold tracking-[0.25em] text-white uppercase mt-0.5">
              DEEPER TRUTH.
            </div>
          </div>

          {/* Bottom Action Pillar List */}
          <div className="mt-8 md:mt-0 space-y-2.5 text-xs font-mono tracking-[0.3em] text-zinc-300/80 uppercase">
            <div className="hover:text-red-400 transition-colors">INVESTIGATE</div>
            <div className="hover:text-red-400 transition-colors">ANALYZE</div>
            <div className="hover:text-red-400 transition-colors">SIMULATE</div>
            <div className="hover:text-red-400 transition-colors">ACT</div>
          </div>
        </div>

        {/* ================= SECTION 2: RIGHT PANEL (~70% Width) ================= */}
        <div className="flex-1 h-full p-6 md:p-12 flex flex-col justify-between items-center relative overflow-y-auto">
          {/* Top Right Header Motto */}
          <div className="w-full flex justify-end items-center gap-6 text-[11px] font-sans font-bold tracking-[0.3em] text-zinc-400 uppercase">
            <span>PEOPLE</span>
            <span>DATA</span>
            <span>JUSTICE</span>
          </div>

          {/* Centered Glassmorphic Login Modal */}
          <div className="w-full max-w-md my-auto bg-[#0a101d]/85 border border-slate-700/60 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-[0_0_60px_rgba(0,0,0,0.9)]">
            
            {/* Modal Header: Emblem + JAAL Branding */}
            <div className="flex items-center gap-4 mb-6">
              <img
                src="/jaal-emblem.png"
                alt="National Emblem"
                className="w-10 h-12 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-widest text-white font-sans leading-none">
                    JAAL
                  </h1>
                  <span className="text-[9px] font-mono bg-red-950/80 text-red-400 border border-red-500/40 px-2 py-0.5 rounded uppercase tracking-widest">
                    NCRB / MHA
                  </span>
                </div>
                <p className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase mt-1">
                  OPERATION GREY LEDGER
                </p>
              </div>
            </div>

            {/* Section Title */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  SECURE INVESTIGATION PORTAL
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-1 font-mono text-[10px] text-[#858B92]">
                <span className="text-[#FF3038] font-bold">AUTHORIZED PERSONNEL ONLY</span>
                <span>•</span>
                <span className="text-emerald-400">SYSTEM STATUS: OPERATIONAL</span>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-[#E21B23]/15 border border-[#E21B23]/40 text-[#FF3038] text-xs flex items-center gap-2.5 font-mono">
                <AlertCircle className="w-4 h-4 text-[#FF3038] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Officer ID / Badge ID Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Officer ID / Badge ID"
                  className="w-full bg-[#080d19]/90 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E21B23] focus:ring-1 focus:ring-[#E21B23] transition-all font-sans"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-zinc-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-[#080d19]/90 border border-slate-700/80 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E21B23] focus:ring-1 focus:ring-[#E21B23] transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between text-xs py-1">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-[#E21B23] focus:ring-[#E21B23] focus:ring-offset-0 cursor-pointer"
                  />
                  <span>Remember workstation</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Please contact NCRB Master Admin to reset officer workstation credentials.");
                  }}
                  className="text-[#FF3038] hover:text-red-300 font-medium transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              {/* Primary Red Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-sm tracking-wider uppercase transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 font-mono"
              >
                {loading ? (
                  <span className="animate-pulse">Authenticating...</span>
                ) : (
                  <>
                    <span>SIGN IN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Secondary: Use Demo Investigator */}
              <button
                type="button"
                onClick={async () => {
                  setEmail("kartik@jaal.gov.in");
                  setPassword("investigator123");
                  try {
                    setLoading(true);
                    await login("kartik@jaal.gov.in", "investigator123");
                    if (onLoginSuccess) onLoginSuccess();
                  } catch (e: any) {
                    setError(e?.message || "Demo investigator login failed");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-mono flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Use Demo Investigator (Kartik • IND-IO-26189)</span>
              </button>
            </form>

            {/* Prototype Authentication Notice */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col items-center gap-1.5 text-center">
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>LOCAL PROTOTYPE AUTHENTICATION</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-sans">
                Authorized for NCRB / Special Cell Operational Review
              </span>
            </div>

          </div>

          {/* Empty Bottom Balance for Right Panel Flex */}
          <div className="h-4" />
        </div>

      </div>
    </div>
  );
};

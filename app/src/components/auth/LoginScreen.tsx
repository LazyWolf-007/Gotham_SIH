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
      {/* Crisp Background Image Container */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url('/login-bg.png')` }}
      />

      {/* Top Left: Back to Portal Button */}
      {onBackToLanding && (
        <button
          onClick={onBackToLanding}
          className="absolute top-6 left-6 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-xs text-zinc-300 hover:text-white transition-all backdrop-blur-md cursor-pointer shadow-lg group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-red-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Portal</span>
        </button>
      )}

      {/* Top Right Header Motto */}
      <div className="absolute top-6 right-8 z-20 flex items-center gap-6 text-[11px] font-sans font-bold tracking-[0.3em] text-zinc-400/90 uppercase">
        <span>PEOPLE</span>
        <span>DATA</span>
        <span>JUSTICE</span>
      </div>

      {/* Main Container: Login Card positioned right after the left police section (~34% to 38% from left) */}
      <div className="relative z-10 w-full h-full flex items-center justify-start pl-[6%] md:pl-[34%] lg:pl-[36%] xl:pl-[38%] pr-6 py-6">
        {/* Glassmorphic Login Card */}
        <div className="w-full max-w-[400px] xl:max-w-[420px] bg-[#0a121d]/60 border border-white/15 backdrop-blur-xl rounded-[28px] p-7 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.15)]">
            
            {/* Header: Emblem + JAAL Branding */}
            <div className="flex items-center gap-3.5 mb-5">
              <img
                src="/jaal-emblem.png"
                alt="National Emblem"
                className="w-9 h-11 object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]"
              />
              <div>
                <h1 className="text-2xl font-black tracking-widest text-white font-sans leading-tight">
                  JAAL
                </h1>
                <p className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                  OPERATION GREY LEDGER
                </p>
              </div>
            </div>

            {/* Subheading */}
            <div className="mb-5">
              <h2 className="text-base font-bold text-white tracking-tight">
                Secure Access
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                For Authorized Personnel Only
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5 font-mono">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Username / Email Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username / Email"
                  className="w-full bg-[#0b1422]/70 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/50 transition-all font-sans"
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
                  className="w-full bg-[#0b1422]/70 border border-slate-700/60 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/80 focus:ring-1 focus:ring-red-500/50 transition-all font-sans"
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
              <div className="flex items-center justify-between text-xs py-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-red-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span>Remember me</span>
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Please contact NCRB Master Admin to reset officer workstation credentials.");
                  }}
                  className="text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              {/* Primary Red Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#E63946] hover:bg-[#D62839] active:bg-[#C1121F] text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
              >
                {loading ? (
                  <span className="animate-pulse">Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider: OR */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-slate-700/50" />
                <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">OR</span>
                <div className="flex-1 h-px bg-slate-700/50" />
              </div>

              {/* Government SSO Button */}
              <button
                type="button"
                onClick={async () => {
                  setEmail("officer@jaal.gov.in");
                  setPassword("investigator123");
                  try {
                    setLoading(true);
                    await login("officer@jaal.gov.in", "investigator123");
                    if (onLoginSuccess) onLoginSuccess();
                  } catch (e: any) {
                    setError(e?.message || "Government SSO authentication failed");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-[#0b1422]/60 hover:bg-[#111e33]/80 border border-slate-700/50 text-zinc-200 hover:text-white text-xs font-sans font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <img
                  src="/jaal-emblem.png"
                  alt="Gov Emblem"
                  className="w-3.5 h-4 object-contain opacity-90"
                />
                <span>Sign In with Government SSO</span>
              </button>
            </form>

            {/* Footer Shield Tag */}
            <div className="mt-5 pt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-zinc-400/80">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Secured. Monitored. For a safer tomorrow.</span>
            </div>

          </div>
        </div>
      </div>
    );
  };

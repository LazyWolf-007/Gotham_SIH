import React, { useEffect } from "react";
import { HeroHeader } from "./components/header";
import HeroSection from "./components/hero-section";
import Features from "./components/features-3";
import Agenda from "./components/agenda";
import CallToAction from "./components/call-to-action";
import FooterSection from "./components/footer";

interface LandingPageProps {
  onLaunchWorkbench: () => void;
}

export default function LandingPage({ onLaunchWorkbench }: LandingPageProps) {
  useEffect(() => {
    const handleCustomNavigate = () => {
      onLaunchWorkbench();
    };

    window.addEventListener("navigate-workbench", handleCustomNavigate);
    return () => window.removeEventListener("navigate-workbench", handleCustomNavigate);
  }, [onLaunchWorkbench]);

  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-x-hidden font-sans selection:bg-red-600 selection:text-white">
      {/* Hero Header */}
      <HeroHeader onLaunchWorkbench={onLaunchWorkbench} />

      {/* Main Sections */}
      <main className="relative z-10">
        <HeroSection onLaunchWorkbench={onLaunchWorkbench} />
        <Features />
        <Agenda />
        <CallToAction onLaunchWorkbench={onLaunchWorkbench} />
      </main>

      {/* Footer */}
      <FooterSection />
    </div>
  );
}

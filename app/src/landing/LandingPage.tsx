import React, { useEffect } from "react";
import Dither from "./components/Dither";
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
    <div className="relative min-h-screen w-full bg-black text-white overflow-x-hidden font-sans selection:bg-white selection:text-black">
      {/* Background Dither Wave */}
      <div className="absolute top-0 left-0 w-full h-[100vh] max-h-[700px] pointer-events-none opacity-40 z-0">
        <Dither
          waveColor={[0.30980392156862746, 0.30980392156862746, 0.30980392156862746]}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.3}
          colorNum={4}
          pixelSize={2}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>

      {/* Hero Header */}
      <HeroHeader />

      {/* Main Sections */}
      <main className="relative z-10">
        <HeroSection />
        <Features />
        <Agenda />
        <CallToAction />
      </main>

      {/* Footer */}
      <FooterSection />
    </div>
  );
}

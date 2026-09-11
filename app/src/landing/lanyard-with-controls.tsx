import React, { useState, useRef, useEffect } from "react";
import Lanyard from "./ui/lanyard";
import CardTemplate, { type CardTemplateRef, type CardVariant } from "./card-template";
import { Download, Sparkles, Check } from "lucide-react";

interface LanyardWithControlsProps {
  position?: [number, number, number];
  containerClassName?: string;
  defaultName?: string;
  defaultVariant?: CardVariant;
  onLaunchWorkbench?: () => void;
}

export default function LanyardWithControls({
  position = [0, 0, 20],
  containerClassName,
  defaultName = "INVESTIGATOR",
  defaultVariant = "dark",
  onLaunchWorkbench,
}: LanyardWithControlsProps) {
  const [inputValue, setInputValue] = useState(defaultName);
  const [appliedName, setAppliedName] = useState(defaultName);
  const [cardVariant, setCardVariant] = useState<CardVariant>(defaultVariant);
  const [cardTextureUrl, setCardTextureUrl] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const cardTemplateRef = useRef<CardTemplateRef>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (cardTemplateRef.current) {
        await cardTemplateRef.current.captureTexture();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [appliedName, cardVariant]);

  const handleApply = async () => {
    setAppliedName(inputValue);
    if (cardTemplateRef.current) {
      await cardTemplateRef.current.captureTexture();
    }
  };

  const handleExport = () => {
    if (cardTemplateRef.current) {
      cardTemplateRef.current.exportCard();
    }
  };

  return (
    <div className={containerClassName || "relative w-full h-[600px] flex items-center justify-center"}>
      {/* Hidden Card Texture Renderer */}
      <CardTemplate
        ref={cardTemplateRef}
        userName={appliedName}
        variant={cardVariant}
        onTextureReady={(dataUrl) => setCardTextureUrl(dataUrl)}
        city="NCRB / MHA"
        date="OP GREY LEDGER"
      />

      {/* 3D Lanyard Canvas */}
      <Lanyard
        position={position}
        cardTextureUrl={cardTextureUrl}
        containerClassName="w-full h-full"
      />

      {/* Floating Badge Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 bg-[#0b1120]/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl text-xs max-w-sm w-full mx-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter Agent Name..."
          maxLength={18}
          className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-sky-500 uppercase"
        />
        <button
          onClick={handleApply}
          className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-all"
        >
          Update
        </button>
        <button
          onClick={handleExport}
          title="Download Investigator Badge PNG"
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

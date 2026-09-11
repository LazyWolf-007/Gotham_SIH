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
    </div>
  );
}

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Lanyard from "@/components/ui/lanyard";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import CardTemplate, { type CardTemplateRef, type CardVariant } from "@/components/card-template";
import { Download, Link, Check } from "lucide-react";
import { encryptLanyardData } from "@/lib/utils";

// X (Twitter) icon component
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// LinkedIn icon component
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const MAX_CHARACTERS = 20;

interface LanyardWithControlsProps {
  position?: [number, number, number];
  containerClassName?: string;
  defaultName?: string;
  defaultVariant?: CardVariant;
}

export default function LanyardWithControls({
  position = [0, 0, 20],
  containerClassName,
  defaultName = "",
  defaultVariant = "dark",
}: LanyardWithControlsProps) {
  const [inputValue, setInputValue] = useState(defaultName);
  const [appliedName, setAppliedName] = useState(defaultName);
  const [cardVariant, setCardVariant] = useState<CardVariant>(defaultVariant);
  const [appliedVariant, setAppliedVariant] = useState<CardVariant>(defaultVariant);
  const [cardTextureUrl, setCardTextureUrl] = useState<string | undefined>(undefined);
  const [textureKey, setTextureKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const cardTemplateRef = useRef<CardTemplateRef>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Auto-capture texture when component mounts with a defaultName from URL
  useEffect(() => {
    // If no defaultName, mark as initialized immediately
    if (!defaultName) {
      setIsInitialized(true);
      return;
    }
    
    // If there's a defaultName, wait for card template to render then capture
    const timer = setTimeout(async () => {
      if (cardTemplateRef.current) {
        await cardTemplateRef.current.captureTexture();
      }
      setIsInitialized(true);
    }, 150);
    
    return () => clearTimeout(timer);
  }, [defaultName]);

  // Generate shareable URL with encrypted username and variant
  const getShareableUrl = useCallback(() => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    if (appliedName) {
      const encrypted = encryptLanyardData(appliedName, appliedVariant);
      return `${baseUrl}/lanyard?u=${encrypted}`;
    }
    return `${baseUrl}/lanyard`;
  }, [appliedName, appliedVariant]);

  // Share message templates
  const shareMessage = appliedName
    ? `I'll be at @v0 Prompt to Production New York City! Check out my personalized lanyard`
    : `Check out v0 IRL New York City! Create your personalized event lanyard`;

  const handleShareX = useCallback(() => {
    const url = getShareableUrl();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
  }, [getShareableUrl, shareMessage]);

  const handleShareLinkedIn = useCallback(() => {
    const url = getShareableUrl();
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, "_blank", "noopener,noreferrer");
  }, [getShareableUrl]);

  const handleCopyLink = useCallback(async () => {
    const url = getShareableUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  }, [getShareableUrl]);


  const characterCount = inputValue.length;
  const isAtLimit = characterCount >= MAX_CHARACTERS;
  const isNearLimit = characterCount >= MAX_CHARACTERS - 5;
  const hasChanges = inputValue !== appliedName || cardVariant !== appliedVariant;

  const handleTextureReady = useCallback((dataUrl: string) => {
    setCardTextureUrl(dataUrl);
    setTextureKey((prev) => prev + 1);
  }, []);

  const handleExport = () => {
    cardTemplateRef.current?.exportCard();
  };

  const handleApplyName = async () => {
    setAppliedName(inputValue);
    setAppliedVariant(cardVariant);
    // Capture the card template as a texture
    await cardTemplateRef.current?.captureTexture();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARACTERS) {
      setInputValue(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && hasChanges) {
      handleApplyName();
    }
  };

  // Show loading spinner while waiting for initialization
  if (!isInitialized) {
    return (
      <div className="flex flex-col">
        <CardTemplate
          ref={cardTemplateRef}
          userName={inputValue}
          variant={cardVariant}
          onTextureReady={handleTextureReady}
        />
        <div className={containerClassName}>
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* Hidden card template for texture generation */}
      <CardTemplate
        ref={cardTemplateRef}
        userName={inputValue || "OFFICER-01"}
        variant={cardVariant}
        onTextureReady={handleTextureReady}
        city="NEW DELHI"
        date="2026.04.12"
      />
      <Lanyard
        key={textureKey}
        position={position}
        containerClassName={containerClassName}
        cardTextureUrl={cardTextureUrl}
        canvasRef={canvasRef}
      />
    </div>
  );
}

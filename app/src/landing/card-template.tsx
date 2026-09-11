import React, { forwardRef, useImperativeHandle, useEffect, useState } from "react";

export type CardVariant = "dark" | "light";

interface CardTemplateProps {
  userName: string;
  variant: CardVariant;
  onTextureReady: (dataUrl: string) => void;
  city?: string;
  date?: string;
}

export interface CardTemplateRef {
  captureTexture: () => Promise<void>;
  exportCard: () => void;
}

const CANVAS_SIZE = 1376;

const CardTemplate = forwardRef<CardTemplateRef, CardTemplateProps>(
  ({ userName, variant, onTextureReady, city = "NCRB / MHA", date = "OP GREY LEDGER" }, ref) => {
    const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);

    const imageSrc = variant === "dark" ? "/card-base-dark.png" : "/card-base-light.png";
    const textColor = variant === "dark" ? "#ffffff" : "#000000";

    // Preload the base card image
    useEffect(() => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setBaseImage(img);
      img.src = imageSrc;
    }, [imageSrc]);

    const captureTexture = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      // Draw base card image
      if (baseImage) {
        ctx.drawImage(baseImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      } else {
        ctx.fillStyle = "#090d16";
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      }

      // Draw user name / title
      const displayName = userName || "CHIEF INVESTIGATOR";
      ctx.fillStyle = textColor;
      ctx.font = 'bold 50px "Inter", monospace';
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      const textX = CANVAS_SIZE / 2 - 55;
      const textY = CANVAS_SIZE - 400;
      ctx.fillText(displayName.toUpperCase(), textX, textY);

      // Render agency label
      if (city) {
        ctx.fillStyle = textColor;
        ctx.font = '600 44px "Inter", monospace';
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        const cityTextX = CANVAS_SIZE / 2 - 55;
        const cityTextY = CANVAS_SIZE - 1226;
        ctx.fillText(city.toUpperCase(), cityTextX, cityTextY);
      }

      // Render case label
      if (date) {
        ctx.fillStyle = "#38bdf8";
        ctx.font = 'bold 42px "Inter", monospace';
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        const dateTextX = CANVAS_SIZE / 2 - 55;
        const dateTextY = CANVAS_SIZE - 1170;
        ctx.fillText(date.toUpperCase(), dateTextX, dateTextY);
      }

      const dataUrl = canvas.toDataURL("image/png");
      onTextureReady(dataUrl);
    };

    const exportCard = () => {
      const CROP_BOTTOM = 334;
      const EXPORT_HEIGHT = CANVAS_SIZE - CROP_BOTTOM;

      const fullCanvas = document.createElement("canvas");
      fullCanvas.width = CANVAS_SIZE;
      fullCanvas.height = CANVAS_SIZE;
      const fullCtx = fullCanvas.getContext("2d");

      if (!fullCtx) return;

      if (baseImage) {
        fullCtx.drawImage(baseImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      } else {
        fullCtx.fillStyle = "#090d16";
        fullCtx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      }

      const displayName = userName || "CHIEF INVESTIGATOR";
      fullCtx.fillStyle = textColor;
      fullCtx.font = 'bold 50px "Inter", monospace';
      fullCtx.textAlign = "right";
      fullCtx.textBaseline = "middle";

      const textX = CANVAS_SIZE / 2 - 55;
      const textY = CANVAS_SIZE - 400;
      fullCtx.fillText(displayName.toUpperCase(), textX, textY);

      if (city) {
        fullCtx.fillStyle = textColor;
        fullCtx.font = '600 44px "Inter", monospace';
        fullCtx.textAlign = "right";
        fullCtx.textBaseline = "middle";
        fullCtx.fillText(city.toUpperCase(), CANVAS_SIZE / 2 - 55, CANVAS_SIZE - 1226);
      }

      if (date) {
        fullCtx.fillStyle = "#38bdf8";
        fullCtx.font = 'bold 42px "Inter", monospace';
        fullCtx.textAlign = "right";
        fullCtx.textBaseline = "middle";
        fullCtx.fillText(date.toUpperCase(), CANVAS_SIZE / 2 - 55, CANVAS_SIZE - 1170);
      }

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = CANVAS_SIZE;
      exportCanvas.height = EXPORT_HEIGHT;
      const exportCtx = exportCanvas.getContext("2d");

      if (!exportCtx) return;

      exportCtx.drawImage(
        fullCanvas,
        0, 0, CANVAS_SIZE, EXPORT_HEIGHT,
        0, 0, CANVAS_SIZE, EXPORT_HEIGHT
      );

      const dataUrl = exportCanvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `investigator-badge-${userName || "gotham-sih"}.png`;
      link.href = dataUrl;
      link.click();
    };

    useImperativeHandle(ref, () => ({
      captureTexture,
      exportCard,
    }));

    return null;
  }
);

CardTemplate.displayName = "CardTemplate";

export default CardTemplate;

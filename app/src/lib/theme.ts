import { ObjectType, LinkType } from "../types";

export const OBJECT_TYPE_COLORS: Record<ObjectType, { bg: string; border: string; glow: string; text: string; icon: string }> = {
  Person: {
    bg: "#3b82f6", // Blue
    border: "#60a5fa",
    glow: "rgba(59, 130, 246, 0.4)",
    text: "#ffffff",
    icon: "User",
  },
  Phone: {
    bg: "#06b6d4", // Cyan
    border: "#22d3ee",
    glow: "rgba(6, 182, 212, 0.4)",
    text: "#ffffff",
    icon: "Phone",
  },
  Account: {
    bg: "#10b981", // Emerald
    border: "#34d399",
    glow: "rgba(16, 185, 129, 0.4)",
    text: "#ffffff",
    icon: "CreditCard",
  },
  Organization: {
    bg: "#8b5cf6", // Purple
    border: "#a78bfa",
    glow: "rgba(139, 92, 246, 0.4)",
    text: "#ffffff",
    icon: "Building2",
  },
  FIR: {
    bg: "#ef4444", // Red
    border: "#f87171",
    glow: "rgba(239, 68, 68, 0.4)",
    text: "#ffffff",
    icon: "FileWarning",
  },
  Location: {
    bg: "#f59e0b", // Amber
    border: "#fbbf24",
    glow: "rgba(245, 158, 11, 0.4)",
    text: "#000000",
    icon: "MapPin",
  },
  Camera: {
    bg: "#14b8a6", // Teal
    border: "#2dd4bf",
    glow: "rgba(20, 184, 166, 0.4)",
    text: "#ffffff",
    icon: "Camera",
  },
  Vehicle: {
    bg: "#f97316", // Orange
    border: "#fb923c",
    glow: "rgba(249, 115, 22, 0.4)",
    text: "#ffffff",
    icon: "Car",
  },
};

export const LINK_TYPE_COLORS: Record<LinkType, { color: string; style: "solid" | "dashed" | "dotted"; width: number }> = {
  CALLED: { color: "#38bdf8", style: "dashed", width: 1.5 },
  PAID: { color: "#10b981", style: "solid", width: 2.2 },
  OWNS: { color: "#fbbf24", style: "solid", width: 1.5 },
  USES: { color: "#818cf8", style: "solid", width: 1.5 },
  SEEN_AT: { color: "#c084fc", style: "dashed", width: 1.5 },
  MEMBER_OF: { color: "#a855f7", style: "solid", width: 1.8 },
  MENTIONED_IN: { color: "#f87171", style: "dashed", width: 1.5 },
  SAME_AS: { color: "#2dd4bf", style: "dotted", width: 2.0 },
};

export const COMMUNITY_PALETTE = [
  "#3b82f6", // 0: Front Orgs / Kingpin cluster (Blue)
  "#f59e0b", // 1: Accountant bottleneck (Amber)
  "#10b981", // 2: Mule network (Emerald)
  "#ef4444", // 3: Mandi operations (Red)
  "#8b5cf6", // 4: Logistics / Surveillance (Purple)
  "#06b6d4", // 5: Cyber / Phones (Cyan)
  "#ec4899", // 6: Pink
  "#14b8a6", // 7: Teal
];

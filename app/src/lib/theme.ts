import { ObjectType, LinkType } from "../types";

// Official Palette Tokens (Phase 1 Specification)
export const THEME_COLORS = {
  bgPrimary: "#050607",
  bgSecondary: "#0A0D10",
  card: "#0E1216",
  border: "#20252A",
  redPrimary: "#E21B23",
  redCritical: "#FF3038",
  textPrimary: "#F2F2F2",
  textSecondary: "#858B92",
  textMuted: "#555C63",
} as const;

export const OBJECT_TYPE_COLORS: Record<ObjectType, { bg: string; border: string; glow: string; text: string; icon: string }> = {
  Person: {
    bg: "#E21B23", // Primary Red
    border: "#FF3038",
    glow: "rgba(226, 27, 35, 0.4)",
    text: "#ffffff",
    icon: "User",
  },
  Phone: {
    bg: "#475569", // Steel / Slate (no neon cyan)
    border: "#64748b",
    glow: "rgba(71, 85, 105, 0.3)",
    text: "#ffffff",
    icon: "Phone",
  },
  Account: {
    bg: "#059669", // Controlled Emerald
    border: "#10b981",
    glow: "rgba(16, 185, 129, 0.3)",
    text: "#ffffff",
    icon: "CreditCard",
  },
  Organization: {
    bg: "#b45309", // Amber/Gold
    border: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.3)",
    text: "#ffffff",
    icon: "Building2",
  },
  FIR: {
    bg: "#991b1b", // Deep Crime Red
    border: "#dc2626",
    glow: "rgba(220, 38, 38, 0.3)",
    text: "#ffffff",
    icon: "FileWarning",
  },
  Location: {
    bg: "#334155", // Slate
    border: "#475569",
    glow: "rgba(51, 65, 85, 0.3)",
    text: "#f1f5f9",
    icon: "MapPin",
  },
  Camera: {
    bg: "#0f766e", // Deep Teal
    border: "#14b8a6",
    glow: "rgba(20, 184, 166, 0.3)",
    text: "#ffffff",
    icon: "Camera",
  },
  Vehicle: {
    bg: "#3f3f46", // Dark Zinc
    border: "#71717a",
    glow: "rgba(63, 63, 70, 0.3)",
    text: "#ffffff",
    icon: "Car",
  },
};

// Cytoscape native node shapes for subtle, clean entity distinction
export const OBJECT_TYPE_SHAPES: Record<ObjectType, string> = {
  Person: "ellipse",
  Phone: "round-rectangle",
  Account: "round-diamond",
  Organization: "hexagon",
  FIR: "rectangle",
  Location: "barrel",
  Camera: "cut-rectangle",
  Vehicle: "tag",
};

export const LINK_TYPE_COLORS: Record<LinkType, { color: string; style: "solid" | "dashed" | "dotted"; width: number }> = {
  CALLED: { color: "#475569", style: "dashed", width: 1.2 }, // Restrained CDR lines
  PAID: { color: "#10b981", style: "solid", width: 2.2 },   // Financial routing
  OWNS: { color: "#d97706", style: "solid", width: 1.4 },
  USES: { color: "#64748b", style: "solid", width: 1.2 },
  SEEN_AT: { color: "#52525b", style: "dashed", width: 1.2 },
  MEMBER_OF: { color: "#b45309", style: "solid", width: 1.6 },
  MENTIONED_IN: { color: "#ef4444", style: "dashed", width: 1.4 },
  SAME_AS: { color: "#38bdf8", style: "dotted", width: 2.0 },
};

export const COMMUNITY_PALETTE = [
  "#dc2626", // 0: Core Network Target Cluster (Red)
  "#f59e0b", // 1: Financial Routing Bottleneck (Amber)
  "#10b981", // 2: Account Mule Layer (Emerald)
  "#64748b", // 3: Mandi / Physical Logistics (Slate)
  "#7c3aed", // 4: Associates / Surveillance (Deep Violet)
  "#0284c7", // 5: Communications (Muted Blue)
  "#475569", // 6: Peripheral
  "#059669", // 7: Secondary Accounts
];

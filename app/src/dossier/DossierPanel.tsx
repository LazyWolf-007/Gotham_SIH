import React, { useState } from "react";
import { GraphNode, GraphEdge, PatternHit } from "../types";
import { useCase } from "../context/CaseContext";
import { useToast } from "../context/ToastContext";
import { ProvenanceBadge } from "../components/ProvenanceBadge";
import {
  Share2,
  BookmarkPlus,
  Scissors,
  Bot,
  GitFork,
  Check,
  Shield,
  ExternalLink,
  Sparkles,
  ArrowRight,
  FolderPlus,
  Layers,
} from "lucide-react";

interface DossierPanelProps {
  node: GraphNode | null;
  selectedEdge: GraphEdge | null;
  incidentEdges: GraphEdge[];
  onSelectNeighbor: (nodeId: string) => void;
  onIsolateNeighborhood: (seedId: string) => void;
  onRunArrestSimulation: (targetId: string) => void;
  onAskCopilot: (seedId: string) => void;
  onRunScenario?: () => void;
  patterns: PatternHit[];
}

const FEMALE_NAMES = new Set([
  "roshni", "meenal", "kavita", "nilofer", "yasmin", "naseem", "tamanna", "nargis",
  "mehrun", "salma", "pallavi", "hina", "asma", "samina", "rukhsana", "farida",
  "rukhsar", "shabina", "sultana", "kulsum", "najma", "saira", "nasreen", "swati",
  "rehana", "bushra", "afroz", "shireen", "heena", "parveen", "zarina", "razia",
  "pooja", "priya", "sunita", "ananya", "fatima", "ayesha", "zoya", "simran",
  "neha", "deepa", "anita", "geeta", "rekha", "radha", "seema", "shobha", "divya", "shreya"
]);

interface EntityVisualMeta {
  imageSrc: string;
  categorySymbol: string;
  badgeText: string;
  badgeColor: string;
  genderPill: string;
  dotColor: string;
  overlayLabel: string;
  roleLabel: string;
  genderLabel: string;
}

function getEntityVisualMeta(node: GraphNode | null, targetId: string, targetLabel: string): EntityVisualMeta {
  const type = node?.type || (targetId.startsWith("person:") ? "Person" : "Person");
  const lowerLabel = targetLabel.toLowerCase();
  const lowerId = targetId.toLowerCase();
  const firstName = (node?.attributes?.name || targetLabel).split(" ")[0].toLowerCase();

  // 1. PERSON
  if (type === "Person") {
    const isFemale =
      FEMALE_NAMES.has(firstName) ||
      node?.attributes?.gender === "female" ||
      node?.attributes?.gender === "F";

    if (targetId === "person:naveen_bhatia") {
      return {
        imageSrc: "/naveen_bhatia.jpg",
        categorySymbol: "♂",
        badgeText: "KEY NODE",
        badgeColor: "bg-[#E21B23]/20 border border-[#E21B23]/60 text-[#FF3038]",
        genderPill: "MALE • ACCOUNTANT",
        dotColor: "bg-[#E21B23] shadow-[0_0_6px_rgba(226,27,35,0.9)]",
        overlayLabel: "♂ MALE (KEY)",
        roleLabel: "Accountant & Key Node",
        genderLabel: "Male Key Subject",
      };
    }

    if (isFemale) {
      return {
        imageSrc: "/female_suspect.jpg",
        categorySymbol: "♀",
        badgeText: "FEMALE SUSPECT",
        badgeColor: "bg-rose-500/20 border border-rose-500/60 text-rose-300",
        genderPill: "FEMALE • SUSPECT",
        dotColor: "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)]",
        overlayLabel: "♀ FEMALE",
        roleLabel: "Female Person of Interest",
        genderLabel: "Female Subject",
      };
    }

    return {
      imageSrc: "/male_suspect.jpg",
      categorySymbol: "♂",
      badgeText: targetId === "person:vikram_haleja" ? "BENEFICIARY" : "MALE SUSPECT",
      badgeColor: targetId === "person:vikram_haleja"
        ? "bg-amber-500/20 border border-amber-500/60 text-amber-300"
        : "bg-blue-500/20 border border-blue-500/60 text-blue-300",
      genderPill: targetId === "person:vikram_haleja" ? "MALE • KINGPIN" : "MALE • SUSPECT",
      dotColor: "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.9)]",
      overlayLabel: "♂ MALE",
      roleLabel: targetId === "person:vikram_haleja" ? "Primary Beneficiary" : "Male Person of Interest",
      genderLabel: "Male Subject",
    };
  }

  // 2. FIR / SUBSTANCE / CONTRABAND
  if (
    type === "FIR" ||
    lowerLabel.includes("substance") ||
    lowerLabel.includes("contraband") ||
    lowerLabel.includes("seizure") ||
    lowerId.includes("fir")
  ) {
    return {
      imageSrc: "/seized_evidence.jpg",
      categorySymbol: "⚖",
      badgeText: "SEIZED EVIDENCE",
      badgeColor: "bg-amber-500/20 border border-amber-500/60 text-amber-300",
      genderPill: "SEIZURE • IPC 420",
      dotColor: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.9)]",
      overlayLabel: "CONTRABAND / FIR",
      roleLabel: "Seized Evidence & Substance Record",
      genderLabel: "Seized Contraband Exhibit",
    };
  }

  // 3. PHONE / TELECOM
  if (type === "Phone" || lowerId.includes("phone:") || lowerId.includes("ph0")) {
    return {
      imageSrc: "/phone_intercept.jpg",
      categorySymbol: "📞",
      badgeText: "CDR WIRE-TAP",
      badgeColor: "bg-cyan-500/20 border border-cyan-500/60 text-cyan-300",
      genderPill: "TELECOM • INTERCEPT",
      dotColor: "bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.9)]",
      overlayLabel: "PHONE INTERCEPT",
      roleLabel: "Monitored Burner Device",
      genderLabel: "Cellular Intercept",
    };
  }

  // 4. ACCOUNT / BANKING
  if (type === "Account" || lowerId.includes("acc:")) {
    return {
      imageSrc: "/bank_account.jpg",
      categorySymbol: "₹",
      badgeText: "BANKING CONDUIT",
      badgeColor: "bg-emerald-500/20 border border-emerald-500/60 text-emerald-300",
      genderPill: "FINANCIAL • HAWALA",
      dotColor: "bg-emerald-500 shadow-[0_0_6px_rgba(168,85,247,0.9)]",
      overlayLabel: "BANK LEDGER",
      roleLabel: "Financial Transit Account",
      genderLabel: "Banking Conduit",
    };
  }

  // 5. ORGANIZATION / SHELL FIRM
  if (type === "Organization" || lowerId.includes("org:")) {
    return {
      imageSrc: "/shell_company.jpg",
      categorySymbol: "🏢",
      badgeText: "SHELL SYNDICATE",
      badgeColor: "bg-purple-500/20 border border-purple-500/60 text-purple-300",
      genderPill: "FRONT • SHELL CO",
      dotColor: "bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.9)]",
      overlayLabel: "FRONT CO.",
      roleLabel: "Commercial Front Enterprise",
      genderLabel: "Front Commercial Firm",
    };
  }

  // 6. LOCATION / MANDI
  if (type === "Location" || lowerId.includes("loc:")) {
    return {
      imageSrc: "/surveillance_location.jpg",
      categorySymbol: "📍",
      badgeText: "SURVEILLANCE GEO",
      badgeColor: "bg-orange-500/20 border border-orange-500/60 text-orange-300",
      genderPill: "LOCATION • MANDI",
      dotColor: "bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.9)]",
      overlayLabel: "MANDI SCENE",
      roleLabel: "Produce Mandi Warehouse Hub",
      genderLabel: "Mandi Logistics Node",
    };
  }

  // 7. VEHICLE
  if (type === "Vehicle" || lowerId.includes("veh:")) {
    return {
      imageSrc: "/surveillance_vehicle.jpg",
      categorySymbol: "🚚",
      badgeText: "IMPOUND LOGISTICS",
      badgeColor: "bg-yellow-500/20 border border-yellow-500/60 text-yellow-300",
      genderPill: "VEHICLE • TATA 407",
      dotColor: "bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.9)]",
      overlayLabel: "LOGISTICS TRUCK",
      roleLabel: "Impounded Commercial Transport",
      genderLabel: "Logistics Vehicle",
    };
  }

  // 8. CAMERA
  if (type === "Camera" || lowerId.includes("cam:")) {
    return {
      imageSrc: "/cctv_camera.jpg",
      categorySymbol: "📹",
      badgeText: "CCTV OPTICAL FEED",
      badgeColor: "bg-red-500/20 border border-red-500/60 text-red-300",
      genderPill: "CCTV • LIVE CAM-04",
      dotColor: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]",
      overlayLabel: "● REC CCTV",
      roleLabel: "Optical Surveillance Monitor",
      genderLabel: "CCTV Optical Feed",
    };
  }

  // Fallback
  const fallbackType = String(type || "NODE").toUpperCase();
  return {
    imageSrc: "/male_suspect.jpg",
    categorySymbol: "◈",
    badgeText: fallbackType,
    badgeColor: "bg-zinc-500/20 border border-zinc-500/60 text-zinc-300",
    genderPill: "ENTITY NODE",
    dotColor: "bg-zinc-500 shadow-[0_0_6px_rgba(113,113,122,0.9)]",
    overlayLabel: fallbackType,
    roleLabel: "Investigative Graph Entity",
    genderLabel: "Investigative Entity",
  };
}

export const DossierPanel: React.FC<DossierPanelProps> = ({
  node,
  selectedEdge,
  incidentEdges,
  onSelectNeighbor,
  onIsolateNeighborhood,
  onRunArrestSimulation,
  onAskCopilot,
  onRunScenario,
  patterns,
}) => {
  const { addToDossier, removeFromDossier, isInDossier, dossierItems } = useCase();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"overview" | "links" | "evidence" | "analytics">("overview");

  // Fallback / default displayed target is Naveen Bhatia
  const targetId = node?.id || "person:naveen_bhatia";
  const targetLabel = node?.label || "Naveen Bhatia";
  const isAccountant = targetId === "person:naveen_bhatia";
  const isKingpin = targetId === "person:vikram_haleja";

  const visualMeta = getEntityVisualMeta(node, targetId, targetLabel);

  const degree = node?.metrics?.degree ?? (isAccountant ? 6 : incidentEdges.length || 4);
  const betweenness =
    node?.metrics?.betweenness !== undefined
      ? Number(node.metrics.betweenness).toFixed(5)
      : isAccountant
      ? "0.02555"
      : "0.00120";
  const betweennessRank =
    node?.metrics?.betweenness_rank_persons ?? (isAccountant ? 1 : 4);

  const linksCount = incidentEdges.length > 0 ? incidentEdges.length : 6;
  const isSaved = isInDossier(targetId);

  const handleToggleSaveToDossier = () => {
    if (isSaved) {
      removeFromDossier(targetId);
      showToast(`Removed ${targetLabel} from Case Dossier`, "info");
    } else {
      addToDossier({
        id: targetId,
        type: node?.type === "FIR" ? "EVIDENCE" : "SUBJECT",
        title: targetLabel,
        subtitle: `${visualMeta.roleLabel} • Betweenness Rank #${betweennessRank}`,
        category: node?.type || "SUBJECT",
        targetEntityId: targetId,
      });
      showToast(`Added ${targetLabel} to Case Dossier`, "success");
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between bg-[#050607] border-l border-[#20252A] p-4 select-none shrink-0 overflow-y-auto z-30 font-sans">
      {/* Top Main Dossier Card */}
      <div className="bg-[#0E1216] border border-[#20252A] rounded-2xl p-4 shadow-xl space-y-4">
        {/* Header Provenance Bar */}
        <div className="flex items-center justify-between border-b border-[#20252A] pb-2">
          <span className="text-[10px] font-mono text-[#858B92] uppercase font-bold">
            SUBJECT DOSSIER
          </span>
          <ProvenanceBadge type="GRAPH ANALYSIS" />
        </div>

        {/* Profile Header Row */}
        <div className="flex gap-3.5 items-start">
          {/* Tactical Forensic Image Frame */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 min-w-[80px] min-h-[80px] rounded-2xl overflow-hidden border border-[#20252A] bg-[#0A0D10] shrink-0 shadow-xl group">
            <img
              src={visualMeta.imageSrc}
              alt={targetLabel}
              key={visualMeta.imageSrc + targetId}
              className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/male_suspect.jpg";
              }}
            />
            {/* Status dot */}
            <div className={`absolute top-1.5 left-1.5 w-2 h-2 rounded-full ${visualMeta.dotColor}`} />

            {/* Corner Tactical Reticle */}
            <div className="absolute top-1 right-1.5 text-[8px] font-mono text-white/40 pointer-events-none">
              [+]
            </div>

            {/* Crucial On-Image Label Badge at the bottom */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-2.5 pb-1 px-1 flex items-center justify-center">
              <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black tracking-wider uppercase bg-[#0E1216]/95 border border-white/20 text-white shadow-md flex items-center gap-1 backdrop-blur-sm truncate max-w-full">
                <span className="text-[9px]">{visualMeta.categorySymbol}</span>
                <span className="truncate">{visualMeta.overlayLabel}</span>
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-base font-bold text-white truncate tracking-tight">
                {targetLabel}
              </h2>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 ${visualMeta.badgeColor}`}>
                {visualMeta.badgeText}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#858B92] truncate mt-0.5">
              <span className="truncate">{targetId}</span>
              <span className="text-[10px] text-zinc-500 shrink-0">• {visualMeta.genderPill}</span>
            </div>

            {/* Metrics List */}
            <div className="mt-2 space-y-0.5 text-[11px] text-slate-300 font-sans">
              <div>
                <span className="text-[#858B92]">
                  {visualMeta.roleLabel}
                </span>{" "}
                | Degree: <span className="font-semibold text-white">{degree}</span>
              </div>
              <div>
                Betweenness:{" "}
                <span className="font-mono font-bold text-white">{betweenness}</span>{" "}
                <span className="text-amber-400 font-bold">(Rank #{betweennessRank})</span>
              </div>
              <div className="text-[10px] text-[#858B92]">
                {node?.type === "Person" || !node ? (
                  <>Connected Accounts: <span className="text-white font-medium">2</span> | Organizations: <span className="text-white font-medium">1</span></>
                ) : node.type === "FIR" ? (
                  <>Offense: <span className="text-amber-300 font-medium">IPC 420 / 120B</span> | Evidence Tags: <span className="text-white font-medium">3</span></>
                ) : node.type === "Phone" ? (
                  <>Carrier: <span className="text-cyan-300 font-medium">GSM Intercept</span> | Logged Calls: <span className="text-white font-medium">141</span></>
                ) : node.type === "Account" ? (
                  <>Ledger: <span className="text-emerald-300 font-medium">NEFT Hawala</span> | Inflows: <span className="text-white font-medium">₹5,00,000</span></>
                ) : node.type === "Location" ? (
                  <>Sector: <span className="text-orange-300 font-medium">Azadpur Mandi</span> | Coordinates: <span className="text-white font-medium">28.70°N, 77.16°E</span></>
                ) : (
                  <>Connections: <span className="text-white font-medium">{degree}</span> | Status: <span className="text-white font-medium">Active Record</span></>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#20252A] pb-2 text-xs font-mono gap-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`transition-colors uppercase tracking-wider ${
              activeTab === "overview"
                ? "text-white font-bold border-b-2 border-[#E21B23] pb-1 -mb-2"
                : "text-[#858B92] hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("links")}
            className={`transition-colors uppercase tracking-wider ${
              activeTab === "links"
                ? "text-white font-bold border-b-2 border-[#E21B23] pb-1 -mb-2"
                : "text-[#858B92] hover:text-white"
            }`}
          >
            Links ({linksCount})
          </button>
          <button
            onClick={() => setActiveTab("evidence")}
            className={`transition-colors uppercase tracking-wider ${
              activeTab === "evidence"
                ? "text-white font-bold border-b-2 border-[#E21B23] pb-1 -mb-2"
                : "text-[#858B92] hover:text-white"
            }`}
          >
            Evidence
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`transition-colors uppercase tracking-wider ${
              activeTab === "analytics"
                ? "text-white font-bold border-b-2 border-[#E21B23] pb-1 -mb-2"
                : "text-[#858B92] hover:text-white"
            }`}
          >
            Metrics
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-3">
            {/* Intel Briefing Card */}
            <div className="p-3 rounded-xl bg-[#0A0D10] border border-[#20252A] text-xs text-slate-300 leading-relaxed font-sans">
              {isAccountant
                ? "Central figure in financial routing. Appears in multiple transaction chains and organizational links connecting Azadpur mandi to front companies."
                : isKingpin
                ? "Suspected primary beneficiary. Isolated by shell accounts and intermediate cut-points to maintain plausible deniability."
                : node?.type === "FIR"
                ? "Official police First Information Report documenting suspected financial fraud, produce skimming, and contraband diversion under Section 420/120B IPC."
                : node?.type === "Phone"
                ? "Intercepted mobile communications node exhibiting high-frequency call bursts and CDR linkages across suspected mule handsets."
                : node?.type === "Account"
                ? "Flagged banking conduit exhibiting suspicious transaction velocity, pass-through routing, and direct ties to syndicate distribution."
                : node?.type === "Organization"
                ? "Commercial front enterprise registered at Azadpur Mandi, suspected of facilitating hawala settlement and covert fund routing."
                : node?.type === "Location"
                ? "Wholesale terminal logistics hub serving as physical aggregation point for goods transit and undocumented cash handovers."
                : node?.type === "Vehicle"
                ? "Commercial transport carrier identified in surveillance logs operating along suspect transit corridors."
                : node?.type === "Camera"
                ? "Surveillance optical monitoring post tracking ingress/egress points and vehicle movements near syndicate hubs."
                : `Active ${visualMeta.genderLabel.toLowerCase()} in Operation Grey Ledger network. Linked across ${incidentEdges.length || degree} primary investigative channels.`}
            </div>

            {/* 3 Primary Action Buttons */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onIsolateNeighborhood(targetId);
                    showToast(`Isolated 2-hop neighborhood for ${targetId}`, "info");
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#0A0D10] hover:bg-[#20252A] border border-[#20252A] text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-sm group"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#858B92] group-hover:text-white" />
                  <span className="truncate">View 2-Hop Network</span>
                </button>

                <button
                  onClick={handleToggleSaveToDossier}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                    isSaved
                      ? "bg-emerald-950/40 border-emerald-700/60 text-emerald-300"
                      : "bg-[#0A0D10] hover:bg-[#20252A] border-[#20252A] text-slate-200"
                  }`}
                >
                  {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FolderPlus className="w-3.5 h-3.5 text-[#858B92]" />}
                  <span className="truncate">{isSaved ? "In Dossier" : "Add to Dossier"}</span>
                </button>
              </div>

              {/* Critical Red Intervention Action */}
              <button
                onClick={() => {
                  onRunArrestSimulation(targetId);
                  showToast(`Executing counterfactual arrest simulation on ${targetId}`, "success");
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#E21B23] hover:bg-[#FF3038] text-white text-xs font-bold font-mono transition-all shadow-md shadow-[#E21B23]/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Simulate Arrest Cut</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "links" && (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            <div className="text-[10px] font-mono text-[#858B92] uppercase">
              CONNECTED NODES & RELATIONSHIPS
            </div>
            {incidentEdges.length > 0 ? (
              incidentEdges.slice(0, 8).map((edge, idx) => {
                const isOut = edge.source === targetId;
                const neighborId = isOut ? edge.target : edge.source;
                return (
                  <div
                    key={idx}
                    onClick={() => onSelectNeighbor(neighborId)}
                    className="p-2 rounded-lg bg-[#0A0D10] border border-[#20252A] hover:border-[#E21B23]/60 transition-colors flex items-center justify-between cursor-pointer text-xs font-mono group"
                  >
                    <div className="truncate min-w-0">
                      <span className="text-[#FF3038] font-bold mr-1.5">{edge.type}</span>
                      <span className="text-slate-300 group-hover:text-white truncate">
                        {neighborId}
                      </span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-[#555C63] group-hover:text-white shrink-0 ml-2" />
                  </div>
                );
              })
            ) : (
              <div className="space-y-2">
                {[
                  { type: "OWNS", target: "phone:ph00", label: "Primary Phone" },
                  { type: "PAID", target: "acc:a02", label: "Bank Account 02" },
                  { type: "PAID", target: "acc:a01", label: "Bhatia Associates A/C" },
                  { type: "MEMBER_OF", target: "org:bhatia_associates", label: "Front Firm" },
                  { type: "SEEN_AT", target: "loc:azadpur_mandi", label: "Produce Mandi" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectNeighbor(item.target)}
                    className="p-2 rounded-lg bg-[#0A0D10] border border-[#20252A] hover:border-[#E21B23]/60 transition-colors flex items-center justify-between cursor-pointer text-xs font-mono group"
                  >
                    <div>
                      <span className="text-[#FF3038] font-bold mr-1.5">{item.type}</span>
                      <span className="text-slate-300 group-hover:text-white">{item.target}</span>
                      <span className="text-[10px] text-[#858B92] ml-2">({item.label})</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-[#555C63] group-hover:text-white shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "evidence" && (
          <div className="space-y-2 text-xs font-mono">
            <div className="text-[10px] text-[#858B92] uppercase flex items-center justify-between">
              <span>ATTACHED EVIDENTIARY SOURCING</span>
              <ProvenanceBadge type="EVIDENCE RECORD" />
            </div>
            <div className="p-2.5 rounded-lg bg-[#0A0D10] border border-[#20252A]">
              <div className="text-white font-bold">FIR-2026-014</div>
              <div className="text-[11px] text-[#858B92] mt-0.5">Section 420/120B IPC • Financial Skimming</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0A0D10] border border-[#20252A]">
              <div className="text-white font-bold">FIU STR-2026-894</div>
              <div className="text-[11px] text-[#858B92] mt-0.5">Suspicious NEFT circular transaction ₹5,00,000</div>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0A0D10] border border-[#20252A]">
              <div className="text-white font-bold">CDR Intercept</div>
              <div className="text-[11px] text-[#858B92] mt-0.5">141 calls logged on ph03 after registration</div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-2 text-xs font-mono">
            <div className="text-[10px] text-[#858B92] uppercase flex items-center justify-between">
              <span>TOPOLOGICAL CENTRALITY PROFILE</span>
              <ProvenanceBadge type="GRAPH ANALYSIS" />
            </div>
            <div className="p-2.5 rounded-lg bg-[#0A0D10] border border-[#20252A] flex justify-between">
              <span className="text-[#858B92]">Betweenness Centrality:</span>
              <span className="text-amber-400 font-bold">{betweenness}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0A0D10] border border-[#20252A] flex justify-between">
              <span className="text-[#858B92]">Betweenness Rank (Persons):</span>
              <span className="text-white font-bold">#{betweennessRank}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0A0D10] border border-[#20252A] flex justify-between">
              <span className="text-[#858B92]">Total Degree:</span>
              <span className="text-emerald-400 font-bold">{degree}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0A0D10] border border-[#20252A] flex justify-between">
              <span className="text-[#858B92]">Community Cluster:</span>
              <span className="text-purple-400 font-bold">#1 (Financial Routing)</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Collected Dossier Bar + Quick Actions */}
      <div className="mt-4 space-y-3">
        {/* Saved Dossier Entities Pill List */}
        <div className="p-2.5 rounded-xl bg-[#0A0D10] border border-[#20252A]">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#858B92] uppercase pb-1">
            <span>COLLECTED DOSSIER ITEMS ({dossierItems.length})</span>
            <span className="text-emerald-400 font-bold">SYNCHRONIZED</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {dossierItems.map((item) => (
              <span
                key={item.id}
                onClick={() => item.targetEntityId && onSelectNeighbor(item.targetEntityId)}
                className="px-2 py-0.5 rounded bg-[#20252A] hover:bg-[#E21B23]/20 hover:border-[#E21B23] border border-[#384048] text-[10px] font-mono text-white cursor-pointer transition-colors"
              >
                {item.title.split(" ")[0] || item.id}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Actions Header */}
        <div className="text-[10px] font-mono tracking-widest text-[#858B92] uppercase font-bold px-1">
          QUICK ACTIONS
        </div>

        {/* 2 Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAskCopilot(targetId)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0A0D10] hover:bg-[#20252A] border border-[#20252A] text-slate-200 text-xs font-semibold transition-all cursor-pointer group"
          >
            <Bot className="w-3.5 h-3.5 text-[#858B92] group-hover:text-white" />
            <span>Ask Copilot</span>
          </button>

          <button
            onClick={onRunScenario}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0A0D10] hover:bg-[#20252A] border border-[#20252A] text-slate-200 text-xs font-semibold transition-all cursor-pointer group"
          >
            <GitFork className="w-3.5 h-3.5 text-[#858B92] group-hover:text-white" />
            <span>Run Scenario</span>
          </button>
        </div>

        {/* Bottom Tactical Quote */}
        <div className="text-center pt-1 text-[11px] font-mono text-[#555C63] italic">
          "Data closes what distance hides."
        </div>
      </div>
    </div>
  );
};

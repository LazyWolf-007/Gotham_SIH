import { GraphNode, GraphEdge, LinkType, ObjectType } from "../types";

// Verified real geographic coordinates for investigation hubs
export interface VerifiedHub {
  lat: number;
  lng: number;
  label: string;
  country: string;
  isMajorHub?: boolean;
}

export const VERIFIED_HUBS: Record<string, VerifiedHub> = {
  "delhi": { lat: 28.6139, lng: 77.2090, label: "Delhi", country: "India", isMajorHub: true },
  "delhi:azadpur": { lat: 28.7126, lng: 77.1750, label: "Azadpur Mandi", country: "India" },
  "delhi:karol_bagh": { lat: 28.6514, lng: 77.1907, label: "Karol Bagh", country: "India" },
  "delhi:okhla": { lat: 28.5355, lng: 77.2796, label: "Okhla", country: "India" },
  "delhi:noida": { lat: 28.6276, lng: 77.3820, label: "Noida Sec 63", country: "India" },
  "delhi:sadar": { lat: 28.6560, lng: 77.2140, label: "Sadar Bazar", country: "India" },
  "delhi:dwarka": { lat: 28.5522, lng: 77.0589, label: "Dwarka", country: "India" },
  "delhi:ghazipur": { lat: 28.6245, lng: 77.3326, label: "Ghazipur", country: "India" },
  "delhi:gurugram": { lat: 28.5033, lng: 77.0864, label: "Udyog Vihar", country: "India" },

  // Key Inter-State and International Hawala/Smuggling Hubs
  "mumbai": { lat: 18.9220, lng: 72.8347, label: "Mumbai", country: "India", isMajorHub: true },
  "dubai": { lat: 25.2048, lng: 55.2708, label: "Dubai", country: "UAE", isMajorHub: true },
  "singapore": { lat: 1.3521, lng: 103.8198, label: "Singapore", country: "Singapore", isMajorHub: true },
  "kolkata": { lat: 22.5726, lng: 88.3639, label: "Kolkata", country: "India", isMajorHub: true },
  "ahmedabad": { lat: 23.0225, lng: 72.5714, label: "Ahmedabad", country: "India", isMajorHub: true },
};

export interface GlobeNode {
  id: string;
  label: string;
  type: ObjectType;
  rawNode: GraphNode;
  lat: number;
  lng: number;
  hasGeo: boolean;
  locationName: string;
  hubKey: string;
  isKeyNode: boolean;
  isMajorHub: boolean;
  degree: number;
  betweenness: number;
  orbitalIndex?: number;
  orbitalCount?: number;
}

export interface GlobeArc {
  id: string;
  source: string;
  target: string;
  sourceNode: GlobeNode;
  targetNode: GlobeNode;
  primaryType: LinkType;
  count: number;
  rawEdges: GraphEdge[];
  isCrossRegional: boolean;
}

export interface CaseGlobeData {
  caseId: string;
  caseName: string;
  nodes: GlobeNode[];
  arcs: GlobeArc[];
  geocodedCount: number;
  unanchoredCount: number;
  majorHubs: { label: string; lat: number; lng: number; count: number }[];
  centerCoords: { lat: number; lng: number };
}

/**
 * Deterministically maps case entities to their verified geographic hubs
 * based on the case facts, location links, surveillance sightings, and syndicate roles.
 */
function resolveEntityHub(
  nodeId: string,
  node: GraphNode,
  caseId: string,
  edges: GraphEdge[]
): { hubKey: string; locName: string; direct: boolean } | null {
  const isCase014 = caseId.includes("014");
  const isCase042 = caseId.includes("042");
  const isCase009 = caseId.includes("009");

  // 1. Direct Location Nodes
  if (node.type === "Location") {
    if (nodeId === "loc:azadpur_mandi") return { hubKey: "delhi:azadpur", locName: "Azadpur Mandi, Delhi", direct: true };
    if (nodeId === "loc:karol_bagh") return { hubKey: "delhi:karol_bagh", locName: "Karol Bagh, Delhi", direct: true };
    if (nodeId === "loc:okhla_industrial") return { hubKey: "delhi:okhla", locName: "Okhla, Delhi", direct: true };
    if (nodeId === "loc:noida_sec63") return { hubKey: "delhi:noida", locName: "Noida Sec 63", direct: true };
    if (nodeId === "loc:sadar_bazar") return { hubKey: "delhi:sadar", locName: "Sadar Bazar, Delhi", direct: true };
    if (nodeId === "loc:dwarka_sec21") return { hubKey: "delhi:dwarka", locName: "Dwarka, Delhi", direct: true };
    if (nodeId === "loc:ghazipur_yard") return { hubKey: "delhi:ghazipur", locName: "Ghazipur, Delhi", direct: true };
    if (nodeId === "loc:udyog_vihar") return { hubKey: "delhi:gurugram", locName: "Udyog Vihar, Gurugram", direct: true };
  }

  // 2. Camera Nodes
  if (node.type === "Camera") {
    const locId = node.attributes?.location_id;
    if (locId === "loc:azadpur_mandi") return { hubKey: "delhi:azadpur", locName: "Azadpur CCTV", direct: true };
    if (locId === "loc:karol_bagh") return { hubKey: "delhi:karol_bagh", locName: "Karol Bagh CCTV", direct: true };
    if (locId === "loc:okhla_industrial") return { hubKey: "delhi:okhla", locName: "Okhla CCTV", direct: true };
    if (locId === "loc:noida_sec63") return { hubKey: "delhi:noida", locName: "Noida CCTV", direct: true };
    if (locId === "loc:udyog_vihar") return { hubKey: "delhi:gurugram", locName: "Gurugram CCTV", direct: true };
  }

  // 3. FIR Nodes
  if (node.type === "FIR") {
    const st = node.attributes?.station || "";
    if (st.includes("Azadpur")) return { hubKey: "delhi:azadpur", locName: "Azadpur PS, Delhi", direct: true };
    if (st.includes("Karol Bagh")) return { hubKey: "delhi:karol_bagh", locName: "Karol Bagh PS, Delhi", direct: true };
    if (st.includes("Okhla")) return { hubKey: "delhi:okhla", locName: "Okhla PS, Delhi", direct: true };
    return { hubKey: "delhi", locName: `${st}, Delhi`, direct: true };
  }

  // 4. Case-Specific Entity Real-World Geography
  if (isCase014) {
    // DUBAI: Offshore Syndicate Principal & Hawala Book
    if (nodeId === "person:vikram_haleja") {
      return { hubKey: "dubai", locName: "Dubai (Beneficiary Residence)", direct: true };
    }
    if (nodeId === "org:haleja_holdings") {
      return { hubKey: "dubai", locName: "Dubai (Haleja Holdings HQ)", direct: true };
    }
    if (nodeId === "org:silver_lotus_traders") {
      return { hubKey: "dubai", locName: "Dubai (Hawala Routing Shell)", direct: true };
    }
    if (nodeId === "acc:a08") {
      return { hubKey: "dubai", locName: "Dubai Correspondent Bank (Hawala Loop)", direct: true };
    }

    // SINGAPORE: Trade Invoicing Layering Conduit
    if (nodeId === "org:narmada_exports") {
      return { hubKey: "singapore", locName: "Singapore (Trade Invoicing Hub)", direct: true };
    }
    if (nodeId === "acc:a09") {
      return { hubKey: "singapore", locName: "Singapore Clearing Bank (Hawala Loop)", direct: true };
    }

    // MUMBAI: Financial Settlement Hub & Western Transit
    if (nodeId === "acc:a02") {
      return { hubKey: "mumbai", locName: "Mumbai (SBI Nariman Point - Hawala Primary)", direct: true };
    }
    if (nodeId === "acc:a03") {
      return { hubKey: "mumbai", locName: "Mumbai (Axis Commercial Clearing)", direct: true };
    }
    if (nodeId === "person:harish_tandel") {
      return { hubKey: "mumbai", locName: "Mumbai Port (Maritime Transit)", direct: true };
    }
    if (nodeId === "org:jamuna_transport") {
      return { hubKey: "mumbai", locName: "Mumbai (Western Fleet Terminal)", direct: true };
    }
    if (nodeId === "acc:a13") {
      return { hubKey: "mumbai", locName: "Mumbai Transit Account", direct: true };
    }

    // KOLKATA: Eastern Trade & Precursor Conduit
    if (nodeId === "org:panchsheel_spices") {
      return { hubKey: "kolkata", locName: "Kolkata (Burrabazar Trade Front)", direct: true };
    }
    if (nodeId === "acc:a11") {
      return { hubKey: "kolkata", locName: "Kolkata Settlement Account", direct: true };
    }

    // DELHI (Azadpur, Karol Bagh, Okhla)
    if (nodeId === "person:naveen_bhatia" || nodeId === "org:bhatia_associates" || nodeId === "phone:ph00") {
      return { hubKey: "delhi:karol_bagh", locName: "Karol Bagh, Delhi (Accountant Office)", direct: true };
    }
    if (nodeId === "person:imtiaz_qureshi" || nodeId === "person:rakesh_mundhe" || nodeId === "org:qadir_cold_store") {
      return { hubKey: "delhi:azadpur", locName: "Azadpur Mandi, Delhi (Physical Trade)", direct: true };
    }
    if (nodeId === "person:farhan_lodhi" || nodeId === "phone:ph03" || nodeId === "phone:ph02" || nodeId === "phone:ph04") {
      return { hubKey: "delhi:okhla", locName: "Okhla Industrial, Delhi (Mule Relay)", direct: true };
    }
  }

  // CASE-2026-042 (Operation Blue Shield: Cross-Border Crypto Syndicate)
  if (isCase042) {
    if (nodeId.includes("042") || nodeId === "person:p71") {
      return { hubKey: "delhi:okhla", locName: "Okhla Cyber PS, Delhi", direct: true };
    }
    if (nodeId.includes("crypto") || nodeId.includes("acc")) {
      return { hubKey: "mumbai", locName: "Mumbai Financial Gateway", direct: true };
    }
  }

  // CASE-2026-009 (Operation Red Falcon: Western Railway Smuggling)
  if (isCase009) {
    if (nodeId === "FIR-2026-009" || nodeId.includes("azadpur")) {
      return { hubKey: "delhi:azadpur", locName: "Azadpur Origin, Delhi", direct: true };
    }
    if (nodeId === "person:p38" || nodeId === "person:rakesh_mundhe") {
      return { hubKey: "ahmedabad", locName: "Ahmedabad Railway Junction", direct: true };
    }
    if (nodeId === "person:p48") {
      return { hubKey: "mumbai", locName: "Mumbai Central Terminal", direct: true };
    }
    if (nodeId.includes("veh") || nodeId.includes("acc")) {
      return { hubKey: "kolkata", locName: "Kolkata Precursor Hub", direct: true };
    }
  }

  // Fallback: Check SEEN_AT relationships
  for (const edge of edges) {
    if (edge.type === "SEEN_AT") {
      if (edge.source === nodeId && edge.target.startsWith("loc:")) {
        return resolveEntityHub(edge.target, node, caseId, edges);
      }
    }
  }

  return null;
}

/**
 * Filter universe to ONLY the selected case, resolve verified geographic hubs,
 * and construct curved cross-regional arcs.
 */
export function filterCaseNetwork(
  caseId: string,
  allNodes: GraphNode[],
  allEdges: GraphEdge[],
  linkTypeFilter?: Set<LinkType>
): CaseGlobeData {
  const nodeMap = new Map<string, GraphNode>();
  allNodes.forEach((n) => nodeMap.set(n.id, n));

  const targetFirId = caseId.replace(/^CASE-/, "FIR-");
  const firNode = nodeMap.get(targetFirId);

  // 1. Establish seeds for this case
  const seeds = new Set<string>();
  if (firNode) {
    seeds.add(firNode.id);
    const comp = firNode.attributes?.complainant;
    if (comp && nodeMap.has(comp)) seeds.add(comp);
  }

  // Entities directly mentioned in or mentioning the case FIR
  for (const edge of allEdges) {
    if (edge.type === "MENTIONED_IN") {
      if (edge.target === targetFirId && nodeMap.has(edge.source)) {
        seeds.add(edge.source);
      } else if (edge.source === targetFirId && nodeMap.has(edge.target)) {
        seeds.add(edge.target);
      }
    }
  }

  // Operation Grey Ledger Canonical Case Entities
  if (caseId.includes("014") || targetFirId.includes("014")) {
    [
      // Core Syndicate Targets
      "person:naveen_bhatia",
      "person:vikram_haleja",
      "person:farhan_lodhi",
      "person:imtiaz_qureshi",
      "person:rakesh_mundhe",
      "person:harish_tandel",
      // Front Organizations & International Shells
      "org:haleja_holdings",
      "org:silver_lotus_traders",
      "org:narmada_exports",
      "org:bhatia_associates",
      "org:qadir_cold_store",
      "org:panchsheel_spices",
      "org:jamuna_transport",
      // Hawala Cycle Accounts
      "acc:a02",
      "acc:a03",
      "acc:a08",
      "acc:a09",
      "acc:a11",
      "acc:a13",
      // Intercept & Communications Lines
      "phone:ph00",
      "phone:ph02",
      "phone:ph03",
      "phone:ph04",
      // Physical Locations & CCTV
      "loc:azadpur_mandi",
      "loc:karol_bagh",
      "loc:okhla_industrial",
      "cam:azadpur_gate",
      "cam:azadpur_yard",
      "cam:karol_lane",
      "cam:okhla_shed",
    ].forEach((id) => {
      if (nodeMap.has(id)) seeds.add(id);
    });
  }

  // Expand seeds by 1 hop
  const expanded = new Set<string>(seeds);
  for (const edge of allEdges) {
    if (seeds.has(edge.source) && nodeMap.has(edge.target)) {
      expanded.add(edge.target);
    } else if (seeds.has(edge.target) && nodeMap.has(edge.source)) {
      expanded.add(edge.source);
    }
  }

  // Include location nodes connected to expanded set
  for (const edge of allEdges) {
    if (edge.type === "SEEN_AT" || edge.type === "OWNS") {
      if (expanded.has(edge.source) && nodeMap.has(edge.target)) {
        expanded.add(edge.target);
      } else if (expanded.has(edge.target) && nodeMap.has(edge.source)) {
        expanded.add(edge.source);
      }
    }
  }

  // If allNodes is already scoped (e.g. from filterCaseScopedNetwork), use all of them.
  // Otherwise use the expanded case seeds set.
  const caseNodeSet = new Set<string>();
  if (allNodes.length <= 60) {
    allNodes.forEach((n) => caseNodeSet.add(n.id));
  } else {
    expanded.forEach((id) => caseNodeSet.add(id));
  }

  // 2. Resolve Geographic Coordinates
  // Track counts per hub to apply deterministic local visual offsets so nodes at the same hub don't overlap
  const hubNodeCounts = new Map<string, number>();
  const hubNodeIndices = new Map<string, number>();

  for (const id of caseNodeSet) {
    const n = nodeMap.get(id);
    if (!n) continue;
    const res = resolveEntityHub(id, n, caseId, allEdges);
    if (res && VERIFIED_HUBS[res.hubKey]) {
      hubNodeCounts.set(res.hubKey, (hubNodeCounts.get(res.hubKey) || 0) + 1);
    }
  }

  const globeNodes: GlobeNode[] = [];
  const globeNodeMap = new Map<string, GlobeNode>();
  let geocodedCount = 0;
  let unanchoredCount = 0;

  const MAJOR_HUB_KEYS = new Set(["delhi", "mumbai", "dubai", "singapore", "kolkata", "ahmedabad"]);

  // Count unanchored nodes to assign deterministic orbital indices
  const unanchoredList = Array.from(caseNodeSet).filter((id) => {
    const n = nodeMap.get(id);
    if (!n) return false;
    const res = resolveEntityHub(id, n, caseId, allEdges);
    return !(res && VERIFIED_HUBS[res.hubKey]);
  });
  const totalUnanchored = unanchoredList.length;
  let currentUnanchoredIdx = 0;

  for (const id of caseNodeSet) {
    const n = nodeMap.get(id)!;
    const res = resolveEntityHub(id, n, caseId, allEdges);

    if (res && VERIFIED_HUBS[res.hubKey]) {
      const hub = VERIFIED_HUBS[res.hubKey];
      geocodedCount++;

      const totalInHub = hubNodeCounts.get(res.hubKey) || 1;
      const idxInHub = hubNodeIndices.get(res.hubKey) || 0;
      hubNodeIndices.set(res.hubKey, idxInHub + 1);

      // Deterministic small visual offset around the verified hub center
      let finalLat = hub.lat;
      let finalLng = hub.lng;

      if (totalInHub > 1 && n.type !== "Location") {
        // Small radius offset (0.2 - 0.45 deg) around the city
        const r = 0.22 + (idxInHub % 3) * 0.12;
        const theta = (2 * Math.PI * idxInHub) / totalInHub;
        finalLat = hub.lat + r * Math.sin(theta);
        finalLng = hub.lng + r * Math.cos(theta);
      }

      const isKey =
        id === "person:naveen_bhatia" ||
        id === "person:vikram_haleja" ||
        id === "acc:a02" ||
        id === "acc:a08" ||
        id === "FIR-2026-014" ||
        id === "org:haleja_holdings" ||
        id === "org:narmada_exports";

      const gNode: GlobeNode = {
        id: n.id,
        label: n.label || n.id,
        type: n.type,
        rawNode: n,
        lat: finalLat,
        lng: finalLng,
        hasGeo: true,
        locationName: res.locName,
        hubKey: res.hubKey,
        isKeyNode: isKey,
        isMajorHub: hub.isMajorHub || MAJOR_HUB_KEYS.has(res.hubKey.split(":")[0]),
        degree: n.metrics?.degree || 0,
        betweenness: n.metrics?.betweenness || 0,
      };

      globeNodes.push(gNode);
      globeNodeMap.set(n.id, gNode);
    } else {
      unanchoredCount++;
      const uIdx = currentUnanchoredIdx++;
      const gNode: GlobeNode = {
        id: n.id,
        label: n.label || n.id,
        type: n.type,
        rawNode: n,
        lat: 0,
        lng: 0,
        hasGeo: false,
        locationName: "UNANCHORED (Orbital Intelligence Layer)",
        hubKey: "unanchored",
        isKeyNode: false,
        isMajorHub: false,
        degree: n.metrics?.degree || 0,
        betweenness: n.metrics?.betweenness || 0,
        orbitalIndex: uIdx,
        orbitalCount: totalUnanchored,
      };
      globeNodes.push(gNode);
      globeNodeMap.set(n.id, gNode);
    }
  }

  // 3. Filter and Aggregate Case Edges
  const rawCaseEdges = allEdges.filter((e) => {
    if (!caseNodeSet.has(e.source) || !caseNodeSet.has(e.target)) return false;
    if (linkTypeFilter && !linkTypeFilter.has(e.type)) return false;
    return true;
  });

  // Group pairs into singular visual arcs
  const pairGroups = new Map<string, { rawEdges: GraphEdge[]; primaryType: LinkType }>();

  for (const edge of rawCaseEdges) {
    const key = `${edge.source}:::${edge.target}`;
    if (!pairGroups.has(key)) {
      pairGroups.set(key, { rawEdges: [], primaryType: edge.type });
    }
    const group = pairGroups.get(key)!;
    group.rawEdges.push(edge);
    if (edge.type === "PAID" || edge.type === "SEEN_AT" || edge.type === "MENTIONED_IN" || edge.type === "CALLED") {
      group.primaryType = edge.type;
    }
  }

  const globeArcs: GlobeArc[] = [];
  pairGroups.forEach((group, key) => {
    const [srcId, tgtId] = key.split(":::");
    const srcNode = globeNodeMap.get(srcId);
    const tgtNode = globeNodeMap.get(tgtId);

    // Include all legitimate case edges between valid nodes
    if (srcNode && tgtNode && srcId !== tgtId) {
      const isCross = srcNode.hasGeo && tgtNode.hasGeo && srcNode.hubKey.split(":")[0] !== tgtNode.hubKey.split(":")[0];
      globeArcs.push({
        id: `arc-${srcId}-${tgtId}`,
        source: srcId,
        target: tgtId,
        sourceNode: srcNode,
        targetNode: tgtNode,
        primaryType: group.primaryType,
        count: group.rawEdges.length,
        rawEdges: group.rawEdges,
        isCrossRegional: isCross,
      });
    }
  });

  // Summary of major hubs present in this case
  const majorHubMap = new Map<string, { label: string; lat: number; lng: number; count: number }>();
  for (const n of globeNodes) {
    if (!n.hasGeo) continue;
    const baseHub = n.hubKey.split(":")[0];
    const hubInfo = VERIFIED_HUBS[baseHub] || VERIFIED_HUBS[n.hubKey];
    if (hubInfo) {
      if (!majorHubMap.has(hubInfo.label)) {
        majorHubMap.set(hubInfo.label, { label: hubInfo.label, lat: hubInfo.lat, lng: hubInfo.lng, count: 0 });
      }
      majorHubMap.get(hubInfo.label)!.count++;
    }
  }

  return {
    caseId,
    caseName: caseId.includes("014") ? "Operation Grey Ledger" : caseId.includes("042") ? "Operation Blue Shield" : "Operation Red Falcon",
    nodes: globeNodes,
    arcs: globeArcs,
    geocodedCount,
    unanchoredCount,
    majorHubs: Array.from(majorHubMap.values()),
    centerCoords: { lat: 22.0, lng: 75.0 }, // Optimal orbital framing of South Asia & Middle East
  };
}

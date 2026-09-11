import type {
  GraphEdge,
  GraphNode,
  GraphPayload,
  NeighborHit,
  ProvenanceHit,
} from "./types";

export type ViewMode = "all" | "money" | "calls";

export type FocusKind = "none" | "naveen" | "cycle" | "fit-all";

export const NAVEEN_ID = "person:naveen_bhatia";

export const PAID_CYCLE_IDS = [
  "acc:a02",
  "acc:a03",
  "acc:a08",
  "acc:a09",
] as const;

export const PAID_CYCLE_SET = new Set<string>(PAID_CYCLE_IDS);

const CALL_EDGE_CAP = 400;
export const ASK_HIGHLIGHT_CAP = 12;

const RAW_ID = /^(person|phone|acc|org|loc|cam|veh)[:\-]/i;
const STORY_NEEDLES = ["bhatia", "lodhi", "mundhe", "haleja", "azadpur"];

export const DEFAULT_NODE_TYPES = new Set([
  "Person",
  "Organization",
  "Account",
  "Location",
]);

export const DEFAULT_EDGE_TYPES = new Set([
  "PAID",
  "OWNS",
  "MEMBER_OF",
  "USES",
  "SEEN_AT",
]);

export const TYPE_COLORS: Record<string, string> = {
  Person: "#D4B483",
  Phone: "#6EA8C9",
  Account: "#C9A227",
  Organization: "#8E6BBF",
  Location: "#5B8C6A",
  Vehicle: "#C47A5A",
  FIR: "#B85C38",
  Camera: "#5C6B7A",
};

export const EDGE_COLORS: Record<string, string> = {
  PAID: "#C9A227",
  OWNS: "#7A8494",
  MEMBER_OF: "#8E6BBF",
  USES: "#6EA8C9",
  SEEN_AT: "#5B8C6A",
  CALLED: "#6B8499",
  MENTIONED_IN: "#8A8F98",
  SAME_AS: "#9AA4B2",
};

const SIZE_MIN = 16;
const SIZE_MAX = 28;

export function stripRawId(id: string): string {
  if (!id) return "";
  if (RAW_ID.test(id)) return id.split(":").slice(1).join(":").replace(/_/g, " ");
  return id;
}

export function humanLabel(
  node: GraphNode | undefined | null,
  fallbackId = "",
): string {
  const id = fallbackId || node?.id || "";
  if (node) {
    const attrs = node.attributes || {};
    if (node.type === "Phone") {
      const digits = String(attrs.msisdn ?? node.label ?? "").replace(/\D/g, "");
      if (digits) return digits;
    }
    for (const key of ["name", "number", "code"] as const) {
      const val = attrs[key];
      if (typeof val === "string" && val.trim() && !RAW_ID.test(val.trim())) {
        return val.trim();
      }
    }
    if (node.label && !RAW_ID.test(node.label)) return node.label;
  }
  return stripRawId(id);
}

export function isStoryNode(node: GraphNode): boolean {
  const hay = `${node.label} ${node.id}`.toLowerCase();
  return STORY_NEEDLES.some((n) => hay.includes(n));
}

export function capHighlightIds(ids: string[] | null | undefined): string[] {
  if (!ids || ids.length === 0) return [];
  const out: string[] = [];
  for (const id of ids) {
    if (!id || out.includes(id)) continue;
    out.push(id);
    if (out.length >= ASK_HIGHLIGHT_CAP) break;
  }
  return out;
}

export function sumCounts(counts: Record<string, number> | undefined): number | null {
  if (!counts) return null;
  const values = Object.values(counts);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0);
}

export function filterDefault(graph: GraphPayload): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes = graph.nodes.filter((n) => DEFAULT_NODE_TYPES.has(n.type));
  const ids = new Set(nodes.map((n) => n.id));
  const edges = graph.edges.filter(
    (e) =>
      DEFAULT_EDGE_TYPES.has(e.type) &&
      ids.has(e.source) &&
      ids.has(e.target),
  );
  return { nodes, edges };
}

export function filterMoney(graph: GraphPayload): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const paidEdges = graph.edges.filter((e) => e.type === "PAID");
  const ids = new Set<string>();
  for (const e of paidEdges) {
    ids.add(e.source);
    ids.add(e.target);
  }
  const nodes = graph.nodes.filter((n) => ids.has(n.id));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = paidEdges.filter(
    (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
  );
  return { nodes, edges };
}

export function filterCalls(graph: GraphPayload): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const phoneNodes = graph.nodes.filter((n) => n.type === "Phone");
  const phoneIds = new Set(phoneNodes.map((n) => n.id));

  const pairCounts = new Map<
    string,
    { source: string; target: string; count: number }
  >();

  for (const e of graph.edges) {
    if (e.type !== "CALLED") continue;
    if (!phoneIds.has(e.source) || !phoneIds.has(e.target)) continue;
    const [a, b] =
      e.source < e.target ? [e.source, e.target] : [e.target, e.source];
    const key = `${a}|${b}`;
    const cur = pairCounts.get(key);
    if (cur) cur.count += 1;
    else pairCounts.set(key, { source: a, target: b, count: 1 });
  }

  const ranked = [...pairCounts.values()].sort((x, y) => y.count - x.count);
  const capped = ranked.slice(0, CALL_EDGE_CAP);

  const activeIds = new Set<string>();
  for (const p of capped) {
    activeIds.add(p.source);
    activeIds.add(p.target);
  }

  const nodes = phoneNodes.filter((n) => activeIds.has(n.id));
  const edges: GraphEdge[] = capped.map((p) => ({
    id: `agg:CALLED:${p.source}:${p.target}`,
    type: "CALLED",
    source: p.source,
    target: p.target,
    attributes: { count: p.count, aggregated: true },
  }));

  return { nodes, edges };
}

export function filterGraph(
  graph: GraphPayload,
  mode: ViewMode,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  switch (mode) {
    case "money":
      return filterMoney(graph);
    case "calls":
      return filterCalls(graph);
    default:
      return filterDefault(graph);
  }
}

export function splitLinked(
  nodes: GraphNode[],
  edges: GraphEdge[],
): { linked: GraphNode[]; unlinked: GraphNode[]; edges: GraphEdge[] } {
  const ids = new Set(nodes.map((n) => n.id));
  const deg = new Map<string, number>();
  for (const n of nodes) deg.set(n.id, 0);
  const kept: GraphEdge[] = [];
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target) || e.source === e.target) continue;
    kept.push(e);
    deg.set(e.source, (deg.get(e.source) ?? 0) + 1);
    deg.set(e.target, (deg.get(e.target) ?? 0) + 1);
  }
  const linked = nodes.filter((n) => (deg.get(n.id) ?? 0) >= 1);
  const unlinked = nodes.filter((n) => (deg.get(n.id) ?? 0) === 0);
  const linkedIds = new Set(linked.map((n) => n.id));
  return {
    linked,
    unlinked,
    edges: kept.filter((e) => linkedIds.has(e.source) && linkedIds.has(e.target)),
  };
}

function rowLess(
  a: [number, number, number, string],
  b: [number, number, number, string],
): boolean {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] < b[i];
  }
  return a[3] < b[3];
}

/** Person with highest betweenness among low-degree candidates. Matches engine hinge. */
export function hingePerson(
  graph: GraphPayload,
  rankTop = 3,
  degreeMax = 15,
): string {
  let best: [number, number, number, string] | null = null;
  let fallback: [number, number, number, string] | null = null;
  for (const n of graph.nodes) {
    if (n.type !== "Person") continue;
    const rank = n.metrics?.betweenness_rank_persons ?? 1e9;
    const deg = n.metrics?.degree ?? 1e9;
    const btw = n.metrics?.betweenness ?? 0;
    const row: [number, number, number, string] = [rank, deg, -btw, n.id];
    if (!fallback || rowLess(row, fallback)) fallback = row;
    if (rank <= rankTop && deg <= degreeMax) {
      if (!best || rowLess(row, best)) best = row;
    }
  }
  if (best) return best[3];
  return fallback ? fallback[3] : "";
}

export function topBetweennessIds(nodes: GraphNode[], limit = 12): Set<string> {
  const ranked = [...nodes].sort(
    (a, b) => (b.metrics?.betweenness ?? 0) - (a.metrics?.betweenness ?? 0),
  );
  return new Set(ranked.slice(0, limit).map((n) => n.id));
}

export function betweennessRange(nodes: GraphNode[]): { min: number; max: number } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const n of nodes) {
    const bt = n.metrics?.betweenness;
    if (typeof bt === "number") {
      if (bt < min) min = bt;
      if (bt > max) max = bt;
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { min: 0, max: 0 };
  }
  return { min, max };
}

export function nodeSize(
  metrics: GraphNode["metrics"] | undefined,
  minBt: number,
  maxBt: number,
): number {
  const bt = metrics?.betweenness;
  let t: number;
  if (typeof bt === "number" && maxBt > minBt) {
    t = (bt - minBt) / (maxBt - minBt);
  } else {
    const deg = metrics?.degree ?? 0;
    t = Math.min(1, deg / 40);
  }
  const px = SIZE_MIN + t * (SIZE_MAX - SIZE_MIN);
  return Math.max(SIZE_MIN, Math.min(SIZE_MAX, px));
}

export type CyElement = {
  data: Record<string, unknown>;
};

export function toElements(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options?: { highlightCycle?: boolean; labeledIds?: Set<string> },
): CyElement[] {
  const { min, max } = betweennessRange(nodes);
  const labeledIds = options?.labeledIds;
  const nodeEls: CyElement[] = nodes.map((n) => ({
    data: {
      id: n.id,
      label: n.label,
      type: n.type,
      color: TYPE_COLORS[n.type] ?? "#8A8F98",
      size: nodeSize(n.metrics, min, max),
      community: n.metrics?.community ?? null,
      degree: n.metrics?.degree ?? 0,
      betweenness: n.metrics?.betweenness ?? 0,
      storyLabel: isStoryNode(n),
      showLabel: labeledIds ? labeledIds.has(n.id) : false,
      cycleHighlight:
        options?.highlightCycle === true && PAID_CYCLE_SET.has(n.id),
    },
  }));
  const edgeEls: CyElement[] = edges.map((e) => {
    const count =
      typeof e.attributes?.count === "number" ? e.attributes.count : 1;
    return {
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type,
        color: EDGE_COLORS[e.type] ?? "#4A5A6C",
        weight: count,
      },
    };
  });
  return [...nodeEls, ...edgeEls];
}

function nodeSearchFields(n: GraphNode): string[] {
  const attrs = n.attributes || {};
  return [
    n.id,
    n.label,
    String(attrs.name ?? ""),
    String(attrs.msisdn ?? ""),
    String(attrs.number ?? ""),
    String(attrs.code ?? ""),
  ];
}

export function findNodeByQuery(
  graph: GraphPayload,
  query: string,
): GraphNode | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const qDigits = q.replace(/\D/g, "");
  let best: { score: number; node: GraphNode } | null = null;
  for (const n of graph.nodes) {
    const fields = nodeSearchFields(n);
    const text = fields.join(" ").toLowerCase();
    let score = 0;
    if (n.id.toLowerCase() === q || n.label.toLowerCase() === q) score = 1000;
    else if (n.id.toLowerCase().includes(q) || n.label.toLowerCase().includes(q)) {
      score = 500 + q.length;
    } else if (text.includes(q)) {
      score = 450 + q.length;
    }
    if (qDigits.length >= 3) {
      for (const field of fields) {
        const d = field.replace(/\D/g, "");
        if (!d) continue;
        if (d === qDigits) score = Math.max(score, 900);
        else if (d.startsWith(qDigits)) score = Math.max(score, 800 + qDigits.length);
        else if (d.endsWith(qDigits)) score = Math.max(score, 750 + qDigits.length);
        else if (d.includes(qDigits)) score = Math.max(score, 400 + qDigits.length);
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { score, node: n };
  }
  return best?.node ?? null;
}

export function provenanceFor(
  graph: GraphPayload,
  nodeId: string,
  limit = 3,
): ProvenanceHit[] {
  const hits: ProvenanceHit[] = [];
  for (const e of graph.edges) {
    if (e.source !== nodeId && e.target !== nodeId) continue;
    const snippet = e.attributes?.snippet;
    if (typeof snippet !== "string" || !snippet.trim()) continue;
    const source_type = e.attributes?.source_type;
    const source_id = e.attributes?.source_id;
    hits.push({
      edgeType: e.type,
      source_type: typeof source_type === "string" ? source_type : undefined,
      source_id: typeof source_id === "string" ? source_id : undefined,
      snippet: snippet.trim(),
    });
    if (hits.length >= limit) break;
  }
  return hits;
}

export function neighborsOf(graph: GraphPayload, id: string): NeighborHit[] {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const seen = new Set<string>();
  const hits: NeighborHit[] = [];
  for (const e of graph.edges) {
    let other: string | null = null;
    if (e.source === id) other = e.target;
    else if (e.target === id) other = e.source;
    if (!other || seen.has(other)) continue;
    const node = byId.get(other);
    if (!node) continue;
    seen.add(other);
    hits.push({ node, edgeType: e.type });
  }
  return hits;
}

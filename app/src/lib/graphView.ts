import type { GraphEdge, GraphNode, GraphPayload, NeighborHit } from "./types";

export const NAVEEN_ID = "person:naveen_bhatia";

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
  Phone: "#6FA8C9",
  Account: "#C9A227",
  Organization: "#8E6BBF",
  Location: "#5B8C6A",
  Vehicle: "#C47A5A",
  FIR: "#8A8F98",
  Camera: "#5C6B7A",
};

export const EDGE_COLORS: Record<string, string> = {
  PAID: "#C9A227",
  OWNS: "#7A8494",
  MEMBER_OF: "#8E6BBF",
  USES: "#6FA8C9",
  SEEN_AT: "#5B8C6A",
  CALLED: "#4A5A6C",
  MENTIONED_IN: "#8A8F98",
  SAME_AS: "#9AA4B2",
};

const SIZE_MIN = 12;
const SIZE_MAX = 42;

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
  if (typeof bt === "number" && maxBt > minBt) {
    const t = (bt - minBt) / (maxBt - minBt);
    return SIZE_MIN + t * (SIZE_MAX - SIZE_MIN);
  }
  const deg = metrics?.degree ?? 0;
  const t = Math.min(1, deg / 40);
  return SIZE_MIN + t * (SIZE_MAX - SIZE_MIN);
}

export type CyElement = {
  data: Record<string, unknown>;
};

export function toElements(nodes: GraphNode[], edges: GraphEdge[]): CyElement[] {
  const { min, max } = betweennessRange(nodes);
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
    },
  }));
  const edgeEls: CyElement[] = edges.map((e) => ({
    data: {
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type,
      color: EDGE_COLORS[e.type] ?? "#4A5A6C",
    },
  }));
  return [...nodeEls, ...edgeEls];
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

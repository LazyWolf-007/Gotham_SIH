export const OBJECT_TYPES = [
  "Person",
  "Phone",
  "Account",
  "Organization",
  "FIR",
  "Location",
  "Camera",
  "Vehicle",
] as const;

export type ObjectType = (typeof OBJECT_TYPES)[number];

export const LINK_TYPES = [
  "CALLED",
  "PAID",
  "OWNS",
  "USES",
  "SEEN_AT",
  "MEMBER_OF",
  "MENTIONED_IN",
  "SAME_AS",
] as const;

export type LinkType = (typeof LINK_TYPES)[number];

export interface Provenance {
  source_type: string;
  source_id: string;
  snippet: string;
}

export interface NodeMetrics {
  degree?: number;
  betweenness?: number;
  betweenness_rank_persons?: number;
  community?: number;
  in_degree?: number;
  out_degree?: number;
  [key: string]: any;
}

export interface GraphNode {
  id: string;
  type: ObjectType;
  label: string;
  attributes: Record<string, any>;
  metrics: NodeMetrics;
}

export interface GraphEdge {
  id?: string;
  type: LinkType;
  source: string;
  target: string;
  attributes: {
    source_type?: string;
    source_id?: string;
    snippet?: string;
    at?: string;
    amount_inr?: number;
    channel?: string;
    note?: string;
    duration_s?: number;
    tower?: string;
    confidence?: number;
    role?: string;
    reason?: string;
    [key: string]: any;
  };
}

export interface PatternHit {
  pattern: string;
  confidence: number;
  nodes: string[];
  edges: string[];
  evidence: Record<string, any>;
}

export interface CutResult {
  target: string;
  components_before: number;
  components_after: number;
  path_before?: string[] | null;
  path_after?: string[] | null;
  residual_path_ph02_ph03?: string[] | null;
}

export interface GraphKernel {
  ontology_version: string;
  generated_at: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  patterns: PatternHit[];
  cut: CutResult;
  same_as: any[];
  meta: {
    object_counts: Record<string, number>;
    link_counts: Record<string, number>;
    same_as_count: number;
  };
}

export interface FilterState {
  searchQuery: string;
  selectedObjectTypes: Set<ObjectType>;
  selectedLinkTypes: Set<LinkType>;
  minBetweenness: number;
  communityFilter: number | "all";
  timeWindowStart: string | null;
  timeWindowEnd: string | null;
  minTransactionAmount: number;
  activePattern: string | null;
  isolatedSeedId: string | null;
  isolateHops: number;
}

export interface ArrestSimState {
  active: boolean;
  targetNodeId: string;
  result: CutResult | null;
  highlightResidual: boolean;
}

export interface TimelineEvent {
  id: string;
  type: "CALLED" | "PAID" | "FIR" | "SEEN_AT";
  timestamp: string;
  title: string;
  subtitle: string;
  sourceNodeId: string;
  targetNodeId: string;
  amount?: number;
  duration?: number;
  snippet?: string;
  rawEdge?: GraphEdge;
}

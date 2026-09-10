export type NodeMetrics = {
  degree?: number;
  betweenness?: number;
  betweenness_rank_persons?: number;
  community?: number;
};

export type GraphNode = {
  id: string;
  type: string;
  label: string;
  attributes: Record<string, unknown>;
  metrics: NodeMetrics;
};

export type GraphEdge = {
  id: string;
  type: string;
  source: string;
  target: string;
  attributes: Record<string, unknown>;
};

export type GraphMeta = {
  object_counts?: Record<string, number>;
  link_counts?: Record<string, number>;
  same_as_count?: number;
};

export type GraphPayload = {
  ontology_version?: string;
  generated_at?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  patterns?: unknown[];
  cut?: unknown;
  same_as?: unknown[];
  meta?: GraphMeta;
};

export type NeighborHit = {
  node: GraphNode;
  edgeType: string;
};

export type ProvenanceHit = {
  edgeType: string;
  source_type?: string;
  source_id?: string;
  snippet: string;
};

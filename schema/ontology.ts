/**
 * Object types + the frozen 8 link types.
 * Extra meaning lives in attributes only. Do not add a 9th type.
 * ASSOCIATED is forbidden unless demo_check.py fails without it and the user agrees.
 */

export const ONTOLOGY_VERSION = "1.0.0";

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

/** Frozen. Do not invent new link types. */
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

export interface ObjectSpec {
  type: ObjectType;
  attributes: string[];
}

export const OBJECTS: Record<ObjectType, ObjectSpec> = {
  Person: { type: "Person", attributes: ["id", "name"] },
  Phone: { type: "Phone", attributes: ["id", "msisdn"] },
  Account: { type: "Account", attributes: ["id", "number", "bank"] },
  Organization: { type: "Organization", attributes: ["id", "name"] },
  FIR: { type: "FIR", attributes: ["id", "station", "offence", "filed_at"] },
  Location: { type: "Location", attributes: ["id", "name"] },
  Camera: { type: "Camera", attributes: ["id", "code"] },
  Vehicle: { type: "Vehicle", attributes: ["id", "plate"] },
};

export interface LinkSpec {
  type: LinkType;
  source: ObjectType[];
  target: ObjectType[];
  /** Required on every edge, plus type-specific fields. */
  attributes: string[];
}

const PROVENANCE = ["source_type", "source_id", "snippet"] as const;

export const LINKS: Record<LinkType, LinkSpec> = {
  CALLED: {
    type: "CALLED",
    source: ["Phone"],
    target: ["Phone"],
    attributes: [...PROVENANCE, "at", "duration_s", "tower"],
  },
  PAID: {
    type: "PAID",
    source: ["Account"],
    target: ["Account"],
    attributes: [...PROVENANCE, "at", "amount_inr", "channel", "note"],
  },
  OWNS: {
    type: "OWNS",
    source: ["Person"],
    target: ["Phone", "Account", "Vehicle"],
    attributes: [...PROVENANCE],
  },
  USES: {
    type: "USES",
    source: ["Person"],
    target: ["Phone", "Vehicle"],
    attributes: [...PROVENANCE, "at"],
  },
  SEEN_AT: {
    type: "SEEN_AT",
    source: ["Person", "Vehicle"],
    target: ["Location", "Camera"],
    attributes: [...PROVENANCE, "at", "confidence"],
  },
  MEMBER_OF: {
    type: "MEMBER_OF",
    source: ["Person"],
    target: ["Organization"],
    attributes: [...PROVENANCE, "role"],
  },
  MENTIONED_IN: {
    type: "MENTIONED_IN",
    source: ["Person"],
    target: ["FIR"],
    attributes: [...PROVENANCE, "role"],
  },
  SAME_AS: {
    type: "SAME_AS",
    source: [...OBJECT_TYPES],
    target: [...OBJECT_TYPES],
    attributes: [...PROVENANCE, "reason"],
  },
};

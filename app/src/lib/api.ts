import type { GraphPayload } from "./types";

export async function fetchGraph(): Promise<GraphPayload> {
  const res = await fetch("/graph.json");
  if (!res.ok) {
    throw new Error(`Failed to load /graph.json (${res.status})`);
  }
  const data = (await res.json()) as GraphPayload;
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error("graph.json is missing nodes or edges");
  }
  return data;
}

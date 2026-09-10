import type { GraphPayload } from "./types";

const KERNEL_MISSING =
  "kernel missing — copy data/processed/graph.json to app/public/";

export async function fetchGraph(): Promise<GraphPayload> {
  let res: Response;
  try {
    res = await fetch("/graph.json");
  } catch {
    throw new Error(KERNEL_MISSING);
  }
  if (res.status === 404) {
    throw new Error(KERNEL_MISSING);
  }
  if (!res.ok) {
    throw new Error(`Failed to load /graph.json (${res.status})`);
  }
  const data = (await res.json()) as GraphPayload;
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error("graph.json is missing nodes or edges");
  }
  return data;
}

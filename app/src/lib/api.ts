import { KERNEL_URL } from "./kernel";
import type { GraphPayload } from "./types";

const KERNEL_MISSING =
  "kernel missing — copy data/processed/graph.json to app/public/";

function asGraph(data: unknown): GraphPayload | null {
  if (!data || typeof data !== "object") return null;
  const payload = data as GraphPayload;
  if (!Array.isArray(payload.nodes) || !Array.isArray(payload.edges)) return null;
  return payload;
}

export async function fetchGraph(): Promise<GraphPayload> {
  try {
    const res = await fetch(`${KERNEL_URL}/graph`);
    if (res.ok) {
      const live = asGraph(await res.json());
      if (live) return live;
    }
  } catch {
    // kernel down — fall through to frozen public snapshot
  }
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

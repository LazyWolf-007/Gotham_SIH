export const KERNEL_URL = "http://127.0.0.1:8000";
export const KERNEL_OFFLINE = "kernel offline";

export class KernelError extends Error {
  offline: boolean;
  constructor(message: string, offline = false) {
    super(message);
    this.name = "KernelError";
    this.offline = offline;
  }
}

export type CutPayload = {
  node_id: string;
  residual_path: string[];
  pairs_before: number | null;
  pairs_after: number | null;
};

export type AskCitation = {
  source_id?: string;
  source_type?: string;
  snippet?: string;
};

export type AskPayload = {
  answer: string;
  citations: AskCitation[];
  highlight_node_ids: string[];
};

export type AnalyticsKpis = {
  nodes?: number;
  links?: number;
  persons?: number;
  rupees_sum?: number;
  calls?: number;
};

export type AnalyticsRow = {
  id: string;
  label: string;
  degree?: number | null;
  betweenness?: number | null;
  community?: number | null;
};

export type AnalyticsPayload = {
  kpis?: AnalyticsKpis;
  scatter?: AnalyticsRow[];
  money_series?: { date: string; amount_inr: number }[];
  burst_series?: {
    phone?: string | null;
    fir_id?: string | null;
    before?: number | null;
    after?: number | null;
    t0?: string | null;
  };
  top10?: AnalyticsRow[];
  arrest_impact?: {
    target?: string;
    pairs_before?: number | null;
    pairs_after?: number | null;
    residual_path?: string[] | null;
  };
  error?: string;
};

async function kernelFetch(path: string, init?: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${KERNEL_URL}${path}`, init);
  } catch {
    throw new KernelError(KERNEL_OFFLINE, true);
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    const err =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `kernel ${res.status}`;
    throw new KernelError(err, false);
  }
  return body;
}

export function fetchCut(id: string): Promise<CutPayload> {
  const q = encodeURIComponent(id);
  return kernelFetch(`/cut?id=${q}`) as Promise<CutPayload>;
}

export function fetchAsk(question: string): Promise<AskPayload> {
  return kernelFetch("/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  }) as Promise<AskPayload>;
}

export function fetchAnalytics(): Promise<AnalyticsPayload> {
  return kernelFetch("/analytics") as Promise<AnalyticsPayload>;
}

export function kernelMessage(err: unknown): string {
  if (err instanceof KernelError) return err.message;
  return KERNEL_OFFLINE;
}

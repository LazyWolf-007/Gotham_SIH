import type { AnalyticsPayload, AnalyticsRow, BriefingPayload } from "../lib/kernel";

type Props = {
  data: AnalyticsPayload | null;
  error: string | null;
  loading: boolean;
  onSelectId: (id: string) => void;
};

function fmt(n: number | null | undefined): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString();
}

function fmtBt(n: number | null | undefined): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toFixed(4);
}

function inr(n: number | null | undefined): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return `₹${n.toLocaleString("en-IN")}`;
}

function PeopleTable({
  title,
  rows,
  onSelectId,
}: {
  title: string;
  rows: AnalyticsRow[];
  onSelectId: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="dossier-sub">
        {title}
        <span>{rows.length}</span>
      </h3>
      <table className="analytics-table">
        <thead>
          <tr>
            <th>name</th>
            <th>direct ties</th>
            <th>routes through them</th>
            <th>pocket</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onSelectId(row.id)}>
              <td>{row.label}</td>
              <td>{fmt(row.degree)}</td>
              <td>{fmtBt(row.betweenness)}</td>
              <td>{row.community ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BriefingTiles({
  briefing,
  onSelectId,
}: {
  briefing: BriefingPayload;
  onSelectId: (id: string) => void;
}) {
  const residual = briefing.residual_path || [];
  const residualLabels = briefing.residual_labels || [];
  const burnerBits = [
    briefing.burst_phone_short,
    briefing.burst_phone_digits,
    briefing.burst_fir_id,
  ].filter(Boolean);

  return (
    <div className="briefing-row">
      <button
        type="button"
        className="briefing"
        onClick={() => briefing.hinge_id && onSelectId(briefing.hinge_id)}
        disabled={!briefing.hinge_id}
      >
        <span>Pick up first</span>
        <strong>{briefing.hinge_name || "—"}</strong>
        <em>hinge · max pick-up score, direct ties ≤ 15</em>
      </button>
      <div className="briefing">
        <span>What breaks</span>
        <strong>
          {fmt(briefing.pairs_before)} → {fmt(briefing.pairs_after)}
        </strong>
        <em>routes through the hinge</em>
      </div>
      <div className="briefing">
        <span>What remains</span>
        <strong className="briefing-path">
          {residual.length === 0
            ? "—"
            : residual.map((id, i) => (
                <span key={id}>
                  {i > 0 ? ", " : ""}
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => onSelectId(id)}
                  >
                    {residualLabels[i] ?? "—"}
                  </button>
                </span>
              ))}
        </strong>
        <em>leftover path</em>
      </div>
      <div className="briefing">
        <span>After the FIR</span>
        <strong>
          {fmt(briefing.burst_before)} → {fmt(briefing.burst_after)}
        </strong>
        <em>
          burner
          {burnerBits.length > 0
            ? ` ${[briefing.burst_phone_short, briefing.burst_phone_digits]
                .filter(Boolean)
                .join(" / ")}${briefing.burst_fir_id ? `, ${briefing.burst_fir_id}` : ""}`
            : ""}
        </em>
      </div>
      <div className="briefing">
        <span>Money moved</span>
        <strong>{inr(briefing.rupees_sum)}</strong>
        <em>through hinge accounts {inr(briefing.hinge_rupees)}</em>
      </div>
    </div>
  );
}

export function Analytics({ data, error, loading, onSelectId }: Props) {
  if (loading) {
    return (
      <section className="analytics-pane" aria-label="Analytics">
        <p className="muted">loading analytics…</p>
      </section>
    );
  }
  if (error || !data || data.error) {
    return (
      <section className="analytics-pane" aria-label="Analytics">
        <p className="muted">{error || data?.error || "kernel offline"}</p>
      </section>
    );
  }

  const briefing = data.briefing || {};
  const scatter = data.scatter || [];
  const top10 = data.top10 || [];

  return (
    <section className="analytics-pane" aria-label="Analytics">
      <BriefingTiles briefing={briefing} onSelectId={onSelectId} />

      <div className="analytics-grid">
        <PeopleTable title="Top 10" rows={top10} onSelectId={onSelectId} />
        <PeopleTable title="Scatter" rows={scatter} onSelectId={onSelectId} />
      </div>
    </section>
  );
}

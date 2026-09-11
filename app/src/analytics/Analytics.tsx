import type { AnalyticsPayload } from "../lib/kernel";

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

  const kpis = data.kpis || {};
  const burst = data.burst_series || {};
  const scatter = data.scatter || [];
  const top10 = data.top10 || [];

  return (
    <section className="analytics-pane" aria-label="Analytics">
      <div className="kpi-row">
        <div className="kpi">
          <span>nodes</span>
          <strong>{fmt(kpis.nodes)}</strong>
        </div>
        <div className="kpi">
          <span>links</span>
          <strong>{fmt(kpis.links)}</strong>
        </div>
        <div className="kpi">
          <span>persons</span>
          <strong>{fmt(kpis.persons)}</strong>
        </div>
        <div className="kpi">
          <span>rupees</span>
          <strong>{fmt(kpis.rupees_sum)}</strong>
        </div>
        <div className="kpi">
          <span>calls</span>
          <strong>{fmt(kpis.calls)}</strong>
        </div>
        <div className="kpi">
          <span>burst</span>
          <strong>
            {fmt(burst.before)}/{fmt(burst.after)}
          </strong>
          <em>
            {burst.phone || "—"}
            {burst.fir_id ? ` · ${burst.fir_id}` : ""}
          </em>
        </div>
      </div>

      <div className="analytics-grid">
        <div>
          <h3 className="dossier-sub">
            Top 10
            <span>{top10.length}</span>
          </h3>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>id</th>
                <th>label</th>
                <th>bt</th>
                <th>deg</th>
              </tr>
            </thead>
            <tbody>
              {top10.map((row) => (
                <tr key={row.id} onClick={() => onSelectId(row.id)}>
                  <td className="mono">{row.id}</td>
                  <td>{row.label}</td>
                  <td>{fmtBt(row.betweenness)}</td>
                  <td>{fmt(row.degree)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="dossier-sub">
            Scatter
            <span>{scatter.length}</span>
          </h3>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>id</th>
                <th>label</th>
                <th>degree</th>
                <th>betweenness</th>
                <th>comm</th>
              </tr>
            </thead>
            <tbody>
              {scatter.map((row) => (
                <tr key={row.id} onClick={() => onSelectId(row.id)}>
                  <td className="mono">{row.id}</td>
                  <td>{row.label}</td>
                  <td>{fmt(row.degree)}</td>
                  <td>{fmtBt(row.betweenness)}</td>
                  <td>{row.community ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

import { TYPE_COLORS } from "../lib/graphView";
import type { GraphNode, NeighborHit } from "../lib/types";

type Props = {
  node: GraphNode | null;
  neighbors: NeighborHit[];
  onSelectNeighbor: (id: string) => void;
};

function fmtBetweenness(value: number | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toFixed(3);
}

export function Dossier({ node, neighbors, onSelectNeighbor }: Props) {
  if (!node) {
    return (
      <aside className="dossier" aria-label="Dossier">
        <p className="dossier-empty">Select an object.</p>
      </aside>
    );
  }

  const color = TYPE_COLORS[node.type] ?? "#8A8F98";
  const shown = neighbors.slice(0, 20);

  return (
    <aside className="dossier" aria-label="Dossier">
      <div className="dossier-kicker">Dossier</div>
      <h2 className="dossier-name">{node.label}</h2>
      <div className="type-pill">
        <span className="swatch" style={{ background: color }} />
        {node.type}
      </div>

      <dl className="facts">
        <div>
          <dt>id</dt>
          <dd className="mono">{node.id}</dd>
        </div>
        <div>
          <dt>type</dt>
          <dd>{node.type}</dd>
        </div>
        <div>
          <dt>community</dt>
          <dd>{node.metrics?.community ?? "—"}</dd>
        </div>
        <div>
          <dt>degree</dt>
          <dd>{node.metrics?.degree ?? "—"}</dd>
        </div>
        <div>
          <dt>betweenness</dt>
          <dd>{fmtBetweenness(node.metrics?.betweenness)}</dd>
        </div>
      </dl>

      <h3 className="dossier-sub">
        Neighbors
        <span>{shown.length}</span>
      </h3>
      {shown.length === 0 ? (
        <p className="muted">No linked objects.</p>
      ) : (
        <ul className="neighbor-list">
          {shown.map((hit) => (
            <li key={hit.node.id}>
              <button
                type="button"
                onClick={() => onSelectNeighbor(hit.node.id)}
              >
                <span
                  className="swatch"
                  style={{
                    background: TYPE_COLORS[hit.node.type] ?? "#8A8F98",
                  }}
                />
                <span className="neighbor-copy">
                  <span className="neighbor-label">{hit.node.label}</span>
                  <span className="neighbor-meta">
                    {hit.node.type} · {hit.edgeType}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

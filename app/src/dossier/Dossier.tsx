import type { AskPayload, CutPayload } from "../lib/kernel";
import { TYPE_COLORS } from "../lib/graphView";
import type { GraphNode, NeighborHit, ProvenanceHit } from "../lib/types";

type Props = {
  node: GraphNode | null;
  neighbors: NeighborHit[];
  provenance: ProvenanceHit[];
  arrest: CutPayload | null;
  ask: AskPayload | null;
  onSelectNeighbor: (id: string) => void;
};

function fmtBetweenness(value: number | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toFixed(3);
}

function ArrestBlock({
  arrest,
  onSelectNeighbor,
}: {
  arrest: CutPayload;
  onSelectNeighbor: (id: string) => void;
}) {
  const path = arrest.residual_path || [];
  return (
    <>
      <h3 className="dossier-sub">
        Arrest
        <span>{arrest.node_id}</span>
      </h3>
      <dl className="facts">
        <div>
          <dt>pairs before</dt>
          <dd>{arrest.pairs_before ?? "—"}</dd>
        </div>
        <div>
          <dt>pairs after</dt>
          <dd>{arrest.pairs_after ?? "—"}</dd>
        </div>
      </dl>
      <h3 className="dossier-sub">
        Residual path
        <span>{path.length}</span>
      </h3>
      {path.length === 0 ? (
        <p className="muted">No residual path.</p>
      ) : (
        <ol className="path-list">
          {path.map((id) => (
            <li key={id}>
              <button type="button" onClick={() => onSelectNeighbor(id)}>
                <span className="mono">{id}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function AskBlock({ ask }: { ask: AskPayload }) {
  const citations = ask.citations || [];
  return (
    <>
      <h3 className="dossier-sub">Ask</h3>
      <p className="ask-answer">{ask.answer}</p>
      {citations.length > 0 && (
        <>
          <h3 className="dossier-sub">
            Citations
            <span>{citations.length}</span>
          </h3>
          <ul className="provenance-list">
            {citations.map((hit, i) => (
              <li key={`${hit.source_id}-${i}`}>
                <p className="provenance-snippet">{hit.snippet || ""}</p>
                <p className="provenance-meta">
                  {hit.source_type || "cite"}
                  {hit.source_id ? ` · ${hit.source_id}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

export function Dossier({
  node,
  neighbors,
  provenance,
  arrest,
  ask,
  onSelectNeighbor,
}: Props) {
  if (!node) {
    return (
      <aside className="dossier" aria-label="Dossier">
        {arrest || ask ? (
          <>
            <div className="dossier-kicker">Dossier</div>
            {arrest && (
              <ArrestBlock arrest={arrest} onSelectNeighbor={onSelectNeighbor} />
            )}
            {ask && <AskBlock ask={ask} />}
          </>
        ) : (
          <p className="dossier-empty">Select an object.</p>
        )}
      </aside>
    );
  }

  const color = TYPE_COLORS[node.type] ?? "#8A8F98";
  const shown = neighbors.slice(0, 20);

  return (
    <aside className="dossier" aria-label="Dossier">
      <div className="dossier-kicker">Dossier</div>
      <h2 className="dossier-name">{node.label}</h2>
      <div className="type-pill" style={{ color, borderColor: color }}>
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

      {arrest && (
        <ArrestBlock arrest={arrest} onSelectNeighbor={onSelectNeighbor} />
      )}
      {ask && <AskBlock ask={ask} />}

      {provenance.length > 0 && (
        <>
          <h3 className="dossier-sub">
            Provenance
            <span>{provenance.length}</span>
          </h3>
          <ul className="provenance-list">
            {provenance.map((hit, i) => (
              <li key={`${hit.edgeType}-${hit.snippet}-${i}`}>
                <p className="provenance-snippet">{hit.snippet}</p>
                <p className="provenance-meta">
                  {hit.edgeType}
                  {hit.source_type ? ` · ${hit.source_type}` : ""}
                  {hit.source_id ? ` · ${hit.source_id}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

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

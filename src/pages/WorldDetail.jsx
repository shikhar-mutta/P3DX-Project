import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore, worldById, childWorlds, agentById } from '../store/store';
import { WORLD_TYPES } from '../data/seed';
import { Avatar, WorldBreadcrumb, EmptyState } from '../components/ui';

export default function WorldDetail() {
  const { worldId } = useParams();
  const { state } = useStore();
  const navigate = useNavigate();
  const world = worldById(state, worldId);

  if (!world) return <EmptyState>World not found.</EmptyState>;

  const residents = state.agents.filter((a) => a.worldId === world.id);
  const lockers = state.lockers.filter((l) => l.worldId === world.id);
  const subWorlds = childWorlds(state, world.id);

  // Traffic through this World's gateway: any connection whose target locker
  // lives here (inbound) or whose requester lives here (outbound).
  const gatewayTraffic = state.connections.filter((c) => {
    const target = state.lockers.find((l) => l.id === c.lockerId);
    const requester = agentById(state, c.requesterId);
    return target?.worldId === world.id || requester?.worldId === world.id;
  });

  return (
    <div className="stack">
      <div className="card">
        <div className="spread">
          <div>
            <div className="faint" style={{ marginBottom: 2 }}>
              <WorldBreadcrumb worldId={world.id} />
            </div>
            <h3 style={{ fontSize: 18 }}>
              {WORLD_TYPES[world.type].icon} {world.name}
            </h3>
            <div className="row" style={{ marginTop: 6 }}>
              <span className="tag">{WORLD_TYPES[world.type].label}</span>
              <span className="tag">⚖️ {world.law}</span>
            </div>
          </div>
          <button className="btn" onClick={() => navigate('/worlds')}>← Back to map</button>
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>{world.description}</p>
      </div>

      <div className="card" style={{ borderColor: 'rgba(63,185,80,0.35)' }}>
        <div className="spread">
          <div>
            <h3>📡 {world.gateway.name}</h3>
            <div className="muted small">
              Single controlled entry/exit point. Every agent and every byte crossing this boundary is screened here
              against {world.law}.
            </div>
          </div>
          <div className="row">
            <span className="pill active">online</span>
            <span className="tag">{gatewayTraffic.length} crossing{gatewayTraffic.length !== 1 ? 's' : ''} on record</span>
          </div>
        </div>
        {(() => {
          const officer = agentById(state, world.gateway.officerId);
          return officer ? (
            <div className="row" style={{ gap: 8, marginTop: 10 }}>
              <Avatar agent={officer} size={22} />
              <span className="small muted">
                🛡 Gateway Officer: <strong>{officer.name}</strong> — screens every crossing and can deny it at this
                Gateway.
              </span>
            </div>
          ) : null;
        })()}
      </div>

      {subWorlds.length > 0 && (
        <>
          <div className="section-title">Nested Worlds</div>
          <div className="grid-2">
            {subWorlds.map((w) => (
              <Link key={w.id} to={`/worlds/${w.id}`} className="card" style={{ color: 'inherit' }}>
                <div className="spread">
                  <h3>{WORLD_TYPES[w.type].icon} {w.name}</h3>
                  <span className="tag">📡 {w.gateway.name}</span>
                </div>
                <div className="faint">{WORLD_TYPES[w.type].label} · {w.law}</div>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="section-title">Resident Agents</div>
      {residents.length === 0 ? (
        <EmptyState>No agents reside directly in this World.</EmptyState>
      ) : (
        <div className="grid-2">
          {residents.map((a) => (
            <Link key={a.id} to={`/agents/${a.id}`} className="card" style={{ color: 'inherit' }}>
              <div className="row" style={{ gap: 12 }}>
                <Avatar agent={a} size={38} />
                <div>
                  <h3>{a.name}</h3>
                  <div className="faint">{a.role}</div>
                </div>
                <span className="btn sm" style={{ marginLeft: 'auto' }}>Enter →</span>
              </div>
              <p className="muted small" style={{ marginBottom: 0 }}>{a.bio}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="section-title">Lockers hosted in this World</div>
      {lockers.length === 0 ? (
        <EmptyState>No lockers are hosted in this World.</EmptyState>
      ) : (
        <div className="grid-2">
          {lockers.map((l) => {
            const owner = agentById(state, l.ownerId);
            return (
              <div key={l.id} className="card">
                <div className="spread">
                  <h3>{l.icon} {l.name}</h3>
                  <span className="tag">{l.type}</span>
                </div>
                <div className="faint" style={{ marginBottom: 8 }}>Owned by {owner?.name}</div>
                <div className="row" style={{ marginBottom: 8 }}>
                  {l.records.map((r) => (
                    <span key={r} className="tag">📄 {r}</span>
                  ))}
                </div>
                <div className="small muted" style={{ fontWeight: 600, marginBottom: 4 }}>Connection endpoints</div>
                {l.endpoints.map((e) => (
                  <div key={e.id} className="small" style={{ padding: '4px 0', borderTop: '1px solid var(--border-soft)' }}>
                    🔌 <strong>{e.name}</strong>
                    <div className="faint">{e.description}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

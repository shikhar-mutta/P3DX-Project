import { useNavigate } from 'react-router-dom';
import { useStore, childWorlds } from '../store/store';
import { WORLD_TYPES } from '../data/seed';

/**
 * Recursive World node: dashed boundary = the World's trust border,
 * the chip sitting ON the border = its single Gateway (the only way in/out),
 * chips inside = resident agents. Nesting renders containment directly.
 */
function WorldNode({ world, depth }) {
  const { state } = useStore();
  const navigate = useNavigate();
  const children = childWorlds(state, world.id);
  const residents = state.agents.filter((a) => a.worldId === world.id);
  const lockerCount = state.lockers.filter((l) => l.worldId === world.id).length;

  return (
    <div className={`world-node region-${world.region} depth-${Math.min(depth, 2)}`}>
      <div className="gateway-chip" title="Gateway — the single controlled entry/exit point of this World">
        <span className="dot" /> 📡 {world.gateway.name}
      </div>

      <div className="world-label" onClick={() => navigate(`/worlds/${world.id}`)} title="Open this World">
        <span>{WORLD_TYPES[world.type].icon}</span>
        <span>{world.name}</span>
        <span className="world-law">{world.law}</span>
      </div>

      {(residents.length > 0 || lockerCount > 0) && (
        <div className="world-residents">
          {residents.map((a) => (
            <span key={a.id} className="resident-chip" title={a.role}>
              <span className="mini-avatar" style={{ background: `hsl(${a.hue} 70% 68%)` }}>
                {a.kind === 'ai' ? '🤖' : a.name[0]}
              </span>
              {a.name}
            </span>
          ))}
          {lockerCount > 0 && <span className="tag">🔐 {lockerCount} locker{lockerCount > 1 ? 's' : ''}</span>}
        </div>
      )}

      {children.length > 0 && (
        <div className="world-children">
          {children.map((c) => (
            <WorldNode key={c.id} world={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Explorer() {
  const { state } = useStore();
  const roots = childWorlds(state, null);
  const activeCrossings = state.connections.filter((c) => c.status === 'established').length;

  return (
    <div className="stack">
      <div className="card">
        <h3>Worlds are nested trust domains</h3>
        <p className="muted" style={{ margin: '4px 0 0' }}>
          Each dashed boundary is a World enforcing its own rulebook (shown beside its name). The only way in or out is
          its <strong>Gateway</strong> 📡 pinned on the border. Click a World's name to enter it and see the agents,
          lockers and endpoints that live inside. {activeCrossings > 0 && (
            <>There {activeCrossings === 1 ? 'is' : 'are'} currently <strong>{activeCrossings}</strong> established cross-World channel{activeCrossings > 1 ? 's' : ''}.</>
          )}
        </p>
      </div>

      <div className="world-canvas">
        {roots.map((w) => (
          <WorldNode key={w.id} world={w} depth={0} />
        ))}
      </div>
    </div>
  );
}

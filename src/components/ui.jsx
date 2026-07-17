import { useStore, agentById, lockerById, worldById, gatewayPath, isCrossBorder } from '../store/store';

export function Avatar({ agent, size = 32 }) {
  const initials = agent.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  return (
    <div
      className={`avatar ${agent.kind === 'ai' ? 'ai' : ''}`}
      style={{ width: size, height: size, background: `hsl(${agent.hue} 70% 68%)` }}
      title={`${agent.name} — ${agent.role}`}
    >
      {agent.kind === 'ai' ? '🤖' : initials}
    </div>
  );
}

export function StatusPill({ status }) {
  return <span className={`pill ${status}`}>{status}</span>;
}

export function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="spread" style={{ marginBottom: 14 }}>
          <div>
            <h2>{title}</h2>
            {subtitle && <div className="muted small">{subtitle}</div>}
          </div>
          <button className="btn sm" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * Renders the full route of a crossing:
 * requester → each gateway hop → target endpoint on the locker.
 */
export function GatewayPathView({ connection }) {
  const { state } = useStore();
  const requester = agentById(state, connection.requesterId);
  const locker = lockerById(state, connection.lockerId);
  if (!requester || !locker) return null;

  const hops = gatewayPath(state, requester.worldId, locker.worldId);
  const crossBorder = isCrossBorder(state, requester.worldId, locker.worldId);
  const endpoint = locker.endpoints.find((e) => e.id === connection.endpointId);

  return (
    <div className="gw-path">
      <span className="gw-endpoint">{requester.name}</span>
      {hops.map((g) => {
        const officer = agentById(state, g.officerId);
        return (
          <span key={g.id} className="row" style={{ gap: 6 }}>
            <span className="gw-arrow">→</span>
            <span
              className="gw-hop"
              title={officer ? `Gateway Officer: ${officer.name} — can deny this crossing here` : undefined}
            >
              📡 {g.name}
              {officer && <span className="faint"> · 🛡 {officer.name}</span>}
            </span>
          </span>
        );
      })}
      <span className="gw-arrow">→</span>
      <span className="gw-endpoint">
        🔌 {endpoint?.name || 'Endpoint'} <span className="muted">({locker.name})</span>
      </span>
      {crossBorder && <span className="tag" style={{ marginLeft: 'auto' }}>cross-border</span>}
    </div>
  );
}

export function WorldBreadcrumb({ worldId }) {
  const { state } = useStore();
  const chain = [];
  let w = worldById(state, worldId);
  while (w) {
    chain.unshift(w);
    w = w.parentId ? worldById(state, w.parentId) : null;
  }
  return (
    <span className="faint">
      {chain.map((x, i) => (
        <span key={x.id}>
          {i > 0 && ' ▸ '}
          {x.name}
        </span>
      ))}
    </span>
  );
}

export function EmptyState({ children }) {
  return <div className="empty">{children}</div>;
}

export function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

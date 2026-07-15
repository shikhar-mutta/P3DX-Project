import { useState } from 'react';
import {
  useStore,
  agentById,
  lockerById,
  worldById,
} from '../store/store';
import { Avatar, StatusPill, Modal, GatewayPathView, EmptyState, fmtDate } from '../components/ui';

const FLOW = ['requested', 'pending', 'established'];

function FlowTrack({ status }) {
  const idx = FLOW.indexOf(status);
  return (
    <div className="row" style={{ gap: 4 }}>
      {FLOW.map((s, i) => (
        <span key={s} className="row" style={{ gap: 4 }}>
          {i > 0 && <span className="gw-arrow">→</span>}
          <span
            className={`pill ${idx >= i && idx !== -1 ? s : 'expired'}`}
            style={idx < i || idx === -1 ? { opacity: 0.4 } : {}}
          >
            {s}
          </span>
        </span>
      ))}
      {idx === -1 && <StatusPill status={status} />}
    </div>
  );
}

function NewConnectionModal({ onClose }) {
  const { state, dispatch } = useStore();
  const actor = agentById(state, state.actingAs);
  const [endpointId, setEndpointId] = useState('');
  const [purpose, setPurpose] = useState('');

  // You can request a connection to any endpoint on a locker you don't own —
  // typically one living in another World.
  const targets = state.lockers
    .filter((l) => l.ownerId !== actor.id)
    .flatMap((l) => l.endpoints.map((e) => ({ locker: l, endpoint: e })));

  const chosen = targets.find((t) => t.endpoint.id === endpointId);

  function submit() {
    dispatch({
      type: 'REQUEST_CONNECTION',
      requesterId: actor.id,
      endpointId,
      lockerId: chosen.locker.id,
      purpose: purpose.trim(),
    });
    onClose();
  }

  return (
    <Modal
      title="Request a cross-World connection"
      subtitle={`Requesting as ${actor.name} (${worldById(state, actor.worldId)?.name})`}
      onClose={onClose}
    >
      <div className="stack" style={{ gap: 12 }}>
        <div className="field">
          <label>Target connection endpoint</label>
          <select value={endpointId} onChange={(e) => setEndpointId(e.target.value)}>
            <option value="">Choose an endpoint…</option>
            {targets.map(({ locker, endpoint }) => (
              <option key={endpoint.id} value={endpoint.id}>
                {endpoint.name} — {locker.name} ({worldById(state, locker.worldId)?.name})
              </option>
            ))}
          </select>
          {chosen && <div className="faint">{chosen.endpoint.description}</div>}
        </div>

        <div className="field">
          <label>Purpose of connection (shown to the Gateway and the data owner)</label>
          <textarea
            rows={3}
            placeholder="e.g. Verify B.Tech degree for employment contract EMP-2214"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </div>

        {chosen && (
          <div>
            <div className="small muted" style={{ fontWeight: 600, marginBottom: 6 }}>
              This request will travel through:
            </div>
            <GatewayPathView
              connection={{ requesterId: actor.id, lockerId: chosen.locker.id, endpointId }}
            />
          </div>
        )}

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!endpointId || !purpose.trim()} onClick={submit}>
            Submit at Gateway
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ConnectionCard({ conn }) {
  const { state, dispatch } = useStore();
  const [showHistory, setShowHistory] = useState(false);
  const requester = agentById(state, conn.requesterId);
  const locker = lockerById(state, conn.lockerId);
  const owner = agentById(state, locker?.ownerId);
  const actorIsOwner = state.actingAs === locker?.ownerId;
  const targetWorld = worldById(state, locker?.worldId);

  return (
    <div className="card">
      <div className="spread" style={{ marginBottom: 10 }}>
        <div className="row" style={{ gap: 10 }}>
          {requester && <Avatar agent={requester} />}
          <div>
            <h3>{requester?.name} → {locker?.name}</h3>
            <div className="faint">Owner: {owner?.name} · Target World: {targetWorld?.name}</div>
          </div>
        </div>
        <FlowTrack status={conn.status} />
      </div>

      <GatewayPathView connection={conn} />

      <p className="muted small" style={{ margin: '10px 0' }}>
        <strong>Purpose:</strong> {conn.purpose}
      </p>

      <div className="spread">
        <button className="btn sm" onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? 'Hide' : 'Show'} history
        </button>
        <div className="row">
          {conn.status === 'requested' && (
            <>
              <button
                className="btn sm"
                title="Act as the Gateway: screen the request against this World's policy"
                onClick={() => dispatch({ type: 'GATEWAY_CLEAR', id: conn.id })}
              >
                📡 Clear at Gateway
              </button>
              <button className="btn sm danger" onClick={() => dispatch({ type: 'DENY_CONNECTION', id: conn.id, note: 'Rejected by Gateway policy screen' })}>
                Deny at Gateway
              </button>
            </>
          )}
          {conn.status === 'pending' && (
            actorIsOwner ? (
              <>
                <button className="btn sm ok" onClick={() => dispatch({ type: 'APPROVE_CONNECTION', id: conn.id })}>
                  ✓ Approve (as owner)
                </button>
                <button className="btn sm danger" onClick={() => dispatch({ type: 'DENY_CONNECTION', id: conn.id, note: 'Denied by data owner' })}>
                  Deny
                </button>
              </>
            ) : (
              <span className="faint">Awaiting approval — switch to {owner?.name} to act</span>
            )
          )}
          {conn.status === 'established' && actorIsOwner && (
            <button className="btn sm danger" onClick={() => dispatch({ type: 'REVOKE_CONNECTION', id: conn.id })}>
              Revoke connection
            </button>
          )}
        </div>
      </div>

      {showHistory && (
        <ul className="timeline">
          {conn.history.map((h, i) => (
            <li key={i}>
              <div className="row" style={{ gap: 8 }}>
                <StatusPill status={h.status} />
                <span className="faint">{fmtDate(h.at)}</span>
              </div>
              <div className="small muted">{h.note}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Connections() {
  const { state } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState('all');

  const filtered = state.connections.filter((c) => filter === 'all' || c.status === filter);

  return (
    <div className="stack">
      <div className="spread">
        <div className="row">
          {['all', 'requested', 'pending', 'established', 'denied', 'revoked'].map((f) => (
            <button
              key={f}
              className="btn sm"
              style={filter === f ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <button className="btn primary" onClick={() => setShowNew(true)}>+ Request connection</button>
      </div>

      <div className="card" style={{ padding: '10px 16px' }}>
        <span className="small muted">
          Lifecycle: <strong>requested</strong> (submitted at the target World's Gateway) → <strong>pending</strong>
          {' '}(Gateway policy screen passed, awaiting the data owner) → <strong>established</strong> (governed channel
          open). A crossing can be <strong>denied</strong> at either step, and the owner can <strong>revoke</strong> an
          established channel at any time — which also revokes all consents riding on it.
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>
          No {filter !== 'all' ? filter : ''} connections yet. Use “Request connection” to open a governed channel into
          another World.
        </EmptyState>
      ) : (
        filtered.map((c) => <ConnectionCard key={c.id} conn={c} />)
      )}

      {showNew && <NewConnectionModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

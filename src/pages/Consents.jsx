import { useState } from 'react';
import {
  useStore,
  agentById,
  lockerById,
  worldById,
  gatewayPath,
} from '../store/store';
import { Avatar, StatusPill, Modal, EmptyState, fmtDate } from '../components/ui';

const CONDITION_PRESETS = [
  'View-only — no onward sharing',
  'Signed attestation only (no raw documents)',
  'Single use — consent expires after one exchange',
  'Requester must log access reason per exchange',
];

function expiryOf(consent) {
  const d = new Date(consent.grantedAt);
  d.setDate(d.getDate() + consent.durationDays);
  return d;
}

function isExpired(consent) {
  return consent.status === 'active' && expiryOf(consent) < new Date();
}

function GrantConsentModal({ connection, onClose }) {
  const { state, dispatch } = useStore();
  const locker = lockerById(state, connection.lockerId);
  const requester = agentById(state, connection.requesterId);
  const [selected, setSelected] = useState([]);
  const [purpose, setPurpose] = useState(connection.purpose);
  const [durationDays, setDurationDays] = useState(30);
  const [conditions, setConditions] = useState([CONDITION_PRESETS[0]]);

  function toggle(list, setList, item) {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  }

  function submit() {
    dispatch({
      type: 'GRANT_CONSENT',
      connectionId: connection.id,
      lockerId: locker.id,
      granteeId: requester.id,
      data: selected,
      purpose: purpose.trim(),
      durationDays: Number(durationDays),
      conditions,
    });
    onClose();
  }

  return (
    <Modal
      title="Grant consent"
      subtitle={`${requester?.name} ← ${locker?.name} (${worldById(state, locker?.worldId)?.name})`}
      onClose={onClose}
    >
      <div className="stack" style={{ gap: 12 }}>
        <div className="field">
          <label>Data to share (scope — nobody sees more than this)</label>
          {locker.records.map((r) => (
            <label key={r} className="checkbox-row">
              <input type="checkbox" checked={selected.includes(r)} onChange={() => toggle(selected, setSelected, r)} />
              📄 {r}
            </label>
          ))}
        </div>

        <div className="field">
          <label>Purpose (the exchange is limited to this purpose)</label>
          <textarea rows={2} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        </div>

        <div className="field">
          <label>Duration (days until this consent expires)</label>
          <input type="number" min={1} max={365} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
        </div>

        <div className="field">
          <label>Conditions</label>
          {CONDITION_PRESETS.map((c) => (
            <label key={c} className="checkbox-row">
              <input type="checkbox" checked={conditions.includes(c)} onChange={() => toggle(conditions, setConditions, c)} />
              {c}
            </label>
          ))}
        </div>

        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn primary"
            disabled={selected.length === 0 || !purpose.trim()}
            onClick={submit}
          >
            Grant consent
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ConsentCard({ consent }) {
  const { state, dispatch } = useStore();
  const locker = lockerById(state, consent.lockerId);
  const grantee = agentById(state, consent.granteeId);
  const owner = agentById(state, locker?.ownerId);
  const connection = state.connections.find((c) => c.id === consent.connectionId);
  const actorIsOwner = state.actingAs === locker?.ownerId;
  const actorIsGrantee = state.actingAs === consent.granteeId;
  const expired = isExpired(consent);
  const effectiveStatus = expired ? 'expired' : consent.status;
  const usable = effectiveStatus === 'active' && connection?.status === 'established';

  function runExchange() {
    const requesterWorld = agentById(state, connection.requesterId)?.worldId;
    const hops = gatewayPath(state, requesterWorld, locker.worldId).map((g) => g.id);
    dispatch({ type: 'EXECUTE_EXCHANGE', consentId: consent.id, gatewayIds: hops });
  }

  return (
    <div className="card">
      <div className="spread" style={{ marginBottom: 10 }}>
        <div className="row" style={{ gap: 10 }}>
          {grantee && <Avatar agent={grantee} />}
          <div>
            <h3>{grantee?.name} ← {locker?.icon} {locker?.name}</h3>
            <div className="faint">Granted by {owner?.name} · {fmtDate(consent.grantedAt)}</div>
          </div>
        </div>
        <StatusPill status={effectiveStatus} />
      </div>

      <div className="table-wrap">
        <table className="table">
          <tbody>
            <tr>
              <th style={{ width: 110 }}>Data</th>
              <td>
                <div className="row">
                  {consent.data.map((d) => <span key={d} className="tag">📄 {d}</span>)}
                </div>
              </td>
            </tr>
            <tr>
              <th>Purpose</th>
              <td>{consent.purpose}</td>
            </tr>
            <tr>
              <th>Duration</th>
              <td>
                {consent.durationDays} days — expires {expiryOf(consent).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
            </tr>
            <tr>
              <th>Conditions</th>
              <td>{consent.conditions.length ? consent.conditions.join(' · ') : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
        {usable && actorIsGrantee && (
          <button className="btn sm primary" onClick={runExchange}>
            ⇄ Execute data exchange
          </button>
        )}
        {usable && !actorIsGrantee && (
          <span className="faint" style={{ marginRight: 'auto' }}>
            Switch to {grantee?.name} to execute an exchange under this consent
          </span>
        )}
        {effectiveStatus === 'active' && actorIsOwner && (
          <button className="btn sm danger" onClick={() => dispatch({ type: 'REVOKE_CONSENT', id: consent.id })}>
            Revoke consent
          </button>
        )}
      </div>
    </div>
  );
}

export default function Consents() {
  const { state } = useStore();
  const [grantFor, setGrantFor] = useState(null);
  const actor = agentById(state, state.actingAs);

  // Established connections into lockers the current actor owns, which have
  // no active consent yet — these are the ones awaiting a consent decision.
  const awaiting = state.connections.filter((c) => {
    if (c.status !== 'established') return false;
    const locker = lockerById(state, c.lockerId);
    if (locker?.ownerId !== state.actingAs) return false;
    return !state.consents.some((cs) => cs.connectionId === c.id && cs.status === 'active' && !isExpired(cs));
  });

  return (
    <div className="stack">
      <div className="card" style={{ padding: '10px 16px' }}>
        <span className="small muted">
          A consent authorises one specific cross-World data flow — <strong>what data</strong>, for{' '}
          <strong>what purpose</strong>, for <strong>how long</strong>, under <strong>what conditions</strong>. It
          attaches to an established connection and is revocable at any time by the data owner.
        </span>
      </div>

      {awaiting.length > 0 && (
        <>
          <div className="section-title">Awaiting your consent ({actor?.name})</div>
          {awaiting.map((c) => {
            const requester = agentById(state, c.requesterId);
            const locker = lockerById(state, c.lockerId);
            return (
              <div key={c.id} className="card" style={{ borderColor: 'rgba(210,153,34,0.4)' }}>
                <div className="spread">
                  <div className="row" style={{ gap: 10 }}>
                    {requester && <Avatar agent={requester} />}
                    <div>
                      <h3>{requester?.name} requests access to {locker?.name}</h3>
                      <div className="muted small">{c.purpose}</div>
                    </div>
                  </div>
                  <button className="btn primary" onClick={() => setGrantFor(c)}>Review & grant…</button>
                </div>
              </div>
            );
          })}
        </>
      )}

      <div className="section-title">All consents</div>
      {state.consents.length === 0 ? (
        <EmptyState>
          No consents yet. Establish a connection first (Connections page), then the locker owner can grant one here.
        </EmptyState>
      ) : (
        state.consents.map((c) => <ConsentCard key={c.id} consent={c} />)
      )}

      {grantFor && <GrantConsentModal connection={grantFor} onClose={() => setGrantFor(null)} />}
    </div>
  );
}

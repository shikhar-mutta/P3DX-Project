import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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

// FNV-1a over the txn id keeps the mock signatures stable across re-renders.
function sig(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = ((h ^ s.charCodeAt(i)) * 16777619) >>> 0;
  return h.toString(16).padStart(8, '0');
}

function MockDocument({ record, owner, issuer, txn }) {
  return (
    <div
      style={{
        marginTop: 10,
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '18px 20px',
        background: 'var(--bg-raised)',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: '0.18em', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
        {issuer}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, margin: '6px 0' }}>{record}</div>
      <div className="small muted">This document certifies that</div>
      <div style={{ fontSize: 15, fontWeight: 650, margin: '4px 0' }}>{owner}</div>
      <div className="small muted">holds the above credential as recorded in the issuer's registry.</div>
      <div className="row" style={{ justifyContent: 'center', marginTop: 10 }}>
        <span className="tag">Ref {txn.id}</span>
        <span className="tag">Issued {fmtDate(txn.at)}</span>
        <span className="tag">🔏 Seal verified</span>
      </div>
      <div className="faint" style={{ marginTop: 8 }}>Mock document — demo only</div>
    </div>
  );
}

function MockPayloadModal({ txn, consent, onClose }) {
  const { state } = useStore();
  const [openDoc, setOpenDoc] = useState(null);
  const locker = lockerById(state, txn.fromLockerId);
  const owner = agentById(state, locker?.ownerId);
  const grantee = agentById(state, txn.requesterId);
  const connection = state.connections.find((c) => c.id === txn.connectionId);
  const endpoint = locker?.endpoints.find((e) => e.id === connection?.endpointId);
  const gatewayName = (id) => state.worlds.find((w) => w.gateway.id === id)?.gateway.name || id;
  // The document dies with the consent — or with the transaction, if a gateway
  // authority blocks the exchange after the fact. Only the attestation survives.
  const accessLive = consent.status === 'active' && !isExpired(consent) && txn.status === 'completed';
  const lockReason =
    txn.status === 'cancelled'
      ? `transaction blocked by ${agentById(state, txn.cancelledBy)?.name || 'a Gateway authority'}`
      : consent.status === 'revoked'
        ? 'consent revoked'
        : 'consent expired';

  return (
    <Modal
      title="Exchanged data package (mock)"
      subtitle={`Delivered to ${grantee?.name} · ${fmtDate(txn.at)} · Transaction ${txn.id}`}
      onClose={onClose}
    >
      <div className="stack" style={{ gap: 12 }}>
        <div className="row">
          <StatusPill status={txn.status} />
          <span className="tag">{locker?.icon} {locker?.name}</span>
          {endpoint && <span className="tag">🔌 {endpoint.name}</span>}
          {txn.consentId && <span className="tag">✅ Consent {txn.consentId}</span>}
        </div>

        {txn.data.map((d) => (
          <div key={d} className="card" style={{ background: 'var(--bg-panel)' }}>
            <div className="spread">
              <strong>📄 {d}</strong>
              <span style={{ color: 'var(--ok)', fontWeight: 650 }}>ATTESTED ✓</span>
            </div>
            <div className="small muted" style={{ marginTop: 6 }}>
              Subject: {owner?.name} · Issuer: {worldById(state, locker?.worldId)?.name}
            </div>
            <div className="faint" style={{ fontFamily: 'monospace', marginTop: 4 }}>
              signature SIG-{sig(txn.id + d)} · digest sha256:{sig(d + txn.id)}{sig(txn.id)}…
            </div>
            {accessLive ? (
              <button className="btn sm" style={{ marginTop: 10 }} onClick={() => setOpenDoc(openDoc === d ? null : d)}>
                {openDoc === d ? 'Hide document' : '📄 Show document'}
              </button>
            ) : (
              <div className="faint" style={{ marginTop: 10 }}>
                🔒 Document no longer viewable — {lockReason}. The signed attestation above remains on record.
              </div>
            )}
            {accessLive && openDoc === d && (
              <MockDocument record={d} owner={owner?.name} issuer={worldById(state, locker?.worldId)?.name} txn={txn} />
            )}
          </div>
        ))}

        <div>
          <div className="small muted" style={{ fontWeight: 600, marginBottom: 6 }}>Gateway route travelled:</div>
          <div className="row" style={{ gap: 4 }}>
            {txn.gatewayIds.map((g) => <span key={g} className="tag">📡 {gatewayName(g)}</span>)}
          </div>
        </div>

        <div className="faint">
          Simulated payload — no raw documents move in P3DX; endpoints return signed attestations scoped by the
          consent. <Link to="/transactions" onClick={onClose}>View in Transaction Ledger →</Link>
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
  const exchanges = state.transactions.filter((t) => t.consentId === consent.id);
  const [justRan, setJustRan] = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  // The completed-flash is feedback for whoever clicked Execute, not a label —
  // drop it once the perspective changes.
  useEffect(() => setJustRan(false), [state.actingAs]);

  function runExchange() {
    const requesterWorld = agentById(state, connection.requesterId)?.worldId;
    const hops = gatewayPath(state, requesterWorld, locker.worldId).map((g) => g.id);
    dispatch({ type: 'EXECUTE_EXCHANGE', consentId: consent.id, gatewayIds: hops });
    setJustRan(true);
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

      {exchanges.length > 0 && (
        <div
          className="row"
          style={{
            marginTop: 12,
            padding: '8px 12px',
            background: 'var(--bg-panel)',
            border: `1px solid ${justRan ? 'rgba(63, 185, 80, 0.45)' : 'var(--border-soft)'}`,
            borderRadius: 8,
          }}
        >
          {justRan && <strong style={{ color: 'var(--ok)' }}>✓ Exchange completed</strong>}
          <StatusPill status={exchanges[0].status} />
          <span className="faint">
            {exchanges.length} exchange{exchanges.length > 1 ? 's' : ''} under this consent · last {fmtDate(exchanges[0].at)}
          </span>
          <button className="btn sm" style={{ marginLeft: 'auto' }} onClick={() => setShowPayload(true)}>
            📄 View mock payload
          </button>
        </div>
      )}

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

      {showPayload && <MockPayloadModal txn={exchanges[0]} consent={consent} onClose={() => setShowPayload(false)} />}
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

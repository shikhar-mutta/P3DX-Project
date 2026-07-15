import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore, agentById, worldById } from '../store/store';
import { Avatar, Modal, WorldBreadcrumb, EmptyState } from '../components/ui';

// Anumati-style account view (reference Image 2): the agent's lockers as
// openable cards, plus "Create new locker" and "Consent dashboard" actions.

function CreateLockerModal({ owner, onClose }) {
  const { state, dispatch } = useStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [lockerType, setLockerType] = useState('general');
  const [worldId, setWorldId] = useState(owner.worldId);
  const [records, setRecords] = useState('');
  const [publishEndpoint, setPublishEndpoint] = useState(true);

  const types = [...new Set([...state.lockers.map((l) => l.type), 'general'])];

  function submit() {
    dispatch({
      type: 'CREATE_LOCKER',
      name: name.trim(),
      description: description.trim(),
      ownerId: owner.id,
      worldId,
      lockerType,
      records: records.split(',').map((r) => r.trim()).filter(Boolean),
      publishEndpoint,
    });
    onClose();
  }

  return (
    <Modal title="Create new locker" subtitle={`Owned by ${owner.name}`} onClose={onClose}>
      <div className="stack" style={{ gap: 12 }}>
        <div className="field">
          <label>Locker name</label>
          <input placeholder="e.g. Insurance Locker" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Description</label>
          <input placeholder="What lives in this locker?" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="row" style={{ alignItems: 'stretch' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Type</label>
            <select value={lockerType} onChange={(e) => setLockerType(e.target.value)}>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 2 }}>
            <label>Hosted in World</label>
            <select value={worldId} onChange={(e) => setWorldId(e.target.value)}>
              {state.worlds.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Records (comma-separated)</label>
          <input placeholder="e.g. Policy Document, Claim History" value={records} onChange={(e) => setRecords(e.target.value)} />
        </div>
        <label className="checkbox-row">
          <input type="checkbox" checked={publishEndpoint} onChange={(e) => setPublishEndpoint(e.target.checked)} />
          Publish a connection endpoint (lets agents in other Worlds request access)
        </label>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!name.trim()} onClick={submit}>Create locker</button>
        </div>
      </div>
    </Modal>
  );
}

function LockerCard({ locker }) {
  const { state } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="card">
      <div className="spread">
        <div style={{ minWidth: 0 }}>
          <h3>{locker.icon} {locker.name}</h3>
          <div className="muted small">{locker.description || `${locker.type} locker`}</div>
          <div className="faint" style={{ marginTop: 2 }}>
            Hosted in <WorldBreadcrumb worldId={locker.worldId} /> · <span className="tag">{locker.type}</span>
          </div>
        </div>
        <button className="btn sm primary" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close' : 'Open'}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border-soft)', paddingTop: 10 }}>
          <div className="small muted" style={{ fontWeight: 600, marginBottom: 4 }}>Records</div>
          <div className="row" style={{ marginBottom: 10 }}>
            {locker.records.length === 0 && <span className="faint">No records yet.</span>}
            {locker.records.map((r) => <span key={r} className="tag">📄 {r}</span>)}
          </div>
          <div className="small muted" style={{ fontWeight: 600, marginBottom: 4 }}>Connection endpoints</div>
          {locker.endpoints.length === 0 && <span className="faint small">None published — unreachable from other Worlds.</span>}
          {locker.endpoints.map((e) => (
            <div key={e.id} className="small" style={{ padding: '4px 0' }}>
              🔌 <strong>{e.name}</strong>
              <div className="faint">{e.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgentDetail() {
  const { agentId } = useParams();
  const { state } = useStore();
  const [showCreate, setShowCreate] = useState(false);
  const agent = agentById(state, agentId);

  if (!agent) return <EmptyState>Agent not found.</EmptyState>;

  const myLockers = state.lockers.filter((l) => l.ownerId === agent.id);
  const isActing = state.actingAs === agent.id;
  const myConnections = state.connections.filter(
    (c) => c.requesterId === agent.id || state.lockers.find((l) => l.id === c.lockerId)?.ownerId === agent.id
  );
  const myConsents = state.consents.filter(
    (c) => c.granteeId === agent.id || state.lockers.find((l) => l.id === c.lockerId)?.ownerId === agent.id
  );

  return (
    <div className="stack">
      <div className="card">
        <div className="spread">
          <div className="row" style={{ gap: 14 }}>
            <Avatar agent={agent} size={46} />
            <div>
              <h3 style={{ fontSize: 18 }}>{agent.name}</h3>
              <div className="muted small">{agent.role}</div>
              <div className="faint">
                Resides in <WorldBreadcrumb worldId={agent.worldId} />
              </div>
            </div>
          </div>
          <div className="row">
            <Link to={`/worlds/${agent.worldId}`} className="btn sm">
              Visit {worldById(state, agent.worldId)?.name} →
            </Link>
            <Link to="/consents" className="btn sm">Consent dashboard</Link>
            {isActing && (
              <button className="btn sm primary" onClick={() => setShowCreate(true)}>
                + Create new locker
              </button>
            )}
          </div>
        </div>
        <p className="muted small" style={{ marginBottom: 0 }}>{agent.bio}</p>
        {!isActing && (
          <p className="faint" style={{ margin: '6px 0 0' }}>
            Switch “Acting as” to {agent.name} in the top bar to create lockers or act on their behalf.
          </p>
        )}
      </div>

      <div className="stat-row">
        <Link to="/connections" className="stat" style={{ color: 'inherit' }}>
          <div className="num">{myConnections.length}</div>
          <div className="lbl">Connections involved in</div>
        </Link>
        <Link to="/consents" className="stat" style={{ color: 'inherit' }}>
          <div className="num">{myConsents.length}</div>
          <div className="lbl">Consents involved in</div>
        </Link>
        <div className="stat">
          <div className="num">{myLockers.length}</div>
          <div className="lbl">Lockers owned</div>
        </div>
      </div>

      <div className="section-title">{isActing ? 'My Lockers' : `${agent.name.split(' ')[0]}'s Lockers`}</div>
      {myLockers.length === 0 ? (
        <EmptyState>No lockers yet.{isActing && ' Use “Create new locker” to add one.'}</EmptyState>
      ) : (
        <div className="grid-2">
          {myLockers.map((l) => <LockerCard key={l.id} locker={l} />)}
        </div>
      )}

      {showCreate && <CreateLockerModal owner={agent} onClose={() => setShowCreate(false)} />}
    </div>
  );
}

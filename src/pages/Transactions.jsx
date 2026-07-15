import { useMemo, useState } from 'react';
import { useStore, agentById, lockerById } from '../store/store';
import { Avatar, StatusPill, EmptyState, fmtDate } from '../components/ui';

export default function Transactions() {
  const { state } = useStore();
  const [query, setQuery] = useState('');

  const gatewayName = (id) =>
    state.worlds.find((w) => w.gateway.id === id)?.gateway.name || id;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.transactions.filter((t) => {
      if (!q) return true;
      const from = lockerById(state, t.fromLockerId);
      const to = agentById(state, t.requesterId);
      return (
        from?.name.toLowerCase().includes(q) ||
        to?.name.toLowerCase().includes(q) ||
        t.purpose.toLowerCase().includes(q) ||
        t.data.some((d) => d.toLowerCase().includes(q))
      );
    });
  }, [state, query]);

  return (
    <div className="stack">
      <div className="card" style={{ padding: '10px 16px' }}>
        <span className="small muted">
          Every cross-World exchange is a recorded transaction: <strong>who</strong> shared <strong>what</strong>, with{' '}
          <strong>whom</strong>, under <strong>which consent</strong>, through <strong>which Gateway(s)</strong>. “An AI
          accessed my record” is never a mystery here.
        </span>
      </div>

      <input
        className="search-input"
        placeholder="Filter by party, data or purpose…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {rows.length === 0 ? (
        <EmptyState>No transactions recorded{query ? ' matching your filter' : ' yet'}.</EmptyState>
      ) : (
        <div className="card table-wrap" style={{ padding: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>From (locker)</th>
                <th>To (requester)</th>
                <th>Data shared</th>
                <th>Consent</th>
                <th>Gateway route</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const from = lockerById(state, t.fromLockerId);
                const to = agentById(state, t.requesterId);
                return (
                  <tr key={t.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(t.at)}</td>
                    <td>{from?.icon} {from?.name}</td>
                    <td>
                      <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                        {to && <Avatar agent={to} size={22} />}
                        <span>{to?.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="row" style={{ gap: 4 }}>
                        {t.data.map((d) => <span key={d} className="tag">{d}</span>)}
                      </div>
                      <div className="faint" style={{ marginTop: 2 }}>{t.purpose}</div>
                    </td>
                    <td className="small">{t.consentId ? `Consent ${t.consentId}` : t.consentLabel}</td>
                    <td>
                      <div className="row" style={{ gap: 4 }}>
                        {t.gatewayIds.map((g) => <span key={g} className="tag">📡 {gatewayName(g)}</span>)}
                      </div>
                    </td>
                    <td><StatusPill status={t.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

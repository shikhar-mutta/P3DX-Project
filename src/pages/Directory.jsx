import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, worldById } from '../store/store';
import { Avatar, WorldBreadcrumb, EmptyState } from '../components/ui';

export default function Directory() {
  const { state } = useStore();
  const [query, setQuery] = useState('');
  const [worldFilter, setWorldFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');
  const [lockerType, setLockerType] = useState('all');

  const lockerTypes = [...new Set(state.lockers.map((l) => l.type))];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.agents.filter((a) => {
      if (worldFilter !== 'all' && a.worldId !== worldFilter) return false;
      if (kindFilter !== 'all' && a.kind !== kindFilter) return false;
      const ownLockers = state.lockers.filter((l) => l.ownerId === a.id);
      if (lockerType !== 'all' && !ownLockers.some((l) => l.type === lockerType)) return false;
      if (!q) return true;
      const world = worldById(state, a.worldId);
      return (
        a.name.toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q) ||
        world?.name.toLowerCase().includes(q) ||
        ownLockers.some((l) => l.name.toLowerCase().includes(q))
      );
    });
  }, [state, query, worldFilter, kindFilter, lockerType]);

  return (
    <div className="stack">
      <div className="card">
        <div className="row" style={{ gap: 10 }}>
          <input
            className="search-input"
            style={{ flex: 2, minWidth: 200 }}
            placeholder="Search by name, role, world or locker…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="search-input" style={{ flex: 1, minWidth: 140 }} value={worldFilter} onChange={(e) => setWorldFilter(e.target.value)}>
            <option value="all">All Worlds</option>
            {state.worlds.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <select className="search-input" style={{ flex: 1, minWidth: 120 }} value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
            <option value="all">All agent kinds</option>
            <option value="human">Humans</option>
            <option value="ai">AI agents</option>
            <option value="institution">Institutions</option>
          </select>
          <select className="search-input" style={{ flex: 1, minWidth: 130 }} value={lockerType} onChange={(e) => setLockerType(e.target.value)}>
            <option value="all">All locker types</option>
            {lockerTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState>No agents match your search.</EmptyState>
      ) : (
        <div className="grid-2">
          {results.map((a) => {
            const world = worldById(state, a.worldId);
            const ownLockers = state.lockers.filter((l) => l.ownerId === a.id);
            return (
              <div key={a.id} className="card">
                <div className="row" style={{ gap: 12, marginBottom: 8 }}>
                  <Avatar agent={a} size={40} />
                  <div style={{ minWidth: 0 }}>
                    <h3>{a.name}</h3>
                    <div className="faint">{a.role}</div>
                  </div>
                  {a.kind === 'ai' && <span className="tag" style={{ marginLeft: 'auto' }}>AI</span>}
                </div>
                <div className="small" style={{ marginBottom: 8 }}>
                  <WorldBreadcrumb worldId={a.worldId} />
                </div>
                {ownLockers.length > 0 && (
                  <div className="row" style={{ marginBottom: 10 }}>
                    {ownLockers.map((l) => (
                      <span key={l.id} className="tag" title={`Hosted in ${worldById(state, l.worldId)?.name}`}>
                        {l.icon} {l.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="row">
                  <Link to={`/agents/${a.id}`} className="btn sm primary" style={{ display: 'inline-block' }}>
                    Enter →
                  </Link>
                  <Link to={`/worlds/${a.worldId}`} className="btn sm" style={{ display: 'inline-block' }}>
                    🌐 {world?.name}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

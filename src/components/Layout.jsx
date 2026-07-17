import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../store/store';
import { Avatar } from './ui';

const NAV = [
  { to: '/', icon: '🏠', label: 'Overview' },
  { to: '/worlds', icon: '🌐', label: 'World Explorer' },
  { to: '/directory', icon: '👥', label: 'Directory' },
  { to: '/connections', icon: '🔗', label: 'Connections' },
  { to: '/consents', icon: '✅', label: 'Consents' },
  { to: '/transactions', icon: '📜', label: 'Transactions' },
];

const TITLES = {
  '/': 'Overview',
  '/worlds': 'World Explorer',
  '/directory': 'Agent & Locker Directory',
  '/connections': 'Cross-World Connections',
  '/consents': 'Consent Management',
  '/transactions': 'Transaction Ledger',
};

export default function Layout({ children }) {
  const { state, dispatch } = useStore();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('p3dx-theme', theme);
  }, [theme]);

  const actor = state.agents.find((a) => a.id === state.actingAs);
  const title =
    TITLES[pathname] ||
    (pathname.startsWith('/worlds') ? 'World Explorer' : pathname.startsWith('/agents') ? 'Agent Account' : 'P3DX');

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="hamburger"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar"
            onClick={() => setCollapsed((c) => !c)}
          >
            ☰
          </button>
          <div className="brand">
            <div className="brand-mark">P3</div>
            <div>
              <div className="brand-name">P3DX</div>
              <div className="brand-sub">Cross-Border Exchange</div>
            </div>
          </div>
        </div>
        <h1>{title}</h1>
        <button
          className="theme-toggle"
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label="Toggle theme"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="actor-picker" title="Perspective: whose actions are you performing?">
          {actor && <Avatar agent={actor} size={26} />}
          <span className="muted small">Acting as</span>
          <select value={state.actingAs} onChange={(e) => dispatch({ type: 'SET_ACTOR', agentId: e.target.value })}>
            {state.agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.role}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="shell-body">
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              title={n.label}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{n.icon}</span>
              <span className="nav-label">{n.label}</span>
            </NavLink>
          ))}
          <div className="sidebar-footer">
            <button
              className="btn sm"
              title="Restore the original demo data"
              onClick={() => {
                if (confirm('Reset all demo data to the initial state?')) dispatch({ type: 'RESET' });
              }}
            >
              ↺ <span className="nav-label">Reset demo</span>
            </button>
          </div>
        </aside>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

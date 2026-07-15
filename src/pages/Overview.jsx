import { Link } from 'react-router-dom';
import { useStore } from '../store/store';

const SCENARIO_STEPS = [
  {
    icon: '🤖',
    text: 'Switch “Acting as” to CredCheck Verification AI (the Berlin employer’s agent) and request a connection to the Degree Verification Endpoint on Arjun’s Academic Locker.',
    link: '/connections',
    linkText: 'Connections',
  },
  {
    icon: '📡',
    text: 'The request queues at the university’s Gateway. Clear it at the Gateway — it moves from requested to pending.',
    link: '/connections',
    linkText: 'Connections',
  },
  {
    icon: '👤',
    text: 'Switch to Arjun Mehta, the data owner, and approve the pending connection — the governed channel is established.',
    link: '/connections',
    linkText: 'Connections',
  },
  {
    icon: '✅',
    text: 'Still as Arjun, grant a consent scoped to exactly the degree certificate, for the verification purpose, time-boxed and conditioned.',
    link: '/consents',
    linkText: 'Consents',
  },
  {
    icon: '⇄',
    text: 'Switch back to CredCheck AI and execute the exchange — the data flows through both Gateways (India → EU) and lands in the ledger.',
    link: '/transactions',
    linkText: 'Transactions',
  },
];

export default function Overview() {
  const { state } = useStore();

  const stats = [
    { num: state.worlds.length, lbl: 'Worlds', to: '/worlds' },
    { num: state.agents.length, lbl: 'Agents', to: '/directory' },
    { num: state.lockers.length, lbl: 'Lockers', to: '/directory' },
    { num: state.connections.filter((c) => c.status === 'established').length, lbl: 'Established channels', to: '/connections' },
    { num: state.consents.filter((c) => c.status === 'active').length, lbl: 'Active consents', to: '/consents' },
    { num: state.transactions.length, lbl: 'Transactions logged', to: '/transactions' },
  ];

  return (
    <div className="stack">
      <div className="card">
        <h3 style={{ fontSize: 18 }}>Cross-border data exchange, governed by Worlds</h3>
        <p className="muted">
          An Indian citizen's degree lives with a Bengaluru university, his health record with a hospital, his tax
          identity with the government — and his employer sits in Berlin, under GDPR. In P3DX, each of these lives
          inside a <strong>World</strong> that enforces its own rules; nothing crosses a boundary except through a{' '}
          <strong>Gateway</strong>, nothing moves without <strong>consent</strong>, and every hop is{' '}
          <strong>recorded</strong>. Use the sidebar to explore, or run the scenario below.
        </p>
        <div className="stat-row">
          {stats.map((s) => (
            <Link key={s.lbl} to={s.to} className="stat" style={{ color: 'inherit' }}>
              <div className="num">{s.num}</div>
              <div className="lbl">{s.lbl}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>▶ Demo walkthrough: verify a degree across a border</h3>
        <p className="muted small" style={{ marginTop: 2 }}>
          The headline scenario end-to-end. The “Acting as” switcher in the top bar lets you play each party in turn —
          requester, gateway, and data owner.
        </p>
        <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SCENARIO_STEPS.map((s, i) => (
            <li key={i} className="small">
              <span style={{ marginRight: 6 }}>{s.icon}</span>
              {s.text} <Link to={s.link}>→ {s.linkText}</Link>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3>🌐 Worlds & Gateways</h3>
          <p className="muted small">
            Nested trust domains — jurisdictions containing institutions containing departments — each with exactly one
            Gateway on its border.
          </p>
          <Link to="/worlds" className="btn sm" style={{ display: 'inline-block' }}>Open World Explorer →</Link>
        </div>
        <div className="card">
          <h3>🔗 Governed connections</h3>
          <p className="muted small">
            Agents — human or AI — request entry into foreign Worlds. Requests pass a Gateway screen, then the data
            owner decides.
          </p>
          <Link to="/connections" className="btn sm" style={{ display: 'inline-block' }}>Manage connections →</Link>
        </div>
        <div className="card">
          <h3>✅ Scoped consent</h3>
          <p className="muted small">
            What data, for what purpose, for how long, under what conditions — granted per flow and revocable at any
            time.
          </p>
          <Link to="/consents" className="btn sm" style={{ display: 'inline-block' }}>Manage consents →</Link>
        </div>
        <div className="card">
          <h3>📜 Accountable ledger</h3>
          <p className="muted small">
            Every exchange is a logged transaction with its consent and Gateway route — auditable, never a mystery.
          </p>
          <Link to="/transactions" className="btn sm" style={{ display: 'inline-block' }}>View ledger →</Link>
        </div>
      </div>
    </div>
  );
}

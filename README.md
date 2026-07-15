# P3DX — Cross-Border Data Exchange Dashboard

A React dashboard that makes the IUDX **Worlds** model visible, navigable and operable:
nested trust domains (Jurisdiction → Institution → Department), each guarded by a single
**Gateway**, with **connections**, **consents** and **transactions** flowing between agents
who live under different governance rules.

Built for the P3DX Project Elective evaluation task.

## Running it

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`). No backend needed — the whole
system is modelled client-side and persisted to `localStorage`. The **↺ Reset demo**
button in the sidebar restores the initial seed data.

## The scenario modelled

Arjun Mehta, an Indian citizen, studied at a Bengaluru university and now works at a
Berlin company. His degree lives with the university, his health record with a hospital,
his tax identity with the Income Tax Department — and his employer operates under GDPR.

The seed data builds exactly this: a **Republic of India** jurisdictional World (DPDP Act)
containing University / Hospital / Tax-Department institutional Worlds, and a separate
**European Union** World (GDPR) containing the employer and its HR department. Every World
has exactly one Gateway pinned on its boundary.

## Demo walkthrough (also the script for the video)

The **"Acting as"** switcher in the top bar lets you play each party in turn:

1. **Act as CredCheck Verification AI** (the Berlin employer's agent) → *Connections* →
   request a connection to the **Degree Verification Endpoint** on Arjun's Academic Locker.
   The UI shows the full route the request must travel: HR Dept Gateway → Corporate Gateway
   → EU Gateway → India Gateway → University Gateway → Records Dept Gateway.
2. **Clear the request at the Gateway** — it moves `requested → pending`.
3. **Act as Arjun Mehta** (the data owner) → approve the pending connection —
   `pending → established`.
4. Still as Arjun → *Consents* → the established connection appears under **"Awaiting your
   consent"**. Grant a consent scoped to exactly the degree certificate, with an explicit
   purpose, a duration in days, and conditions (e.g. *signed attestation only*).
5. **Act as CredCheck AI** again → execute the exchange under that consent — a transaction
   lands in the ledger recording who shared what, with whom, under which consent, through
   which Gateways.
6. Revoke the consent (or the whole connection) as Arjun — further exchanges are blocked;
   revoking a connection cascades to every consent riding on it.

## How the system is modelled

All state lives in one reducer ([src/store/store.jsx](src/store/store.jsx)) over seed data
([src/data/seed.js](src/data/seed.js)):

- **Worlds** form a tree via `parentId`; each carries its governing law and exactly one
  `gateway`. The World Explorer renders this tree as nested dashed boundaries — the Gateway
  chip sits *on* the border, because it is the border.
- **Connections** follow a state machine:
  `requested → pending → established`, with `denied` possible at either step and `revoked`
  by the owner afterwards. Every change is appended to a per-connection history.
- **`gatewayPath(from, to)`** computes the hops a crossing must make: exit up through the
  requester's boundaries, enter down through the target's, skipping the shared ancestor —
  so a domestic request crosses 2 gateways while the Berlin → Bengaluru request crosses 6.
- **Consents** attach to an established connection and carry the four terms the task asks
  for: *data* (record-level scope), *purpose*, *duration*, *conditions*. They expire by
  date and are revocable; revoking a connection revokes its consents.
- **Transactions** can only be created through the reducer guard: an active consent on an
  established connection. The ledger records the consented scope and the full Gateway route.

Pages: Overview (stats + guided scenario) · World Explorer (nested map) · World detail
(agents, lockers, endpoints, gateway traffic) · Directory (search + filters by world /
agent kind / locker type) · Agent account (Anumati-style "My Lockers" with create-locker
and consent-dashboard actions) · Connections · Consents · Transactions.

## Fidelity to the reference images

- **Image 1** (Jurisdictional World diagram): the World Explorer renders the same
  containment — nested Worlds with agents and lockers inside, the Company World holding
  two Departmental Worlds, and a Gateway (📡, matching the legend's tower symbol) on
  every boundary. Lockers publish 🔌 connection endpoints, visible in World detail and
  the connection wizard.
- **Image 2** (Anumati "My Lockers"): entering an agent from the Directory opens their
  account page — locker cards with description and an **Open** button, plus **Create new
  locker** and **Consent dashboard** actions.
- **Image 3** (User Directory): the Directory lists every agent as a card with role and
  an **Enter** button, with search and filters on top.

## Stack

React 19 + Vite, React Router, plain CSS (no UI library). State via `useReducer` +
Context, persisted to `localStorage`.
# P3DX-Project

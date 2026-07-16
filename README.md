# P3DX — Cross-Border Data Exchange Dashboard

A React dashboard that makes the P3DX Worlds model visible, navigable, and operable:
nested trust domains (Jurisdiction → Institution → Department), each guarded by a single
Gateway, with connections, consents, and transactions flowing between agents who live
under different governance rules.

## Running it

```bash
npm install
npm run dev
```

Open the printed URL, usually `http://localhost:5173`. The app runs fully client-side and
persists state in `localStorage`.

## What the app models

- Worlds form a nested tree of jurisdictional, institutional, and departmental domains.
- Every World has exactly one Gateway on its boundary.
- Agents live inside Worlds and own Lockers.
- Lockers may publish Connection Endpoints.
- Connections must cross a Gateway, then be approved by the owner.
- Consents scope the exact data flow.
- Transactions record each governed exchange.

## Demo walkthrough

1. Log in with one of the two demo users.
2. Open the World Explorer to inspect nested Worlds and Gateways.
3. Use the Directory to enter an agent account and inspect lockers.
4. Request a connection to a published endpoint in another World.
5. Approve the connection, then grant consent.
6. Execute the exchange and review the transaction log.
7. Logout to clear the local session.

## Diagrams

### 1) Cross-border World architecture

```mermaid
flowchart TB
  subgraph INDIA["India Jurisdictional World"]
    G1["Gateway"]

    subgraph UNIV["University World"]
      U1["Agent: Registrar"]
      L1["Locker: Academic Records"]
      E1["Connection Endpoint: Degree Verify"]
      U1 --> L1 --> E1
    end

    subgraph HOSP["Hospital World"]
      H1["Agent: Hospital Admin"]
      L2["Locker: Health Records"]
      E2["Connection Endpoint: Health Summary"]
      H1 --> L2 --> E2
    end
  end

  subgraph EU["EU Jurisdictional World"]
    G2["Gateway"]

    subgraph COMPANY["Company World"]
      C1["Agent: HR Manager"]
      L3["Locker: Employment Records"]
      E3["Connection Endpoint: Verification Request"]
      C1 --> L3 --> E3
    end
  end

  E3 --> R1["Connection Request"] --> G1
  G1 --> R2["Gateway Check"] --> G2
  G2 --> R3["Owner Approval"] --> S1["Consent Granted"] --> T1["Transaction Logged"]
```

### 2) User journey

```mermaid
flowchart LR
  A[Login] --> B[Browse Worlds]
  B --> C[Open World detail]
  C --> D[Request connection]
  D --> E[Gateway screening]
  E --> F[Owner approves]
  F --> G[Grant consent]
  G --> H[Execute data exchange]
  H --> I[Transaction appears in ledger]
  I --> J[Logout]
```

### 3) UI and reference mapping

```mermaid
flowchart TB
  subgraph App["P3DX Dashboard UI"]
    O["Overview"]
    W["World Explorer"]
    D["Directory"]
    A["Agent / Locker detail"]
    C["Connections"]
    S["Consents"]
    T["Transactions"]
  end

  subgraph References["Reference Images"]
    I1["Image 1: World architecture"]
    I2["Image 2: My Lockers screen"]
    I3["Image 3: User Directory"]
  end

  I1 --> W
  I2 --> A
  I3 --> D
  O --> W --> C --> S --> T
```

## Stack

React 19 + Vite, React Router, plain CSS (no UI library). State via `useReducer` and
Context, persisted to `localStorage`.

import { createContext, useContext, useEffect, useReducer } from 'react';
import { seedState } from '../data/seed';

// ---------------------------------------------------------------------------
// Central store. Connections follow the state machine
//   requested → pending → established → (revoked)
//                       ↘ denied
// requested→pending is the Gateway policy screen; pending→established is the
// data owner's approval. Consents attach to established connections, and
// transactions can only be executed against an active consent.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'p3dx-dashboard-state-v3';

function now() {
  return new Date().toISOString();
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_ACTOR':
      return { ...state, actingAs: action.agentId };

    case 'REQUEST_CONNECTION': {
      const { requesterId, endpointId, lockerId, purpose } = action;
      const conn = {
        id: uid('c'),
        requesterId,
        endpointId,
        lockerId,
        purpose,
        status: 'requested',
        history: [{ status: 'requested', at: now(), note: 'Connection request submitted at destination Gateway' }],
      };
      return { ...state, connections: [conn, ...state.connections] };
    }

    case 'GATEWAY_CLEAR': {
      return updateConnection(state, action.id, 'pending', action.note || 'Cleared Gateway policy screen; awaiting data-owner approval');
    }

    case 'APPROVE_CONNECTION': {
      return updateConnection(state, action.id, 'established', 'Approved by data owner — governed channel open');
    }

    case 'DENY_CONNECTION': {
      return updateConnection(state, action.id, 'denied', action.note || 'Denied at Gateway / by data owner');
    }

    case 'REVOKE_CONNECTION': {
      const next = updateConnection(state, action.id, 'revoked', 'Connection revoked by data owner');
      // Revoking the channel also revokes every consent that rode on it.
      return {
        ...next,
        consents: next.consents.map((c) =>
          c.connectionId === action.id && c.status === 'active'
            ? { ...c, status: 'revoked', revokedAt: now() }
            : c
        ),
      };
    }

    case 'CREATE_LOCKER': {
      const locker = {
        id: uid('l'),
        name: action.name,
        description: action.description,
        ownerId: action.ownerId,
        worldId: action.worldId,
        type: action.lockerType,
        icon: '🔐',
        records: action.records,
        endpoints: action.publishEndpoint
          ? [{
              id: uid('ep'),
              name: `${action.name} Access Endpoint`,
              description: 'Published connection endpoint — agents in other Worlds can request a governed connection here.',
            }]
          : [],
      };
      return { ...state, lockers: [...state.lockers, locker] };
    }

    case 'GRANT_CONSENT': {
      const consent = {
        id: uid('cs'),
        connectionId: action.connectionId,
        lockerId: action.lockerId,
        granteeId: action.granteeId,
        data: action.data,
        purpose: action.purpose,
        durationDays: action.durationDays,
        conditions: action.conditions,
        status: 'active',
        grantedAt: now(),
      };
      return { ...state, consents: [consent, ...state.consents] };
    }

    case 'REVOKE_CONSENT': {
      return {
        ...state,
        consents: state.consents.map((c) =>
          c.id === action.id ? { ...c, status: 'revoked', revokedAt: now() } : c
        ),
      };
    }

    case 'EXECUTE_EXCHANGE': {
      const consent = state.consents.find((c) => c.id === action.consentId);
      const conn = state.connections.find((c) => c.id === consent?.connectionId);
      if (!consent || consent.status !== 'active' || !conn || conn.status !== 'established') {
        return state; // ledger only accepts governed, consented exchanges
      }
      const txn = {
        id: uid('t'),
        at: now(),
        fromLockerId: consent.lockerId,
        requesterId: conn.requesterId,
        connectionId: conn.id,
        consentId: consent.id,
        consentLabel: `Consent ${consent.id}`,
        data: consent.data,
        gatewayIds: action.gatewayIds,
        purpose: consent.purpose,
        status: 'completed',
      };
      return { ...state, transactions: [txn, ...state.transactions] };
    }

    case 'CANCEL_TRANSACTION': {
      // Post-exchange compliance action: an officer of a gateway on the
      // transaction's route recalls the exchange after the fact. Blocking the
      // exchange also revokes the consent it rode on — access ends with it.
      const txn = state.transactions.find((t) => t.id === action.id);
      if (!txn || txn.status !== 'completed') return state;
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.id
            ? {
                ...t,
                status: 'cancelled',
                cancelledAt: now(),
                cancelledBy: action.officerId,
                cancelledVia: action.gatewayId,
                cancelNote: action.note,
              }
            : t
        ),
        consents: state.consents.map((c) =>
          c.id === txn.consentId && c.status === 'active'
            ? { ...c, status: 'revoked', revokedAt: now() }
            : c
        ),
      };
    }

    case 'RESET':
      return seedState();

    default:
      return state;
  }
}

function updateConnection(state, id, status, note) {
  return {
    ...state,
    connections: state.connections.map((c) =>
      c.id === id
        ? { ...c, status, history: [...c.history, { status, at: now(), note }] }
        : c
    ),
  };
}

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted storage falls back to seed */
  }
  return seedState();
}

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

// ---- selectors -------------------------------------------------------------

export function worldById(state, id) {
  return state.worlds.find((w) => w.id === id);
}

export function agentById(state, id) {
  return state.agents.find((a) => a.id === id);
}

export function lockerById(state, id) {
  return state.lockers.find((l) => l.id === id);
}

export function childWorlds(state, parentId) {
  return state.worlds.filter((w) => w.parentId === parentId);
}

/** Chain of worlds from a world up to its root jurisdiction (inner → outer). */
export function worldChain(state, worldId) {
  const chain = [];
  let cur = worldById(state, worldId);
  while (cur) {
    chain.push(cur);
    cur = cur.parentId ? worldById(state, cur.parentId) : null;
  }
  return chain;
}

/**
 * Gateways a crossing must pass through, from the requester's world to the
 * target locker's world: exit up through the requester's boundaries, enter
 * down through the target's — skipping the shared ancestor's own gateway.
 */
export function gatewayPath(state, fromWorldId, toWorldId) {
  const fromChain = worldChain(state, fromWorldId); // inner → outer
  const toChain = worldChain(state, toWorldId);
  const toIds = new Set(toChain.map((w) => w.id));
  const shared = fromChain.find((w) => toIds.has(w.id)) || null;

  const exits = [];
  for (const w of fromChain) {
    if (shared && w.id === shared.id) break;
    exits.push(w.gateway);
  }
  const entries = [];
  for (const w of toChain) {
    if (shared && w.id === shared.id) break;
    entries.push(w.gateway);
  }
  return [...exits, ...entries.reverse()];
}

export function isCrossBorder(state, fromWorldId, toWorldId) {
  const root = (id) => worldChain(state, id).at(-1)?.id;
  return root(fromWorldId) !== root(toWorldId);
}

/** Gateways a connection crosses, from its requester's world to its locker's. */
export function connectionGateways(state, connection) {
  const requester = agentById(state, connection.requesterId);
  const locker = lockerById(state, connection.lockerId);
  if (!requester || !locker) return [];
  return gatewayPath(state, requester.worldId, locker.worldId);
}

/**
 * The gateway on this connection's path where the given agent is the Gateway
 * Officer (and may therefore clear or deny the crossing), or null.
 */
export function officerGatewayFor(state, connection, agentId) {
  return connectionGateways(state, connection).find((g) => g.officerId === agentId) || null;
}

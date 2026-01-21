// In-memory store. Replace with DB in production.
export const db = {
  invites: new Map(), // code -> { code, createdAt, usedBy? }
  users: new Map(),   // username -> { username, passHash, id }
  sessions: new Map(), // token -> { username }
  pendingTx: new Map(), // id -> {...}
};

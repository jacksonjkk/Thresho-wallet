# Backend (Node.js + Express)

Orchestrates auth (with invite flow), transaction proposals, approval collection, and Horizon interactions. Stores pending transaction metadata only; never stores private keys.

Run:

```bash
cd backend
npm install
npm run dev
```

Env (optional via .env):
- `PORT` (default 4000)
- `HORIZON_URL` (default https://horizon-testnet.stellar.org)
- `JWT_SECRET` (default dev-secret)

Endpoints (selected):
- POST /auth/create-invite (admin stub)
- POST /auth/signup
- POST /auth/login
- GET /me
- GET /wallet/:pubKey/balances
- POST /tx/propose
- GET /tx/pending
- GET /tx/:id
- POST /tx/:id/approve (submit signed XDR)
- POST /tx/:id/reject

See scripts/setupThresholdAccount.js to create a test account with 3 signers and threshold=2.

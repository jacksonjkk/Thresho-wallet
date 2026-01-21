import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { db } from './store.js';
import * as StellarSDK from 'stellar-sdk';
const { Networks, TransactionBuilder, Operation, Asset } = StellarSDK;
const { Server } = StellarSDK.Horizon;
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(cookieParser());

const PORT = process.env.PORT || 4000;
const HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const server = new Server(HORIZON_URL);

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing auth' });
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { username: payload.username };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Auth & invites
app.post('/auth/create-invite', (req, res) => {
  const code = nanoid(10);
  db.invites.set(code, { code, createdAt: Date.now() });
  res.json({ code });
});

app.post('/auth/signup', async (req, res) => {
  const { username, password, inviteCode } = req.body || {};
  if (!username || !password || !inviteCode) return res.status(400).json({ error: 'Missing fields' });
  const invite = db.invites.get(inviteCode);
  if (!invite || invite.usedBy) return res.status(400).json({ error: 'Invalid invite' });
  if (db.users.has(username)) return res.status(400).json({ error: 'Username taken' });
  const passHash = await bcrypt.hash(password, 10);
  db.users.set(username, { username, passHash, id: nanoid() });
  invite.usedBy = username;
  res.json({ ok: true });
});

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  const user = db.users.get(username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, username });
});

app.get('/me', authMiddleware, (req, res) => {
  res.json({ username: req.user.username });
});

// Wallet
app.get('/wallet/:pubKey/balances', authMiddleware, async (req, res) => {
  try {
    const acct = await server.loadAccount(req.params.pubKey);
    const balances = acct.balances.map(b => ({
      asset: b.asset_type === 'native' ? 'XLM' : `${b.asset_code}:${b.asset_issuer}`,
      balance: b.balance,
    }));
    const thresholds = {
      low: acct.thresholds.low_threshold,
      med: acct.thresholds.med_threshold,
      high: acct.thresholds.high_threshold,
      signers: acct.signers.map(s => ({ key: s.key, weight: s.weight })),
    };
    res.json({ balances, thresholds });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Transactions orchestration
app.post('/tx/propose', authMiddleware, async (req, res) => {
  try {
    const { sourcePublicKey, destinationPublicKey, amount, asset = 'XLM', memo, level = 'med', category } = req.body || {};
    const source = await server.loadAccount(sourcePublicKey);
    const assetObj = asset === 'XLM' ? Asset.native() : Asset.fromOperation({ code: asset.split(':')[0], issuer: asset.split(':')[1] });

    const tx = new TransactionBuilder(source, { fee: '200', networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(Operation.payment({ destination: destinationPublicKey, amount: String(amount), asset: assetObj }))
      .setTimeout(180)
      .build();

    const id = nanoid();
    const record = {
      id,
      createdBy: req.user.username,
      createdAt: Date.now(),
      sourcePublicKey,
      destinationPublicKey,
      amount: String(amount),
      asset,
      memo,
      level,
      category,
      xdr: tx.toXDR('base64'),
      approvals: [], // { signerPublicKey, weight, signedXDR, at }
      status: 'pending',
      submittedResult: null,
    };
    db.pendingTx.set(id, record);
    res.json(record);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/tx/pending', authMiddleware, (req, res) => {
  res.json(Array.from(db.pendingTx.values()).filter(t => t.status === 'pending'));
});

app.get('/tx/:id', authMiddleware, (req, res) => {
  const t = db.pendingTx.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
});

app.post('/tx/:id/approve', authMiddleware, async (req, res) => {
  try {
    const { signedXDR, signerPublicKey } = req.body || {};
    const t = db.pendingTx.get(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (t.status !== 'pending') return res.status(400).json({ error: 'Not pending' });

    const acct = await server.loadAccount(t.sourcePublicKey);
    const signer = acct.signers.find(s => s.key === signerPublicKey);
    if (!signer) return res.status(400).json({ error: 'Signer not part of account' });

    // Accept signed XDR from client wallet; store weight for threshold.
    t.approvals = t.approvals.filter(a => a.signerPublicKey !== signerPublicKey);
    t.approvals.push({ signerPublicKey, weight: signer.weight, signedXDR, at: Date.now() });

    const requiredWeight = t.level === 'high' ? acct.thresholds.high_threshold : (t.level === 'low' ? acct.thresholds.low_threshold : acct.thresholds.med_threshold);
    const total = t.approvals.reduce((s, a) => s + (a.weight || 0), 0);

    if (total >= requiredWeight) {
      // Attempt submission. Use the signed envelope with (hopefully) enough signatures.
      // Choose the envelope with the max signatures (clients should sign the same base XDR).
      const envelopes = t.approvals.map(a => a.signedXDR);
      // Submit the last one (simplification); Horizon will reject if insufficient signatures.
      try {
        const resp = await server.submitTransaction(envelopes[envelopes.length - 1]);
        t.status = 'submitted';
        t.submittedResult = resp;
      } catch (e) {
        t.status = 'failed';
        t.submittedResult = { error: e.response?.data || e.message };
      }
    }

    res.json(t);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/tx/:id/reject', authMiddleware, (req, res) => {
  const t = db.pendingTx.get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  if (t.status !== 'pending') return res.status(400).json({ error: 'Not pending' });
  t.status = 'rejected';
  res.json(t);
});

app.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`);
});

import { Server, TransactionBuilder, Networks, Operation, Asset, Memo } from 'stellar-sdk';
import axios from 'axios';

const DEFAULT_HORIZON = 'https://horizon-testnet.stellar.org';

export function getServer(horizonUrl = DEFAULT_HORIZON) {
  return new Server(horizonUrl);
}

export async function getBalances(publicKey, horizonUrl = DEFAULT_HORIZON) {
  const server = getServer(horizonUrl);
  const acct = await server.loadAccount(publicKey);
  return acct.balances.map(b => ({
    asset: b.asset_type === 'native' ? 'XLM' : `${b.asset_code}:${b.asset_issuer}`,
    balance: b.balance,
  }));
}

export async function getPayments(publicKey, horizonUrl = DEFAULT_HORIZON, limit = 20) {
  const server = getServer(horizonUrl);
  const records = await server.payments().forAccount(publicKey).order('desc').limit(limit).call();
  return records.records;
}

export async function buildPaymentTx({
  sourcePublicKey,
  destinationPublicKey,
  amount,
  asset = 'XLM',
  memo,
  horizonUrl = DEFAULT_HORIZON,
  networkPassphrase = Networks.TESTNET,
  fee = '100',
}) {
  const server = getServer(horizonUrl);
  const source = await server.loadAccount(sourcePublicKey);

  const assetObj = asset === 'XLM' ? Asset.native() : Asset.fromOperation({ code: asset.split(':')[0], issuer: asset.split(':')[1] });

  const txBuilder = new TransactionBuilder(source, {
    fee,
    networkPassphrase,
  })
    .addOperation(Operation.payment({
      destination: destinationPublicKey,
      amount: String(amount),
      asset: assetObj,
    }));

  if (memo) {
    txBuilder.addMemo(Memo.text(memo.slice(0, 28)));
  }

  const tx = txBuilder.setTimeout(180).build();
  return tx;
}

export function buildSep7UrlForTx(xdr, network = 'test') {
  const params = new URLSearchParams();
  params.set('xdr', xdr);
  params.set('network', network);
  return `web+stellar:tx?${params.toString()}`;
}

export async function getAccountThresholds(publicKey, horizonUrl = DEFAULT_HORIZON) {
  const server = getServer(horizonUrl);
  const acct = await server.loadAccount(publicKey);
  return {
    low: acct.thresholds.low_threshold,
    med: acct.thresholds.med_threshold,
    high: acct.thresholds.high_threshold,
    signers: acct.signers.map(s => ({ key: s.key, weight: s.weight })),
  };
}

export async function addSignerTx({ sourcePublicKey, signerPublicKey, weight = 1, masterWeight, low, med, high, horizonUrl = DEFAULT_HORIZON, networkPassphrase = Networks.TESTNET, fee = '200' }) {
  const server = getServer(horizonUrl);
  const source = await server.loadAccount(sourcePublicKey);

  const tx = new TransactionBuilder(source, { fee, networkPassphrase })
    .addOperation(Operation.setOptions({ signer: { ed25519PublicKey: signerPublicKey, weight } }))
    .addOperation(Operation.setOptions({ masterWeight, lowThreshold: low, medThreshold: med, highThreshold: high }))
    .setTimeout(180)
    .build();
  return tx;
}

export async function verifySep10Auth({ authEndpoint, serverSigningKey, networkPassphrase = Networks.TESTNET, walletPublicKey }) {
  // Stub: in production, implement full SEP-10 challenge/verify on backend.
  // Here we assume backend issues JWT when wallet signs the challenge.
  const res = await axios.post(`${authEndpoint}/sep10/verify`, { walletPublicKey });
  return res.data;
}

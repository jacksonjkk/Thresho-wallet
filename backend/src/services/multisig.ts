import {
  Asset,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from '@stellar/stellar-sdk';

export interface BuildPaymentTxParams {
  sourcePublicKey: string;
  destination: string;
  amount: string;
  memo?: string;
  baseFee?: string;
  timeout?: number;
}

export interface BuildSetOptionsTxParams {
  sourcePublicKey: string;
  signers: Array<{ publicKey: string; weight: number }>;
  thresholds: { low: number; med: number; high: number };
  baseFee?: string;
  timeout?: number;
}

const getServer = () => {
  const horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
  return new Horizon.Server(horizonUrl);
};

const getNetworkPassphrase = () =>
  process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;

export const buildPaymentTx = async ({
  sourcePublicKey,
  destination,
  amount,
  memo,
  baseFee = '100',
  timeout = 60,
}: BuildPaymentTxParams) => {
  const server = getServer();
  const account = await server.loadAccount(sourcePublicKey);

  const builder = new TransactionBuilder(account, {
    fee: baseFee,
    networkPassphrase: getNetworkPassphrase(),
  }).addOperation(
    Operation.payment({
      destination,
      asset: Asset.native(),
      amount,
    })
  );

  if (memo && memo.trim().length > 0) {
    // Stellar memo text is limited to 28 bytes
    const truncatedMemo = memo.trim().substring(0, 28);
    builder.addMemo(Memo.text(truncatedMemo));
  }

  builder.setTimeout(timeout);

  return builder.build();
};

export const buildSetOptionsTx = async ({
  sourcePublicKey,
  signers,
  thresholds,
  baseFee = '100',
  timeout = 60,
}: BuildSetOptionsTxParams) => {
  const server = getServer();
  const account = await server.loadAccount(sourcePublicKey);

  const builder = new TransactionBuilder(account, {
    fee: baseFee,
    networkPassphrase: getNetworkPassphrase(),
  });

  const ownerSigner = signers.find(s => s.publicKey === sourcePublicKey);
  const additionalSigners = signers.filter(s => s.publicKey !== sourcePublicKey);

  // Operation 1: Add each invited signer FIRST
  additionalSigners.forEach((s) => {
    builder.addOperation(
      Operation.setOptions({
        signer: { ed25519PublicKey: s.publicKey, weight: s.weight },
      })
    );
  });

  // Operation 2: Set Master Weight and Thresholds LAST
  builder.addOperation(
    Operation.setOptions({
      masterWeight: ownerSigner ? ownerSigner.weight : 1,
      lowThreshold: thresholds.low,
      medThreshold: thresholds.med,
      highThreshold: thresholds.high,
    })
  );

  builder.setTimeout(timeout);

  return builder.build();
};
#!/usr/bin/env node
/**
 * setupThresholdAccount.js
 *
 * Example script to set up a Stellar account with 3 signers and threshold=2 (medium).
 *
 * Prerequisites:
 * - A funded Stellar testnet account (master keypair)
 * - Three additional Stellar public keys (signers)
 *
 * Run:
 * node scripts/setupThresholdAccount.js
 */

import * as StellarSDK from 'stellar-sdk';

const { Networks, TransactionBuilder, Operation, Keypair } = StellarSDK;
const { Server } = StellarSDK.Horizon;

const server = new Server('https://horizon-testnet.stellar.org');

async function main() {
  const master = Keypair.random();
  console.log('Master (source) G:', master.publicKey());
  console.log('Master S (save safely for demo only):', master.secret());

  // Fund via friendbot
  await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(master.publicKey())}`);
  console.log('Funded master with friendbot');

  const s1 = Keypair.random();
  const s2 = Keypair.random();
  const s3 = Keypair.random();

  console.log('Signer1:', s1.publicKey());
  console.log('Signer2:', s2.publicKey());
  console.log('Signer3:', s3.publicKey());

  const acct = await server.loadAccount(master.publicKey());

  const tx = new TransactionBuilder(acct, { fee: '200', networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.setOptions({ signer: { ed25519PublicKey: s1.publicKey(), weight: 1 } }))
    .addOperation(Operation.setOptions({ signer: { ed25519PublicKey: s2.publicKey(), weight: 1 } }))
    .addOperation(Operation.setOptions({ signer: { ed25519PublicKey: s3.publicKey(), weight: 1 } }))
    .addOperation(Operation.setOptions({ masterWeight: 1, lowThreshold: 1, medThreshold: 2, highThreshold: 3 }))
    .setTimeout(180)
    .build();

  tx.sign(master);
  const resp = await server.submitTransaction(tx);
  console.log('Threshold & signers set:', resp.hash);

  console.log('\nExample threshold wallet: 3 signers, med=2.');
  console.log('Use any 2 of the following to approve:');
  console.log(' -', master.publicKey());
  console.log(' -', s1.publicKey());
  console.log(' -', s2.publicKey());
  console.log(' -', s3.publicKey());
}

main().catch(err => { console.error(err); process.exit(1); });

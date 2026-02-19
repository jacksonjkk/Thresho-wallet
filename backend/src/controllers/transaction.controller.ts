// Move this method inside the TransactionController class below
import { Request, Response } from 'express';
import { z } from 'zod';
import {
  Horizon,
  Keypair,
  Networks,
  TransactionBuilder,
  xdr,
} from '@stellar/stellar-sdk';
import { AppDataSource } from '../config/database';
import { Transaction } from '../models/Transaction';
import { Account } from '../models/Account';
import { User } from '../models/User';
import { validateBody } from '../utils/validation';
import { buildPaymentTx } from '../services/multisig';

export class TransactionController {
  async rejectTransaction(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const id = req.params.id as string;
      const tx = await this.txRepo.findOne({
        where: { id },
        relations: ['account', 'account.signers', 'account.owner', 'creator', 'account.signers.user'],
      });
      if (!tx) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Check if user is a signer or owner
      const isSigner = tx.account.signers.some(s => s.user?.id === userId) || tx.account.owner.id === userId;
      if (!isSigner) {
        return res.status(403).json({ error: 'Only signers can reject transactions' });
      }

      if (tx.status === 'rejected' || tx.status === 'executed') {
        return res.status(400).json({ error: 'Transaction already finalized' });
      }
      tx.status = 'rejected';
      await this.txRepo.save(tx);
      return res.json({ success: true, message: 'Transaction rejected' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to reject transaction' });
    }
  }
  private txRepo = AppDataSource.getRepository(Transaction);
  private accountRepo = AppDataSource.getRepository(Account);
  private userRepo = AppDataSource.getRepository(User);

  private getHorizonServer(): Horizon.Server {
    const url = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    return new Horizon.Server(url);
  }

  private getNetworkPassphrase(): string {
    return process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
  }

  private async getAccountForUser(accountId: string, userId: string) {
    // 1. Check if user has access (either as owner or as one of the signers)
    const hasAccess = await this.accountRepo
      .createQueryBuilder('account')
      .leftJoin('account.signers', 'signer')
      .leftJoin('signer.user', 'signerUser')
      .leftJoin('account.owner', 'owner')
      .where('account.id = :accountId', { accountId })
      .andWhere('(owner.id = :userId OR signerUser.id = :userId)', { userId })
      .getCount();

    if (hasAccess === 0) return null;

    // 2. Fetch the full account with ALL signers and their users
    return this.accountRepo
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.signers', 'signer')
      .leftJoinAndSelect('signer.user', 'signerUser')
      .leftJoinAndSelect('account.owner', 'owner')
      .where('account.id = :accountId', { accountId })
      .getOne();
  }

  async createTransaction(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('--- Creating Transaction ---');
      console.log('User ID:', userId);
      console.log('Body:', req.body);

      const { accountId, to, amount, memo } = validateBody(
        z.object({
          accountId: z.string().min(1),
          to: z.string().min(1),
          amount: z.string().min(1),
          memo: z.string().optional(),
        }),
        req.body
      );

      console.log('Validated Input:', { accountId, to, amount, memo });

      const account = await this.getAccountForUser(accountId, userId);
      if (!account) {
        console.log('Account not found/no access');
        return res.status(404).json({ error: 'Account not found' });
      }

      console.log('Found Account:', account.id);

      const sourcePublicKey = account.owner?.stellarPublicKey;
      console.log('Source PK:', sourcePublicKey);

      if (!sourcePublicKey) {
        console.log('Owner has no PK');
        return res.status(400).json({ error: 'Account owner has no public key' });
      }

      console.log('Building payment TX...');
      try {
        const tx = await buildPaymentTx({
          sourcePublicKey,
          destination: to,
          amount,
          memo: memo?.trim() || undefined,
          timeout: 0,
        });

        console.log('TX built successfully');
        const xdrValue = tx.toXDR();

        const creator = await this.userRepo.findOne({ where: { id: userId } });
        if (!creator) {
          return res.status(404).json({ error: 'User not found' });
        }

        const txEntity = this.txRepo.create({
          account,
          creator,
          to,
          amount,
          memo: memo?.trim() || null,
          asset: 'XLM',
          status: 'pending',
          signatures: [],
          signatureXdrs: [],
          signatureCount: 0,
          xdr: xdrValue,
        });

        const saved = await this.txRepo.save(txEntity);

        return res.status(201).json({
          transactionId: saved.id,
          xdr: xdrValue,
          networkPassphrase: this.getNetworkPassphrase(),
        });
      } catch (stellarErr: any) {
        console.error('Stellar building error:', stellarErr);
        if (stellarErr.response?.data?.status === 404 || stellarErr.response?.status === 404) {
          return res.status(400).json({ error: 'Source account not found on Stellar network. Please fund it first.' });
        }
        return res.status(400).json({ error: stellarErr.message || 'Failed to build transaction' });
      }
    } catch (err: any) {
      console.error('Create transaction error:', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }

  async getTransaction(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const id = req.params.id as string;
      const tx = await this.txRepo.findOne({
        where: { id },
        relations: ['account', 'account.signers', 'account.owner', 'creator', 'account.signers.user'],
      });

      if (!tx) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const isMember =
        tx.account.owner?.id === userId ||
        tx.account.signers.some((s) => s.user?.id === userId);

      if (!isMember) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      return res.json(tx);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch transaction' });
    }
  }

  async signTransaction(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const id = req.params.id as string;
      const { signedXdr, signerPublicKey } = validateBody(
        z.object({
          signedXdr: z.string().min(1),
          signerPublicKey: z.string().min(1),
        }),
        req.body
      );

      const tx = await this.txRepo.findOne({
        where: { id },
        relations: ['account', 'account.signers', 'account.owner', 'account.signers.user'],
      });

      if (!tx || !tx.xdr) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const signer = tx.account.signers.find((s) => s.publicKey === signerPublicKey);
      if (!signer) {
        return res.status(403).json({ error: 'Signer not authorized' });
      }

      // Ensure the authenticated user is actually this signer
      if (signer.user?.id !== userId && tx.account.owner.id !== userId) {
        return res.status(403).json({ error: 'You are not authorized to sign as this public key' });
      }

      const originalTx = TransactionBuilder.fromXDR(tx.xdr, this.getNetworkPassphrase());
      const signedTx = TransactionBuilder.fromXDR(signedXdr, this.getNetworkPassphrase());

      if (originalTx.hash().toString('hex') !== signedTx.hash().toString('hex')) {
        return res.status(400).json({ error: 'Signed transaction does not match original' });
      }

      const keypair = Keypair.fromPublicKey(signerPublicKey);
      const hash = signedTx.hash();

      const hasValidSig = signedTx.signatures.some((sig) =>
        keypair.verify(hash, sig.signature())
      );

      if (!hasValidSig) {
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const approvals = tx.signatures || [];
      if (approvals.includes(signerPublicKey)) {
        return res.status(400).json({ error: 'Signer already approved' });
      }

      const signatureXdrs = tx.signatureXdrs || [];
      const sigXdr = signedTx.signatures.find((sig) =>
        keypair.verify(hash, sig.signature())
      );

      if (!sigXdr) {
        return res.status(400).json({ error: 'Signature not found' });
      }

      approvals.push(signerPublicKey);
      signatureXdrs.push(sigXdr.toXDR('base64'));

      tx.signatures = approvals;
      tx.signatureXdrs = signatureXdrs;
      tx.signatureCount = approvals.length;

      if (tx.signatureCount >= tx.account.threshold) {
        tx.status = 'approved';
      }

      await this.txRepo.save(tx);

      return res.json({ success: true, signatureCount: tx.signatureCount });
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to sign transaction' });
    }
  }

  async executeTransaction(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const id = req.params.id as string;
      const tx = await this.txRepo.findOne({
        where: { id },
        relations: ['account', 'account.signers', 'account.owner', 'account.signers.user'],
      });

      if (!tx || !tx.xdr) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Check if user has access to this account
      const isMember =
        tx.account.owner.id === userId ||
        tx.account.signers.some(s => s.user?.id === userId);

      if (!isMember) {
        return res.status(403).json({ error: 'Forbidden: You are not a member of this account' });
      }

      if (tx.status !== 'approved' && tx.status !== 'pending') {
        return res.status(400).json({ error: 'Transaction not executable' });
      }

      // If it's a regular payment, we need full approvals.
      // If it's a 'set_options' (sync/deploy), we allow the owner to broadcast it immediately 
      // because we only need the master key's signature for the initial setup.
      if (tx.type !== 'set_options' && tx.signatureCount < tx.account.threshold) {
        return res.status(400).json({ error: 'Not enough approvals' });
      }

      const server = this.getHorizonServer();

      const ownerKey = tx.account.owner.stellarPublicKey;
      if (!ownerKey) {
        return res.status(400).json({ error: 'Account owner has no public key' });
      }

      // Fetch the current on-chain state to avoid "tx_bad_auth_extra"
      // We only want to send signatures that the network currently recognizes.
      const onChainAccount = await server.loadAccount(ownerKey);
      const onChainSignerKeys = new Set(onChainAccount.signers.map(s => s.key));

      const baseTx = TransactionBuilder.fromXDR(tx.xdr, this.getNetworkPassphrase()) as any;

      const signatureXdrs = tx.signatureXdrs || [];
      signatureXdrs.forEach((sig: string) => {
        const decorated = xdr.DecoratedSignature.fromXDR(sig, 'base64');

        // Match signature hint with current on-chain signers
        const isValidOnChain = onChainAccount.signers.some(s => {
          const keypair = Keypair.fromPublicKey(s.key);
          return keypair.signatureHint().equals(decorated.hint());
        });

        if (isValidOnChain) {
          const isDuplicate = baseTx.signatures.some((s: any) =>
            s.signature().toString('hex') === decorated.signature().toString('hex')
          );
          if (!isDuplicate) {
            baseTx.signatures.push(decorated);
          }
        }
      });

      const result = await server.submitTransaction(baseTx as any);

      tx.status = 'executed';
      tx.executedAt = new Date();
      await this.txRepo.save(tx);

      return res.json({ success: true, txHash: result.hash });
    } catch (err: any) {
      console.error('Execute transaction error:', err);

      // Handle Stellar-specific errors
      if (err.response?.data?.extras?.result_codes) {
        const codes = err.response.data.extras.result_codes;
        const detail = codes.operations ? `${codes.transaction}: ${codes.operations.join(', ')}` : codes.transaction;
        return res.status(400).json({
          error: `Stellar Network Error: ${detail}`,
          details: codes
        });
      }

      if (err instanceof Error && err.message) {
        return res.status(500).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to execute transaction' });
    }
  }

  async listTransactions(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const accountId = String(req.query.accountId || '');
      const status = req.query.status ? String(req.query.status) : undefined;

      if (!accountId) {
        return res.status(400).json({ error: 'accountId is required' });
      }

      const account = await this.getAccountForUser(accountId, userId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const where: any = { account: { id: accountId } };
      if (status) {
        where.status = status;
      }

      const transactions = await this.txRepo.find({
        where,
        relations: ['creator'],
        order: { createdAt: 'DESC' },
      });

      return res.json(transactions);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to list transactions' });
    }
  }

  async deleteTransaction(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const id = req.params.id as string;
      const tx = await this.txRepo.findOne({
        where: { id },
        relations: ['creator'],
      });

      if (!tx) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      if (tx.creator.id !== userId) {
        return res.status(403).json({ error: 'Only the creator can delete this transaction' });
      }

      await this.txRepo.remove(tx);
      return res.json({ success: true, message: 'Transaction deleted' });
    } catch (err) {
      console.error('Delete transaction error:', err);
      return res.status(500).json({ error: 'Failed to delete transaction' });
    }
  }

  async getOnChainHistory(req: Request, res: Response) {
    try {
      const publicKey = req.query.publicKey as string;
      if (!publicKey) return res.status(400).json({ error: 'publicKey is required' });

      const server = this.getHorizonServer();
      const payments = await server.payments().forAccount(publicKey).order('desc').limit(20).call();
      return res.json(payments.records);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed' });
    }
  }
}
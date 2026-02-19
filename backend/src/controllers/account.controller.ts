import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Account } from '../models/Account';
import { Signer } from '../models/Signer';
import { User } from '../models/User';
import { z } from 'zod';
import { validateBody } from '../utils/validation';
import { Horizon, Networks } from '@stellar/stellar-sdk';
import { buildSetOptionsTx } from '../services/multisig';
import { Transaction } from '../models/Transaction';

export class AccountController {
  private accountRepo = AppDataSource.getRepository(Account);
  private signerRepo = AppDataSource.getRepository(Signer);
  private userRepo = AppDataSource.getRepository(User);
  private txRepo = AppDataSource.getRepository(Transaction);

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

  async createAccount(req: Request, res: Response) {
    try {
      const { name, threshold, signers } = validateBody(
        z.object({
          name: z.string().min(1),
          threshold: z.number().int().min(1),
          signers: z
            .array(
              z.object({
                name: z.string().min(1),
                publicKey: z.string().min(1),
                weight: z.number().int().min(1),
                role: z.string().optional(),
              })
            )
            .min(1),
        }),
        req.body
      );
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const owner = await this.userRepo.findOne({ where: { id: userId } });
      if (!owner) {
        return res.status(404).json({ error: 'User not found' });
      }

      const account = this.accountRepo.create({
        name,
        threshold,
        totalWeight: signers.reduce((sum, s) => sum + (s.weight || 0), 0),
        owner,
      });

      await this.accountRepo.save(account);

      // Add signers
      for (const signer of signers) {
        // Only link the user if the public key matches the owner's stellarPublicKey
        const isOwnerSigner = owner.stellarPublicKey === signer.publicKey;

        const signerEntity = this.signerRepo.create({
          account,
          name: signer.name,
          publicKey: signer.publicKey,
          weight: signer.weight,
          role: signer.role || 'signer',
          user: isOwnerSigner ? owner : undefined,
        });
        await this.signerRepo.save(signerEntity);
      }

      console.log(`✅ Account created: ${account.id} (${name})`);
      return res.status(201).json({ accountId: account.id });
    } catch (err) {
      console.error('Account creation error:', err);
      if (err instanceof Error && err.message) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to create account' });
    }
  }

  async getAccount(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const account = await this.getAccountForUser(id, userId);

      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      return res.json(account);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch account' });
    }
  }

  async updateRules(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { threshold } = validateBody(
        z.object({ threshold: z.number().int().min(1) }),
        req.body
      );
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (threshold === undefined) {
        return res.status(400).json({ error: 'Threshold required' });
      }

      const account = await this.accountRepo.findOne({ where: { id } });
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      if (account.owner.id !== userId) {
        return res.status(403).json({ error: 'Only the account owner can update rules' });
      }

      await this.accountRepo.update({ id }, { threshold });
      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to update rules' });
    }
  }

  async getMembers(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const account = await this.getAccountForUser(id, userId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const signers = await this.signerRepo.find({
        where: { account: { id } },
        relations: ['user'],
      });

      if (signers.length === 0) {
        return res.status(404).json({ error: 'No members found' });
      }

      return res.json(signers);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch members' });
    }
  }

  async getAccountWalletInfo(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const account = await this.getAccountForUser(id, userId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const ownerKey = account.owner?.stellarPublicKey;
      if (!ownerKey) {
        return res.status(404).json({ error: 'Account owner wallet not found' });
      }

      const server = this.getHorizonServer();
      const horizonAccount = await server.loadAccount(ownerKey);

      return res.json({
        publicKey: ownerKey,
        balances: horizonAccount.balances,
        networkPassphrase: this.getNetworkPassphrase(),
      });
    } catch (err) {
      console.error('Failed to fetch account wallet info:', err);
      return res.status(500).json({ error: 'Failed to fetch account wallet info' });
    }
  }

  async addSigner(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = req.userId;
      const { name, publicKey, weight } = validateBody(
        z.object({
          name: z.string().min(1),
          publicKey: z.string().min(1),
          weight: z.number().int().min(1),
        }),
        req.body
      );

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const account = await this.accountRepo.findOne({ where: { id }, relations: ['owner'] });
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      if (account.owner.id !== userId) {
        return res.status(403).json({ error: 'Only the account owner can add signers' });
      }

      // Find the user associated with this public key, if any
      const signerUser = await this.userRepo.findOne({ where: { stellarPublicKey: publicKey } });

      const signerEntity = this.signerRepo.create({
        account,
        name,
        publicKey,
        weight,
        role: 'signer',
        user: signerUser || undefined,
      });

      await this.signerRepo.save(signerEntity);

      await this.accountRepo.update({ id }, { totalWeight: account.totalWeight + weight });

      return res.status(201).json(signerEntity);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to add signer' });
    }
  }

  async removeSigner(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const signerId = req.params.signerId as string;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const account = await this.accountRepo.findOne({ where: { id }, relations: ['owner'] });
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      if (account.owner.id !== userId) {
        return res.status(403).json({ error: 'Only the account owner can remove signers' });
      }

      const signer = await this.signerRepo.findOne({ where: { id: signerId, account: { id } } });
      if (!signer) {
        return res.status(404).json({ error: 'Signer not found' });
      }

      await this.signerRepo.delete({ id: signerId });
      await this.accountRepo.update({ id }, { totalWeight: Math.max(0, account.totalWeight - signer.weight) });

      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to remove signer' });
    }
  }

  async getUserAccounts(req: Request, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const accountIdsQuery = await this.accountRepo
        .createQueryBuilder('account')
        .select('account.id')
        .leftJoin('account.signers', 'signer')
        .leftJoin('signer.user', 'signerUser')
        .leftJoin('account.owner', 'owner')
        .where('owner.id = :userId', { userId })
        .orWhere('signerUser.id = :userId', { userId })
        .getMany();

      if (accountIdsQuery.length === 0) {
        return res.json([]);
      }

      const accountIds = accountIdsQuery.map(a => a.id);

      const accounts = await this.accountRepo
        .createQueryBuilder('account')
        .leftJoinAndSelect('account.signers', 'signer')
        .leftJoinAndSelect('signer.user', 'signerUser')
        .leftJoinAndSelect('account.owner', 'owner')
        .where('account.id IN (:...accountIds)', { accountIds })
        .getMany();

      return res.json(accounts);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  }

  async syncMultisigConfig(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const account = await this.getAccountForUser(id, userId);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      if (account.owner.id !== userId) {
        return res.status(403).json({ error: 'Only the account owner can initiate sync' });
      }

      const sourcePublicKey = account.owner.stellarPublicKey;
      if (!sourcePublicKey) {
        return res.status(400).json({ error: 'Account owner has no public key' });
      }

      // Build the setOptions transaction
      const signersToSet = account.signers.map(s => ({
        publicKey: s.publicKey,
        weight: s.weight
      }));

      const tx = await buildSetOptionsTx({
        sourcePublicKey,
        signers: signersToSet,
        thresholds: {
          low: account.threshold,
          med: account.threshold,
          high: account.threshold
        },
        timeout: 0
      });

      const xdrValue = tx.toXDR();

      // Create a transaction record
      const txEntity = this.txRepo.create({
        account,
        creator: account.owner,
        to: sourcePublicKey,
        amount: '0',
        asset: 'XLM',
        type: 'set_options',
        status: 'pending',
        signatures: [],
        signatureXdrs: [],
        signatureCount: 0,
        xdr: xdrValue,
        memo: 'Sync Multisig Configuration'
      });

      await this.txRepo.save(txEntity);

      return res.status(201).json({
        transactionId: txEntity.id,
        xdr: xdrValue,
        networkPassphrase: this.getNetworkPassphrase()
      });
    } catch (err: any) {
      console.error('Sync multisig error:', err);
      return res.status(500).json({ error: err.message || 'Failed to sync multisig' });
    }
  }
}

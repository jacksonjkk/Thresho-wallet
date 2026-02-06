import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Account } from '../models/Account';
import { Signer } from '../models/Signer';
import { User } from '../models/User';

export class AccountController {
  private accountRepo = AppDataSource.getRepository(Account);
  private signerRepo = AppDataSource.getRepository(Signer);
  private userRepo = AppDataSource.getRepository(User);

  async createAccount(req: Request, res: Response) {
    try {
      const { name, threshold, signers } = req.body;
      const userId = (req as any).userId;

      if (!name || threshold === undefined || !signers || !Array.isArray(signers)) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const owner = await this.userRepo.findOne({ where: { id: userId } });
      if (!owner) {
        return res.status(404).json({ error: 'User not found' });
      }

      const account = this.accountRepo.create({
        name,
        threshold,
        totalWeight: signers.reduce((sum: number, s: any) => sum + (s.weight || 0), 0),
        owner,
      });

      await this.accountRepo.save(account);

      // Add signers
      for (const signer of signers) {
        const signerEntity = this.signerRepo.create({
          account,
          name: signer.name,
          publicKey: signer.publicKey,
          weight: signer.weight,
          role: signer.role || 'signer',
          user: owner,
        });
        await this.signerRepo.save(signerEntity);
      }

      console.log(`✅ Account created: ${account.id} (${name})`);
      return res.status(201).json({ accountId: account.id });
    } catch (err) {
      console.error('Account creation error:', err);
      return res.status(500).json({ error: 'Failed to create account' });
    }
  }

  async getAccount(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const account = await this.accountRepo.findOne({
        where: { id },
        relations: ['signers', 'signers.user', 'owner'],
      });

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
      const { threshold } = req.body;

      if (threshold === undefined) {
        return res.status(400).json({ error: 'Threshold required' });
      }

      const account = await this.accountRepo.findOne({ where: { id } });
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      await this.accountRepo.update({ id }, { threshold });
      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to update rules' });
    }
  }

  async getMembers(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
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

  async addSigner(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = (req as any).userId;
      const { name, publicKey, weight } = req.body;

      if (!name || !publicKey || weight === undefined) {
        return res.status(400).json({ error: 'name, publicKey and weight are required' });
      }

      const account = await this.accountRepo.findOne({ where: { id }, relations: ['owner'] });
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      if (account.owner.id !== userId) {
        return res.status(403).json({ error: 'Only the account owner can add signers' });
      }

      const owner = await this.userRepo.findOne({ where: { id: userId } });
      if (!owner) {
        return res.status(404).json({ error: 'User not found' });
      }

      const signerEntity = this.signerRepo.create({
        account,
        name,
        publicKey,
        weight,
        role: 'signer',
        user: owner,
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
      const userId = (req as any).userId;

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
      return res.status(500).json({ error: 'Failed to remove signer' });
    }
  }

  async getUserAccounts(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const accounts = await this.accountRepo
        .createQueryBuilder('account')
        .leftJoinAndSelect('account.signers', 'signer')
        .leftJoinAndSelect('signer.user', 'signerUser')
        .leftJoinAndSelect('account.owner', 'owner')
        .where('owner.id = :userId', { userId })
        .orWhere('signerUser.id = :userId', { userId })
        .getMany();

      return res.json(accounts);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  }
}

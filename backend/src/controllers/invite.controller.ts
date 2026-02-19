import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { AppDataSource } from '../config/database';
import { IsNull } from 'typeorm';
import { Invite } from '../models/Invite';
import { Account } from '../models/Account';
import { User } from '../models/User';
import { Signer } from '../models/Signer';
import { z } from 'zod';
import { validateBody } from '../utils/validation';

export class InviteController {
  private inviteRepo = AppDataSource.getRepository(Invite);
  private accountRepo = AppDataSource.getRepository(Account);
  private userRepo = AppDataSource.getRepository(User);
  private signerRepo = AppDataSource.getRepository(Signer);

  async createInvite(req: Request, res: Response) {
    try {
      const { accountId } = validateBody(
        z.object({ accountId: z.string().min(1) }),
        req.body
      );
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!accountId) {
        return res.status(400).json({ error: 'accountId is required' });
      }

      const account = await this.accountRepo.findOne({
        where: { id: accountId },
        relations: ['owner'],
      });

      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }

      if (account.owner.id !== userId) {
        return res.status(403).json({ error: 'Only the account owner can create invites' });
      }

      const code = randomBytes(8).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const invite = this.inviteRepo.create({
        code,
        account,
        expiresAt,
      });

      await this.inviteRepo.save(invite);

      const baseUrl = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';
      const inviteLink = `${baseUrl}/?invite=${code}`;

      return res.status(201).json({ code, inviteLink, expiresAt });
    } catch (err) {
      console.error('Invite creation error:', err);
      if (err instanceof Error && err.message) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to create invite' });
    }
  }

  async getInvite(req: Request, res: Response) {
    try {
      const code = String(req.params.code);
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const invite = await this.inviteRepo.findOne({
        where: { code },
        relations: ['account', 'account.owner'],
      });

      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      if (invite.account.owner.id !== userId) {
        return res.status(403).json({ error: 'Only the account owner can view invite details' });
      }

      return res.json({
        id: invite.id,
        code: invite.code,
        accountId: invite.account.id,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
        usedBy: invite.usedBy,
      });
    } catch (err) {
      console.error('Get invite error:', err);
      if (err instanceof Error && err.message) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to fetch invite' });
    }
  }

  async joinWithInvite(req: Request, res: Response) {
    try {
      const code = String(req.params.code);
      const { publicKey, name } = validateBody(
        z.object({
          publicKey: z.string().min(1),
          name: z.string().optional(),
        }),
        req.body
      );
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const invite = await this.inviteRepo.findOne({
        where: { code },
        relations: ['account'],
      });

      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      if (invite.usedBy) {
        return res.status(400).json({ error: 'Invite already used' });
      }

      if (invite.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Invite has expired' });
      }

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const existingSigner = await this.signerRepo.findOne({
        where: { account: { id: invite.account.id }, user: { id: userId } },
      });

      if (existingSigner) {
        return res.status(400).json({ error: 'User is already a signer on this account' });
      }

      const unassignedSigner = await this.signerRepo.findOne({
        where: {
          account: { id: invite.account.id },
          publicKey: publicKey,
          user: IsNull()
        },
      });

      if (unassignedSigner) {
        // Claim the existing signer entry
        unassignedSigner.user = user;
        if (name) unassignedSigner.name = name;
        await this.signerRepo.save(unassignedSigner);
      } else {
        // Create a new signer entry if no unassigned one matches
        const signerEntity = this.signerRepo.create({
          account: invite.account,
          name: name || `${user.firstName} ${user.lastName}`,
          publicKey,
          weight: 1,
          role: 'signer',
          user,
        });
        await this.signerRepo.save(signerEntity);
      }

      invite.usedBy = userId;
      await this.inviteRepo.save(invite);

      return res.json({ accountId: invite.account.id, message: 'Joined account successfully' });
    } catch (err) {
      console.error('Join invite error:', err);
      if (err instanceof Error && err.message) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to join account' });
    }
  }

  async revokeInvite(req: Request, res: Response) {
    try {
      const code = String(req.params.code);
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const invite = await this.inviteRepo.findOne({
        where: { code },
        relations: ['account', 'account.owner'],
      });

      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      if (invite.account.owner.id !== userId) {
        return res.status(403).json({ error: 'Only the account owner can revoke invites' });
      }

      await this.inviteRepo.delete({ id: invite.id });
      return res.json({ success: true });
    } catch (err) {
      console.error('Revoke invite error:', err);
      if (err instanceof Error && err.message) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Failed to revoke invite' });
    }
  }
}

import { Request, Response } from 'express';
import { createCipheriv, randomBytes } from 'crypto';
import {
  Account,
  FeeBumpTransaction,
  Keypair,
  Networks,
  Operation,
  Horizon,
  StrKey,
  Transaction,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { validateBody } from '../utils/validation';

export class AuthController {
  async deleteAccount(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      await this.userRepo.remove(user);
      res.clearCookie('authToken', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      return res.json({ message: 'Account deleted successfully' });
    } catch (err) {
      console.error('Failed to delete account:', err);
      return res.status(500).json({ error: 'Failed to delete account' });
    }
  }
  private userRepo = AppDataSource.getRepository(User);
  private static challenges = new Map<string, { nonce: string; expiresAt: number }>();
  private static serverKeypair: Keypair | null = null;

  private static normalizePublicKey(publicKey: string): string {
    if (StrKey.isValidEd25519PublicKey(publicKey)) {
      return publicKey;
    }

    if (StrKey.isValidMed25519PublicKey(publicKey)) {
      const decoded: unknown = StrKey.decodeMed25519PublicKey(publicKey);
      const raw = Buffer.isBuffer(decoded)
        ? decoded
        : typeof decoded === 'object' && decoded !== null && 'publicKey' in decoded
          ? (decoded as { publicKey: Buffer }).publicKey
          : null;
      if (!raw) {
        throw new Error('Invalid public key');
      }
      return StrKey.encodeEd25519PublicKey(raw);
    }

    throw new Error('Invalid public key');
  }

  private static getServerKeypair(): Keypair {
    if (AuthController.serverKeypair) {
      return AuthController.serverKeypair;
    }

    const secret = process.env.STELLAR_CHALLENGE_SECRET;
    if (secret && StrKey.isValidEd25519SecretSeed(secret)) {
      AuthController.serverKeypair = Keypair.fromSecret(secret);
      return AuthController.serverKeypair;
    }

    const generated = Keypair.random();
    console.warn(
      '⚠️  STELLAR_CHALLENGE_SECRET not set. Generated ephemeral keypair:',
      generated.publicKey()
    );
    AuthController.serverKeypair = generated;
    return AuthController.serverKeypair;
  }

  private static getNetworkPassphrase(): string {
    return process.env.STELLAR_NETWORK_PASSPHRASE || Networks.TESTNET;
  }

  private static getHorizonServer(): Horizon.Server {
    const url = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    return new Horizon.Server(url);
  }

  private static encryptSecret(secret: string): { encrypted: string; iv: string } {
    const key = process.env.STELLAR_MASTER_KEY;
    if (!key || key.length < 32) {
      throw new Error('STELLAR_MASTER_KEY must be set and at least 32 chars');
    }

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', Buffer.from(key.slice(0, 32)), iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      encrypted: Buffer.concat([encrypted, tag]).toString('base64'),
      iv: iv.toString('base64'),
    };
  }

  async checkEmailExists(req: Request, res: Response) {
    try {
      const { email } = validateBody(
        z.object({ email: z.string().email() }),
        req.body
      );

      const existingUser = await this.userRepo.findOne({ where: { email } });
      if (existingUser) {
        console.log('Email already registered:', email);
      }

      return res.status(200).json({
        exists: false,
        message: 'If the email is registered, you can log in or reset your password.',
      });
    } catch (err) {
      if (err instanceof Error && err.message) {
        return res.status(400).json({ error: err.message });
      }
      console.error('❌ Email check error:', err);
      return res.status(500).json({ error: 'Email check failed' });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { firstName, lastName, email, password } = validateBody(
        z.object({
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          email: z.string().email(),
          password: z.string().min(8),
        }),
        req.body
      );

      console.log('Register attempt:', email);

      const existingUser = await this.userRepo.findOne({ where: { email } });
      if (existingUser) {
        console.log('User already exists:', email);
        return res.status(400).json({ error: 'Email already exists' });
      }

      console.log('Hashing password...');
      const passwordHash = await bcrypt.hash(password, 10);

      console.log('Generating Stellar keypair...');
      const keypair = Keypair.random();
      const { encrypted, iv } = AuthController.encryptSecret(keypair.secret());
      const shouldFund = AuthController.getNetworkPassphrase() === Networks.TESTNET && process.env.STELLAR_AUTO_FUND !== 'false';

      if (shouldFund) {
        try {
          await fetch(`https://friendbot.stellar.org/?addr=${keypair.publicKey()}`);
        } catch (err) {
          console.warn('Friendbot funding failed:', err);
        }
      }

      console.log('Creating user object...');
      const user = this.userRepo.create({
        firstName,
        lastName,
        email,
        passwordHash,
        hasCompletedOnboarding: false,
        stellarPublicKey: keypair.publicKey(),
        stellarSecretEncrypted: encrypted,
        stellarSecretIv: iv
      });

      console.log('Saving user to database...');
      const savedUser = await this.userRepo.save(user);

      console.log('✅ User registered:', savedUser.id, savedUser.email, `(${savedUser.firstName} ${savedUser.lastName})`);

      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: savedUser.id,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          email: savedUser.email,
          hasCompletedOnboarding: savedUser.hasCompletedOnboarding,
          publicKey: savedUser.stellarPublicKey
        }
      });
    } catch (err) {
      console.error('❌ Registration error:', err);
      if (err instanceof Error && err.message) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = validateBody(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        }),
        req.body
      );

      const user = await this.userRepo.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.error('CRITICAL: JWT_SECRET is not defined');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });
      res.cookie('authToken', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.json({
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
          publicKey: user.stellarPublicKey
        }
      });
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(500).json({ error: 'Login failed' });
    }
  }

  async getChallenge(req: Request, res: Response) {
    try {
      const { publicKey } = req.body;

      if (!publicKey) {
        return res.status(400).json({ error: 'Invalid public key' });
      }

      let normalizedPublicKey: string;
      try {
        normalizedPublicKey = AuthController.normalizePublicKey(publicKey);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid public key' });
      }

      const serverKeypair = AuthController.getServerKeypair();
      const nonce = randomBytes(32).toString('base64');
      const expiresAt = Date.now() + 5 * 60 * 1000;

      AuthController.challenges.set(normalizedPublicKey, { nonce, expiresAt });

      const account = new Account(serverKeypair.publicKey(), '0');
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: AuthController.getNetworkPassphrase(),
      })
        .addOperation(
          Operation.manageData({
            name: `${normalizedPublicKey} auth`,
            value: Buffer.from(nonce, 'base64'),
          })
        )
        .setTimeout(300)
        .build();

      tx.sign(serverKeypair);

      return res.json({
        challengeXdr: tx.toXDR(),
        networkPassphrase: AuthController.getNetworkPassphrase(),
        serverPublicKey: serverKeypair.publicKey(),
        publicKey: normalizedPublicKey,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to create challenge' });
    }
  }

  async verifyChallenge(req: Request, res: Response) {
    try {
      let { signedXdr, publicKey } = req.body;

      if (!signedXdr || !publicKey) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      if (typeof signedXdr !== 'string') {
        const extracted = signedXdr?.signedTxXdr || signedXdr?.signedXdr || signedXdr?.xdr;
        if (typeof extracted === 'string') {
          signedXdr = extracted;
        } else {
          return res.status(400).json({ error: 'Invalid signed transaction format' });
        }
      }

      let normalizedPublicKey: string;
      try {
        normalizedPublicKey = AuthController.normalizePublicKey(publicKey);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid public key' });
      }

      const challenge = AuthController.challenges.get(normalizedPublicKey);
      if (!challenge || challenge.expiresAt < Date.now()) {
        return res.status(400).json({ error: 'Challenge expired or not found' });
      }

      const serverKeypair = AuthController.getServerKeypair();
      const parsedTx = TransactionBuilder.fromXDR(
        signedXdr,
        AuthController.getNetworkPassphrase()
      );

      if (parsedTx instanceof FeeBumpTransaction) {
        return res.status(400).json({ error: 'Fee bump transactions are not supported' });
      }

      const tx = parsedTx as Transaction;

      if (tx.source !== serverKeypair.publicKey()) {
        return res.status(400).json({ error: 'Invalid challenge source' });
      }

      const operation = tx.operations[0];
      if (operation.type !== 'manageData') {
        return res.status(400).json({ error: 'Invalid challenge operation' });
      }

      const expectedName = `${normalizedPublicKey} auth`;
      if (operation.name !== expectedName) {
        return res.status(400).json({ error: 'Invalid challenge payload' });
      }

      const expectedValue = Buffer.from(challenge.nonce, 'base64');
      const operationValue =
        typeof operation.value === 'string'
          ? Buffer.from(operation.value)
          : (operation.value as Buffer | null);

      if (!operationValue || Buffer.compare(operationValue, expectedValue) !== 0) {
        return res.status(400).json({ error: 'Invalid challenge value' });
      }

      const clientKeypair = Keypair.fromPublicKey(normalizedPublicKey);
      const hash = tx.hash();

      const getSignatureBytes = (sig: { signature: Buffer | (() => Buffer) }): Buffer =>
        typeof sig.signature === 'function' ? sig.signature() : sig.signature;

      const hasClientSignature = tx.signatures.some((sig) =>
        clientKeypair.verify(hash, getSignatureBytes(sig))
      );

      const hasServerSignature = tx.signatures.some((sig) =>
        serverKeypair.verify(hash, getSignatureBytes(sig))
      );

      if (!hasClientSignature || !hasServerSignature) {
        return res.status(400).json({ error: 'Missing required signatures' });
      }

      AuthController.challenges.delete(normalizedPublicKey);
      return res.json({ verified: true, message: 'Wallet verified' });
    } catch (err) {
      console.error('Challenge verification failed:', err);
      return res.status(500).json({ error: 'Challenge verification failed' });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        biometricEnabled: user.biometricEnabled,
        createdAt: user.createdAt,
        avatarUrl: user.avatarUrl,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        stellarPublicKey: user.stellarPublicKey,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const { firstName, lastName, avatarUrl } = req.body;

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (typeof firstName === 'string') {
        user.firstName = firstName.trim();
      }
      if (typeof lastName === 'string') {
        user.lastName = lastName.trim();
      }
      if (typeof avatarUrl === 'string' || avatarUrl === null) {
        user.avatarUrl = avatarUrl;
      }
      if (typeof req.body.stellarPublicKey === 'string') {
        user.stellarPublicKey = req.body.stellarPublicKey.trim().toUpperCase();
      }

      const saved = await this.userRepo.save(user);
      return res.json({
        id: saved.id,
        firstName: saved.firstName,
        lastName: saved.lastName,
        email: saved.email,
        biometricEnabled: saved.biometricEnabled,
        createdAt: saved.createdAt,
        avatarUrl: saved.avatarUrl,
        hasCompletedOnboarding: saved.hasCompletedOnboarding,
        stellarPublicKey: saved.stellarPublicKey,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  async completeOnboarding(req: Request, res: Response) {
    try {
      const userId = req.userId;

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.hasCompletedOnboarding = true;
      await this.userRepo.save(user);

      return res.json({ message: 'Onboarding completed successfully' });
    } catch (err) {
      console.error('Complete onboarding error:', err);
      return res.status(500).json({ error: 'Failed to complete onboarding' });
    }
  }

  async logout(req: Request, res: Response) {
    res.clearCookie('authToken', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    return res.json({ message: 'Logged out' });
  }

  async getWalletInfo(req: Request, res: Response) {
    try {
      const userId = req.userId;
      const user = await this.userRepo.findOne({ where: { id: userId } });

      if (!user || !user.stellarPublicKey) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      const server = AuthController.getHorizonServer();
      const account = await server.loadAccount(user.stellarPublicKey);

      return res.json({
        publicKey: user.stellarPublicKey,
        balances: account.balances,
      });
    } catch (err) {
      console.error('Failed to fetch wallet info:', err);
      return res.status(500).json({ error: 'Failed to fetch wallet info' });
    }
  }
}

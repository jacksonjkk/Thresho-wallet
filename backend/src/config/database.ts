import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Account } from '../models/Account';
import { Signer } from '../models/Signer';
import { Transaction } from '../models/Transaction';
import { Invite } from '../models/Invite';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Account, Signer, Transaction, Invite],
  migrations: ['src/migrations/*.ts'],
  subscribers: [],
});

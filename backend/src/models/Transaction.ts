import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Account } from './Account';
import { User } from './User';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Account, (account) => account.transactions, { onDelete: 'CASCADE' })
  account!: Account;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  creator!: User;

  @Column({ default: 'payment' })
  type!: 'payment' | 'set_options';

  @Column({ type: 'int', nullable: true })
  weight?: number;

  @Column('text', { nullable: true })
  payload?: string; // JSON payload for non-payment txs

  @Column()
  to!: string; // For set_options, this might be the account itself or unused

  @Column('numeric', { default: '0' })
  amount!: string;

  @Column({ default: 'XLM' })
  asset!: string;

  @Column('text', { nullable: true })
  memo: string | null = null;

  @Column({ default: 'pending' })
  status!: string; // 'pending', 'approved', 'rejected', 'executed'

  @Column('simple-array', { nullable: true })
  signatures?: string[] | null;

  @Column('simple-array', { nullable: true })
  signatureXdrs?: string[] | null;

  @Column('text', { nullable: true })
  xdr: string | null = null;

  @Column({ type: 'int', default: 0 })
  signatureCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  executedAt?: Date | null;
}

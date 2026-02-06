import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Account } from './Account';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Account, (account) => account.transactions)
  account: Account;

  @Column()
  to: string;

  @Column('numeric')
  amount: string;

  @Column({ default: 'pending' })
  status: string; // 'pending', 'approved', 'rejected', 'executed'

  @Column('simple-array', { nullable: true })
  signatures: string[];

  @Column({ type: 'int', default: 0 })
  signatureCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  executedAt: Date;
}

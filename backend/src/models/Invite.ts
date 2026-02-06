import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Account } from './Account';

@Entity('invites')
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @ManyToOne(() => Account)
  account: Account;

  @Column({ default: 'signer' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  usedBy: string;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './User';
import { Account } from './Account';

@Entity('signers')
export class Signer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Account, (account) => account.signers, { onDelete: 'CASCADE' })
  account!: Account;

  @ManyToOne(() => User, (user) => user.signerAccounts, { onDelete: 'CASCADE', nullable: true })
  user?: User;

  @Column()
  name!: string;

  @Column()
  publicKey!: string;

  @Column({ type: 'int' })
  weight!: number;

  @Column()
  role!: string; // 'owner', 'signer', 'viewer'
}

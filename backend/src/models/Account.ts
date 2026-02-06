import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './User';
import { Signer } from './Signer';
import { Transaction } from './Transaction';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => User, (user) => user.ownedAccounts)
  owner: User;

  @Column()
  threshold: number;

  @Column()
  totalWeight: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Signer, (signer) => signer.account, { cascade: true })
  signers: Signer[];

  @OneToMany(() => Transaction, (tx) => tx.account)
  transactions: Transaction[];
}

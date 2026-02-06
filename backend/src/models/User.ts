import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Account } from './Account';
import { Signer } from './Signer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: false })
  biometricEnabled: boolean;

  @Column({ nullable: true })
  biometricData: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ default: false })
  hasCompletedOnboarding: boolean;

  @Column({ nullable: true })
  stellarPublicKey: string;

  @Column({ nullable: true })
  stellarSecretEncrypted: string;

  @Column({ nullable: true })
  stellarSecretIv: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Account, (account) => account.owner)
  ownedAccounts: Account[];

  @OneToMany(() => Signer, (signer) => signer.user)
  signerAccounts: Signer[];
}

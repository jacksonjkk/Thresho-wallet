import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Account } from './Account';
import { Signer } from './Signer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ default: false })
  biometricEnabled!: boolean;

  @Column('text', { nullable: true })
  biometricData: string | null = null;

  @Column('text', { nullable: true })
  avatarUrl: string | null = null;

  @Column({ default: false })
  hasCompletedOnboarding!: boolean;

  @Column('varchar', { nullable: true })
  stellarPublicKey: string | null = null;

  @Column('text', { nullable: true })
  stellarSecretEncrypted: string | null = null;

  @Column('varchar', { nullable: true })
  stellarSecretIv: string | null = null;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Account, (account) => account.owner)
  ownedAccounts!: Account[];

  @OneToMany(() => Signer, (signer) => signer.user)
  signerAccounts!: Signer[];
}

import { apiClient } from './api';

export interface Signer {
  id: string;
  name: string;
  publicKey: string;
  weight: number;
  role: 'owner' | 'signer' | 'viewer';
}

export interface Account {
  id: string;
  name: string;
  threshold: number;
  totalWeight: number;
  signers: Signer[];
  createdAt: string;
  owner: {
    id: string;
    email: string;
  };
}

export interface CreateAccountRequest {
  name: string;
  threshold: number;
  signers: {
    name: string;
    publicKey: string;
    weight: number;
    role: 'owner' | 'signer' | 'viewer';
  }[];
}

export interface AddSignerRequest {
  name: string;
  publicKey: string;
  weight: number;
}

export interface WalletInfo {
  publicKey: string;
  balances: Array<{ asset_type: string; balance: string; asset_code?: string }>;
  networkPassphrase?: string;
}

export const accountService = {
  async createAccount(data: CreateAccountRequest): Promise<{ accountId: string }> {
    return apiClient.post<{ accountId: string }>('/accounts', data);
  },

  async getAccount(accountId: string): Promise<Account> {
    return apiClient.get<Account>(`/accounts/${accountId}`);
  },

  async getUserAccounts(): Promise<Account[]> {
    return apiClient.get<Account[]>('/accounts/my-accounts');
  },

  async updateRules(accountId: string, threshold: number): Promise<{ success: boolean }> {
    return apiClient.put<{ success: boolean }>(`/accounts/${accountId}/rules`, {
      threshold,
    });
  },

  async getMembers(accountId: string): Promise<Signer[]> {
    return apiClient.get<Signer[]>(`/accounts/${accountId}/members`);
  },

  async getAccountWalletInfo(accountId: string): Promise<WalletInfo> {
    return apiClient.get<WalletInfo>(`/accounts/${accountId}/wallet-info`);
  },

  async addSigner(accountId: string, data: AddSignerRequest): Promise<Signer> {
    return apiClient.post<Signer>(`/accounts/${accountId}/signers`, data);
  },

  async removeSigner(accountId: string, signerId: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/accounts/${accountId}/signers/${signerId}`);
  },
  async syncMultisig(accountId: string): Promise<{ transactionId: string; xdr: string; networkPassphrase: string }> {
    return apiClient.post<{ transactionId: string; xdr: string; networkPassphrase: string }>(`/accounts/${accountId}/sync-multisig`);
  },
};

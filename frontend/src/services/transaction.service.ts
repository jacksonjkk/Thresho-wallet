import { apiClient } from './api';

export interface Transaction {
  id: string;
  accountId: string;
  to: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  signatures: string[];
  signatureCount: number;
  xdr?: string;
  memo?: string;
  asset?: string;
  createdAt: string;
  executedAt?: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    stellarPublicKey?: string;
  };
}

export interface CreateTransactionRequest {
  accountId: string;
  to: string;
  amount: string;
  memo?: string;
}

export interface SignTransactionRequest {
  signedXdr: string;
  signerPublicKey: string;
}

export const transactionService = {
  async rejectTransaction(transactionId: string): Promise<{ success: boolean }> {
    return apiClient.post<{ success: boolean }>(
      `/transactions/${transactionId}/reject`
    );
  },
  async createTransaction(data: CreateTransactionRequest): Promise<{ transactionId: string; xdr: string; networkPassphrase: string }> {
    return apiClient.post<{ transactionId: string; xdr: string; networkPassphrase: string }>('/transactions', data);
  },

  async getTransaction(transactionId: string): Promise<Transaction> {
    return apiClient.get<Transaction>(`/transactions/${transactionId}`);
  },

  async signTransaction(
    transactionId: string,
    data: SignTransactionRequest
  ): Promise<{ success: boolean; signatureCount: number }> {
    return apiClient.post<{ success: boolean; signatureCount: number }>(
      `/transactions/${transactionId}/sign`,
      data
    );
  },

  async executeTransaction(transactionId: string): Promise<{ success: boolean; txHash?: string }> {
    return apiClient.post<{ success: boolean; txHash?: string }>(
      `/transactions/${transactionId}/execute`
    );
  },

  async getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    return apiClient.get<Transaction[]>(`/transactions?accountId=${accountId}`);
  },

  async getPendingTransactions(accountId: string): Promise<Transaction[]> {
    return apiClient.get<Transaction[]>(`/transactions?accountId=${accountId}&status=pending`);
  },

  async deleteTransaction(transactionId: string): Promise<{ success: boolean; message?: string }> {
    return apiClient.delete<{ success: boolean; message?: string }>(`/transactions/${transactionId}`);
  },

  async getOnChainHistory(publicKey: string): Promise<any[]> {
    return apiClient.get<any[]>(`/transactions/on-chain?publicKey=${publicKey}`);
  },
};

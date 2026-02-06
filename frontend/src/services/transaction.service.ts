import { apiClient } from './api';

export interface Transaction {
  id: string;
  accountId: string;
  to: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  signatures: string[];
  signatureCount: number;
  createdAt: string;
  executedAt?: string;
}

export interface CreateTransactionRequest {
  accountId: string;
  to: string;
  amount: string;
}

export interface SignTransactionRequest {
  signature: string;
  signerPublicKey: string;
}

export const transactionService = {
  async createTransaction(data: CreateTransactionRequest): Promise<{ transactionId: string }> {
    return apiClient.post<{ transactionId: string }>('/transactions', data);
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
};

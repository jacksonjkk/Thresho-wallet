import { apiClient } from './api';

export interface Invite {
  id: string;
  code: string;
  accountId: string;
  createdAt: string;
  expiresAt: string;
  usedBy?: string;
}

export interface CreateInviteRequest {
  accountId: string;
}

export const inviteService = {
  async createInvite(data: CreateInviteRequest): Promise<{ code: string; inviteLink: string; expiresAt: string }> {
    return apiClient.post<{ code: string; inviteLink: string; expiresAt: string }>('/invites', {
      accountId: data.accountId,
      expiryDays: 1,
    });
  },

  async joinWithInvite(code: string, data: { publicKey: string; name?: string }): Promise<{ accountId: string; message: string }> {
    return apiClient.post<{ accountId: string; message: string }>(`/invites/${code}/join`, data);
  },

  async revokeInvite(code: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/invites/${code}`);
  },

  async getInviteDetails(code: string): Promise<Invite> {
    return apiClient.get<Invite>(`/invites/${code}`);
  },
};

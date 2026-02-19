import { apiClient } from './api';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    hasCompletedOnboarding: boolean;
    publicKey?: string | null;
  };
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    hasCompletedOnboarding: boolean;
  };
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  biometricEnabled: boolean;
  createdAt: string;
  hasCompletedOnboarding: boolean;
  avatarUrl?: string | null;
  stellarPublicKey?: string | null;
}

export interface WalletInfo {
  publicKey: string;
  balances: Array<{ asset_type: string; balance: string; asset_code?: string }>;
}

export interface ChallengeResponse {
  challengeXdr: string;
  networkPassphrase: string;
  serverPublicKey: string;
}

export const authService = {
  async checkEmailExists(email: string): Promise<{ exists: boolean; message?: string }> {
    return apiClient.post<{ exists: boolean; message?: string }>('/auth/check-email', {
      email,
    });
  },

  async register(firstName: string, lastName: string, email: string, password: string): Promise<RegisterResponse> {
    return apiClient.post<RegisterResponse>('/auth/register', {
      firstName,
      lastName,
      email,
      password,
    });
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
  },

  async getChallenge(publicKey: string): Promise<ChallengeResponse> {
    return apiClient.post<ChallengeResponse>('/auth/challenge', {
      publicKey,
    });
  },

  async verifyChallenge(signedXdr: string, publicKey: string): Promise<{ verified: boolean }> {
    return apiClient.post<{ verified: boolean }>('/auth/verify-challenge', {
      signedXdr,
      publicKey,
    });
  },

  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/auth/me');
  },

  async getWalletInfo(): Promise<WalletInfo> {
    return apiClient.get<WalletInfo>('/auth/wallet');
  },

  async updateProfile(data: { firstName?: string; lastName?: string; avatarUrl?: string | null; stellarPublicKey?: string }): Promise<UserProfile> {
    return apiClient.put<UserProfile>('/auth/me', data);
  },

  async completeOnboarding(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/complete-onboarding');
  },

  async logout(): Promise<{ message: string }> {
    apiClient.setToken(null);
    return apiClient.post<{ message: string }>('/auth/logout');
  },

  async deleteAccount(): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>('/auth/me');
  },
};

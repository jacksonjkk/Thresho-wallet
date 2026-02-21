import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../../services/auth.service';
import { apiClient } from '../../services/api';
import { accountService, Account, CreateAccountRequest } from '../../services/account.service';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  hasCompletedOnboarding: boolean;
  walletConnected: boolean;
  publicKey?: string;
  accountId?: string;
  account?: Account;
  avatarUrl?: string | null;
  accountSetup?: {
    type: 'create' | 'join';
    accountId?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isFirstLogin: boolean;
  login: (email: string, password: string) => Promise<void>;
  biometricLogin: () => Promise<void>;
  logout: () => void;
  connectWallet: (publicKey: string, signedXdr: string) => Promise<void>;
  disconnectWallet: () => void;
  completeOnboarding: () => Promise<void>;
  saveAccountData: (accountData: CreateAccountRequest) => Promise<void>;
  refreshAccountData: () => Promise<void>;
  updateOnboarding: (step: 'welcome' | 'wallet' | 'account') => void;
  updateProfile: (data: { firstName?: string; lastName?: string; avatarUrl?: string | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  // Initialize from localStorage and verify token
 useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      apiClient.setToken(storedToken);
    }
    const initializeAuth = async () => {
      try {
        // Verify session by fetching profile (cookie-based)
        const profile = await authService.getProfile();

        const hasCompletedOnboarding = profile.hasCompletedOnboarding || false;

        let account: Account | undefined;
        if (hasCompletedOnboarding) {
          try {
            const accounts = await accountService.getUserAccounts();
            if (accounts && accounts.length > 0) {
              account = accounts[0];
            }
          } catch (err) {
            console.error('Failed to fetch accounts on init:', err);
          }
        }

        const user: User = {
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          hasCompletedOnboarding: hasCompletedOnboarding,
          walletConnected: !!profile.stellarPublicKey,
          publicKey: profile.stellarPublicKey || undefined,
          accountId: account?.id,
          account: account,
          avatarUrl: profile.avatarUrl ?? null,
        };
        setUser(user);

        if (!hasCompletedOnboarding) {
          setIsFirstLogin(true);
          localStorage.setItem('isFirstLogin', 'true');
        }
      } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('isFirstLogin');
        setUser(null);
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Persist user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      
      // Check if this is first login (onboarding not completed)
      if (!response.user.hasCompletedOnboarding) {
        setIsFirstLogin(true);
        localStorage.setItem('isFirstLogin', 'true');
      } else {
        setIsFirstLogin(false);
        localStorage.removeItem('isFirstLogin');
      }
      
      // Try to fetch user's account if onboarding completed
      let account: Account | undefined;
      if (response.user.hasCompletedOnboarding) {
        try {
          const accounts = await accountService.getUserAccounts();
          if (accounts && accounts.length > 0) {
            account = accounts[0];
          }
        } catch (err) {
          console.error('Failed to fetch accounts:', err);
        }
      }

      const loginUser: User = {
        id: response.user.id,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        email: response.user.email,
        hasCompletedOnboarding: response.user.hasCompletedOnboarding,
        walletConnected: !!response.user.publicKey,
        publicKey: response.user.publicKey || undefined,
        accountId: account?.id,
        account: account,
        avatarUrl: response.user.avatarUrl ?? null,
      };

      setUser(loginUser);
      localStorage.setItem('user', JSON.stringify(loginUser));
    } catch (error) {
      throw error instanceof Error ? error : new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const biometricLogin = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement biometric login with backend
      // This would call an endpoint like /auth/biometric-login
      throw new Error('Biometric login not yet implemented');
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async (publicKey: string, signedXdr: string) => {
    try {
      console.log('Connecting wallet with key:', publicKey);
      
      // Validate public key format
      if (!publicKey.match(/^G[A-Z2-7]{55}$/)) {
        throw new Error('Invalid Stellar public key format (must start with G and be 56 chars)');
      }

      if (signedXdr) {
        // Verify with backend
        await authService.verifyChallenge(signedXdr, publicKey);
        console.log('Challenge verified');
      } else {
        console.log('Manual wallet input - skipping signature verification');
      }

      // Update user state
      setUser(prev => {
        if (prev) {
          return {
            ...prev,
            walletConnected: true,
            publicKey
          };
        }
        return null;
      });

      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('publicKey', publicKey);
      console.log('Wallet connected successfully');
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error instanceof Error ? error : new Error('Wallet connection failed');
    }
  };

  const disconnectWallet = () => {
    setUser(prev => prev ? {
      ...prev,
      walletConnected: false,
      publicKey: undefined
    } : null);

    localStorage.removeItem('walletConnected');
    localStorage.removeItem('publicKey');
  };

  const completeOnboarding = async () => {
    try {
      await authService.completeOnboarding();
      
      setUser(prev => prev ? {
        ...prev,
        hasCompletedOnboarding: true
      } : null);

      setIsFirstLogin(false);
      localStorage.setItem('hasCompletedOnboarding', 'true');
      localStorage.removeItem('isFirstLogin');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      throw error;
    }
  };

  const saveAccountData = async (accountData: CreateAccountRequest) => {
    try {
      const result = await accountService.createAccount(accountData);
      
      // Fetch the created account
      const account = await accountService.getAccount(result.accountId);
      
      // Update user with account info
      setUser(prev => prev ? {
        ...prev,
        accountId: account.id,
        account: account,
        hasCompletedOnboarding: true
      } : null);

      localStorage.setItem('accountId', account.id);
      localStorage.setItem('hasCompletedOnboarding', 'true');
    } catch (error) {
      console.error('Failed to save account data:', error);
      throw error;
    }
  };

  const refreshAccountData = async () => {
    try {
      const accounts = await accountService.getUserAccounts();
      const account = accounts && accounts.length > 0 ? accounts[0] : undefined;

      setUser(prev => prev ? {
        ...prev,
        accountId: account?.id,
        account: account,
      } : null);
    } catch (error) {
      console.error('Failed to refresh account data:', error);
      throw error;
    }
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string; avatarUrl?: string | null }) => {
    try {
      const updated = await authService.updateProfile(data);
      setUser(prev => prev ? {
        ...prev,
        firstName: updated.firstName,
        lastName: updated.lastName,
        avatarUrl: updated.avatarUrl ?? null,
      } : null);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const updateOnboarding = (step: 'welcome' | 'wallet' | 'account') => {
    // Track onboarding progress
    localStorage.setItem('onboarding_step', step);
  };
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsFirstLogin(false);
    localStorage.removeItem('user');

    localStorage.removeItem('hasCompletedOnboarding');
    localStorage.removeItem('isFirstLogin');
  };

  const deleteAccount = async () => {
    try {
      await authService.deleteAccount();
      setUser(null);
      setIsFirstLogin(false);
      localStorage.clear();
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  };

  const value: AuthContextType & { deleteAccount: () => Promise<void> } = {
    user,
    isLoading,
    isFirstLogin,
    login,
    biometricLogin,
    logout,
    connectWallet,
    disconnectWallet,
    completeOnboarding,
    saveAccountData,
    refreshAccountData,
    updateOnboarding,
    updateProfile,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

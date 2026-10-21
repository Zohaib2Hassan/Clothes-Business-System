import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authFetch } from '../utils/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  token: string;
  phone?: string;
  avatar?: string;
  twoFactorEnabled?: boolean;
  notificationPreferences?: {
    emailAlerts?: boolean;
    stockAlerts?: boolean;
    salesAlerts?: boolean;
    marketingTips?: boolean;
  };
  appearance?: {
    theme?: string;
    compactMode?: boolean;
  };
  language?: string;
  subscriptionTier?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ 
    success: boolean; 
    requires2FA?: boolean; 
    tempToken?: string; 
    devCode?: string; 
    emailSent?: boolean;
    isEmailConfigured?: boolean;
    message?: string 
  }>;
  verify2FA: (code: string, tempToken?: string, email?: string) => Promise<{ success: boolean; message?: string }>;
  resend2FA: (tempToken?: string, email?: string) => Promise<{ success: boolean; devCode?: string; emailSent?: boolean; isEmailConfigured?: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user info exists in localStorage
    const storedUser = localStorage.getItem('threadly_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('threadly_user');
      }
    }
    setIsLoading(false);

    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('threadly_user');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.requires2FA) {
          return {
            success: false,
            requires2FA: true,
            tempToken: data.tempToken,
            devCode: data.devCode,
            emailSent: Boolean(data.emailSent),
            isEmailConfigured: Boolean(data.isEmailConfigured),
            message: data.message || 'Two-factor authentication code required',
          };
        }
        setUser(data);
        localStorage.setItem('threadly_user', JSON.stringify(data));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const verify2FA = async (code: string, tempToken?: string, email?: string) => {
    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, tempToken, email }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data);
        localStorage.setItem('threadly_user', JSON.stringify(data));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Verification failed' };
      }
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const resend2FA = async (tempToken?: string, email?: string) => {
    try {
      const res = await fetch('/api/auth/resend-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, email }),
      });

      const data = await res.json();

      if (res.ok) {
        return { 
          success: true, 
          devCode: data.devCode, 
          emailSent: Boolean(data.emailSent),
          isEmailConfigured: Boolean(data.isEmailConfigured),
          message: data.message 
        };
      } else {
        return { success: false, message: data.message || 'Failed to resend code' };
      }
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data);
        localStorage.setItem('threadly_user', JSON.stringify(data));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      localStorage.setItem('threadly_user', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshProfile = async () => {
    try {
      const token = user?.token;
      if (!token) return;

      const res = await authFetch('/api/auth/profile');

      if (res.ok) {
        const data = await res.json();
        setUser((prev) => {
          if (!prev || prev.token !== token) return prev;
          const merged = { ...prev, ...data, token: prev.token };
          localStorage.setItem('threadly_user', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (e) {
      console.error('Failed to refresh profile', e);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('threadly_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, verify2FA, resend2FA, register, logout, updateUser, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

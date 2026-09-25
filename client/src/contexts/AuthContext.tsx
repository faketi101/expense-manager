import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getToken, setToken, removeToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, currency?: string) => Promise<void>;
  logout: () => void;
  updatePreferences: (prefs: {
    currency?: string;
    hideBalances?: boolean;
    defaultScope?: string;
    scopeBarOrder?: 'default_first' | 'all_first';
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updatePreferences: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getToken();
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (err) {
          console.warn('Token expired or invalid, logging out:', err);
          removeToken();
          setTokenState(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string, currency?: string) => {
    const res = await api.register({ name, email, password, currency });
    setToken(res.token);
    setTokenState(res.token);
    setUser(res.user);
  };

  const logout = () => {
    removeToken();
    setTokenState(null);
    setUser(null);
  };

  const updatePreferences = async (prefs: { currency?: string; hideBalances?: boolean }) => {
    const res = await api.updatePreferences(prefs);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { User } from '../types';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => undefined,
  register: async () => undefined,
  logout: () => undefined,
  refresh: async () => undefined
});

function normalizeUser(raw: any): User {
  return {
    ...raw,
    nickname: raw.nickname || raw.display_name,
    certifications: Array.isArray(raw.certifications) ? raw.certifications : JSON.parse(raw.certifications || '[]')
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const token = localStorage.getItem('trycodeme_token');
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(normalizeUser(data.user));
    } catch {
      localStorage.removeItem('trycodeme_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('trycodeme_token', data.token);
    setUser(normalizeUser(data.user));
  }

  async function register(email: string, password: string, displayName: string) {
    const { data } = await api.post('/auth/register', { email, password, displayName });
    localStorage.setItem('trycodeme_token', data.token);
    setUser(normalizeUser(data.user));
  }

  function logout() {
    localStorage.removeItem('trycodeme_token');
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, register, logout, refresh }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

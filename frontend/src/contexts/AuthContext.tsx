import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface AuthUser {
  id: number;
  username?: string;
  email?: string;
  [key: string]: unknown;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthRegistration {
  username: string;
  email: string;
  password: string;
  [key: string]: unknown;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (credentials: AuthCredentials) => Promise<unknown>;
  register: (userData: AuthRegistration) => Promise<unknown>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}
import api, { login as apiLogin, register as apiRegister, logout as apiLogout, getProfile } from '../api';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getProfile()
        .then(res => setUser(res.data.user || res.data))
        .catch((err: { response?: { status?: number } } | null) => {
          // Only clear on a CONFIRMED 401 (token actually rejected).
          // Never destroy the session on transient/network errors.
          if (err && err.response && err.response.status === 401) {
            localStorage.removeItem('token'); setToken(null);
          }
        })
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, [token]);

  const login = async (credentials: AuthCredentials) => {
    const res = await apiLogin(credentials);
    const data = res.data;
    localStorage.setItem('token', data.token || data.access);
    setToken(data.token || data.access);
    setUser(data.user);
    return data;
  };

  const register = async (userData: AuthRegistration) => {
    const res = await apiRegister(userData);
    const data = res.data;
    localStorage.setItem('token', data.token || data.access);
    setToken(data.token || data.access);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await apiLogout(); } catch (e) {}
    localStorage.removeItem('token');
    setToken(null); setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from './api';
import { Router, useRouter } from 'next/router';

interface AuthCtx {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  token: null,
  user: null,
  setAuth: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem('cl_token');
    const u = localStorage.getItem('cl_user');
    if (t) setToken(t);
    if (u && u !== "undefined") setUser(JSON.parse(u))
  }, []);

  const setAuth = (t: string, u: User) => {
    localStorage.setItem('cl_token', t);
    localStorage.setItem('cl_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('cl_token');
    localStorage.removeItem('cl_user');
    localStorage.removeItem('cl_data');
    setToken(null);
    setUser(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider value={{ token, user, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

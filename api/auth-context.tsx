'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from './api';
import { useRouter } from 'next/router';

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

  // const logout = () => {
  //   // This replicates the logic inside the logout() function in auth-context.tsx
  //   localStorage.removeItem('cl_token');
  //   localStorage.removeItem('cl_user');
  //   localStorage.removeItem('cl_data');
  //   location.reload(); // Refresh the page to update the React state  
  //   setAuth(null);
  //   setUser(null);
  //   setItem('cl_token',null);
  //   setItem('cl_user',null);
  //   setItem('cl_data',null);

  //   localStorage.clear();
  // };
 const router = useRouter();

const logout = () => {
  setToken(null);
  setUser(null);
  localStorage.removeItem('cl_token');
  localStorage.removeItem('cl_user');
  localStorage.removeItem('cl_data');
  router.replace('/'); // use Next.js router, not window.location
};

  return (
    <AuthContext.Provider value={{ token, user, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

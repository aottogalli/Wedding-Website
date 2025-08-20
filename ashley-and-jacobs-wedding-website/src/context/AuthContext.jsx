// src/context/AuthContext.jsx
'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

const DEBUG = process.env.NODE_ENV !== 'production';
const log = (...a) => DEBUG && console.debug('[Auth]', ...a);

const AuthContext = createContext({
  guest: null,
  loading: false,
  error: null,
  login: async () => {},
  logout: async () => {},
  refresh: async () => null,
});

export function useAuth() {
  return useContext(AuthContext);
}

const ME_URL = '/api/me';
const LOGIN_URL = '/api/auth/login';
const LOGOUT_URL = '/api/auth/logout';
const AUTO_REFRESH_ON_MOUNT = true;

export function AuthProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inflight = useRef(false);

  const safeJson = async (r) => {
    try { return await r.json(); } catch { return null; }
  };

  const refresh = useCallback(async () => {
    if (inflight.current) return guest;
    inflight.current = true;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(ME_URL, { method: 'GET', credentials: 'include', cache: 'no-store' });
      if (!r.ok) throw new Error((await r.text().catch(() => 'Refresh failed')) || `Refresh failed (${r.status})`);
      const data = await safeJson(r);
      setGuest(data?.guest ?? null);
      return data?.guest ?? null;
    } catch (e) {
      log('refresh error:', e?.message || e);
      setError(e?.message || 'Refresh error');
      setGuest(null);
      return null;
    } finally {
      inflight.current = false;
      setLoading(false);
    }
  }, [guest]);

  const login = useCallback(async ({ fullName, postalCode }) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[auth] about to fetch /api/auth/login');
      const r = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fullName, postalCode }),
      });
      console.log('[auth] fetch returned', r.status);
      if (!r.ok) {
        const msg = await r.text().catch(() => 'Invalid credentials');
        throw new Error(msg || 'Invalid credentials');
      }

      const { guest: g } = (await safeJson(r)) || {};
      setGuest(g ?? null);

      // Redirect immediately off /login
      const params =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const next = params.get('from') || '/';
      if (pathname === '/login') router.replace(next);

      // Then confirm via /api/me (updates state if needed)
      refresh().catch(() => {});
      return g ?? null;
    } catch (e) {
      setGuest(null);
      setError(e?.message || 'Login failed');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [refresh, pathname, router]);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetch(LOGOUT_URL, { method: 'POST', credentials: 'include' });
    } catch (e) {
      log('logout error (ignored):', e?.message || e);
    } finally {
      setGuest(null);
      setLoading(false);
      if (pathname !== '/login') router.push('/login');
    }
  }, [pathname, router]);

  useEffect(() => {
    if (!AUTO_REFRESH_ON_MOUNT) return;
    if (pathname === '/login') return;
    refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const value = useMemo(() => ({ guest, loading, error, login, logout, refresh }),
    [guest, loading, error, login, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;

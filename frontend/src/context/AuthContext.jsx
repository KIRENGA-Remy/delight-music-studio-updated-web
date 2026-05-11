import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const ACTIVITY_EVENTS    = ['mousemove','mousedown','keydown','touchstart','scroll','click'];
const LAST_ACTIVE_KEY    = 'dm_last_active';

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const timerRef  = useRef(null);

  /* ── Reset inactivity timer ── */
  const resetTimer = useCallback(() => {
    localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // Log out silently
      localStorage.removeItem('dm_token');
      localStorage.removeItem('dm_user');
      localStorage.removeItem(LAST_ACTIVE_KEY);
      setUser(null);
      // Soft redirect only if inside dashboard
      if (window.location.pathname.startsWith('/dashboard')) {
        window.location.href = '/login?reason=timeout';
      }
    }, SESSION_TIMEOUT_MS);
  }, []);

  /* ── Attach activity listeners ── */
  const startActivityWatch = useCallback(() => {
    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer(); // start timer immediately
  }, [resetTimer]);

  const stopActivityWatch = useCallback(() => {
    ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, resetTimer));
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [resetTimer]);

  /* ── Boot: restore session ── */
  useEffect(() => {
    const token   = localStorage.getItem('dm_token');
    const saved   = localStorage.getItem('dm_user');
    const lastAct = localStorage.getItem(LAST_ACTIVE_KEY);

    if (token && saved) {
      // Check if session already expired while app was closed
      if (lastAct && Date.now() - Number(lastAct) > SESSION_TIMEOUT_MS) {
        localStorage.removeItem('dm_token');
        localStorage.removeItem('dm_user');
        localStorage.removeItem(LAST_ACTIVE_KEY);
        setLoading(false);
        return;
      }
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        startActivityWatch();
        // Refresh profile in background
        api.get('/profile').then(r => {
          setUser(r.data);
          localStorage.setItem('dm_user', JSON.stringify(r.data));
        }).catch(() => {});
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, [startActivityWatch]);

  /* ── Cleanup on unmount ── */
  useEffect(() => () => stopActivityWatch(), [stopActivityWatch]);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    localStorage.setItem('dm_token', res.data.token);
    localStorage.setItem('dm_user',  JSON.stringify(res.data.user));
    setUser(res.data.user);
    startActivityWatch();
    return res.data.user;
  };

  const activateOTP = async (payload) => {
    const res = await api.post('/auth/otp-verify', payload);
    localStorage.setItem('dm_token', res.data.token);
    localStorage.setItem('dm_user',  JSON.stringify(res.data.user));
    setUser(res.data.user);
    startActivityWatch();
    return res.data.user;
  };

  const logout = useCallback(() => {
    stopActivityWatch();
    localStorage.removeItem('dm_token');
    localStorage.removeItem('dm_user');
    localStorage.removeItem(LAST_ACTIVE_KEY);
    setUser(null);
  }, [stopActivityWatch]);

  const refreshUser = useCallback(async () => {
    try {
      const r = await api.get('/profile');
      setUser(r.data);
      localStorage.setItem('dm_user', JSON.stringify(r.data));
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, activateOTP, logout, isAuthenticated: !!user, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dm_token');
    const saved = localStorage.getItem('dm_user');
    if (token && saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        // Refresh profile in background
        api.get('/profile').then(r => {
          const fresh = r.data;
          setUser(fresh);
          localStorage.setItem('dm_user', JSON.stringify(fresh));
        }).catch(() => {});
      } catch { localStorage.clear(); }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    localStorage.setItem('dm_token', res.data.token);
    localStorage.setItem('dm_user',  JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const activateOTP = async (payload) => {
    const res = await api.post('/auth/otp-verify', payload);
    localStorage.setItem('dm_token', res.data.token);
    localStorage.setItem('dm_user',  JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('dm_token');
    localStorage.removeItem('dm_user');
    setUser(null);
  };

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

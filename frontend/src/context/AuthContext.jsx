import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dm_token');
    const saved = localStorage.getItem('dm_user');
    if (token && saved) {
      try { setUser(JSON.parse(saved)); } catch { localStorage.clear(); }
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

  return (
    <AuthContext.Provider value={{ user, loading, login, activateOTP, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

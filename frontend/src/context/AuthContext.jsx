import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('docchat_token') || null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  // Restore authenticated session once on mount
  useEffect(() => {
    async function restoreSession() {
      const savedToken = localStorage.getItem('docchat_token');
      if (!savedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch (err) {
        console.warn('Session restoration failed or expired, clearing saved credentials:', err);
        localStorage.removeItem('docchat_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []); // Run strictly once on initial mount

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('docchat_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setAuthModalOpen(false);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await api.register(name, email, password);
    localStorage.setItem('docchat_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setAuthModalOpen(false);
    return data.user;
  };

  const loginWithGoogle = async (googleData) => {
    const data = await api.googleAuth(googleData);
    localStorage.setItem('docchat_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setAuthModalOpen(false);
    return data.user;
  };

  const loginAsDemo = () => {
    const demoUser = {
      id: 1,
      name: 'Demo User',
      email: 'demo@docchat.app',
      background_theme: 'mountains',
      preferred_model: 'qwen2.5:3b'
    };
    setUser(demoUser);
    return demoUser;
  };

  const logout = () => {
    localStorage.removeItem('docchat_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated) => {
    setUser(prev => ({ ...prev, ...updated }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      loginWithGoogle,
      loginAsDemo,
      logout,
      updateUser,
      authModalOpen,
      setAuthModalOpen,
      authModalMode,
      setAuthModalMode
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

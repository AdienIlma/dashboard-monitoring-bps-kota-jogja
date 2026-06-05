import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (data) => {
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Gagal logout:', err);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
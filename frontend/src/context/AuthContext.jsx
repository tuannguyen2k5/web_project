import React, { createContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => sessionStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.token && res.user) {
      sessionStorage.setItem('token', res.token);
      sessionStorage.setItem('user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error('Dữ liệu trả về không hợp lệ');
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    return res;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error("Token verification failed, logging out...", err);
          logout();
        }
      }
      setLoading(false);
    };

    bootstrapAuth();
  }, [token]);

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login-json', { username, password });
      const { access_token, role, username: resUser } = res.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      const userRes = await api.get('/auth/me');
      setUser(userRes.data);
      return userRes.data;
    } catch (err) {
      throw err.response?.data?.detail || "Invalid login credentials";
    }
  };

  const register = async (username, password, role = "Staff") => {
    try {
      const res = await api.post('/auth/register', { username, password, role });
      return res.data;
    } catch (err) {
      throw err.response?.data?.detail || "Registration failed";
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const response = await apiClient.get('/auth/me/');
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiClient.post('/auth/login/', { username, password });
      setUser(response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Login failed';
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout/');
      setUser(null);
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

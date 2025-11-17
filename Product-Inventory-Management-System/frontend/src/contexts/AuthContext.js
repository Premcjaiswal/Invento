import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api, { setAuthHeader } from '../lib/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on initial load
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            // Token expired
            logout();
          } else {
            // Set auth token header
            setAuthHeader(token);
            await loadUser();
          }
        } catch (err) {
          logout();
        }
      } else {
        setLoading(false);
      }
    };
    
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load user data
  const loadUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res.data && res.data.user) {
        setCurrentUser(res.data.user);
        setIsAuthenticated(true);
        setLoading(false);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      logout();
    }
  };

  // Register user
  const register = async (userData) => {
    setError(null);
    try {
      const res = await api.post('/api/auth/register', userData);
      const { token } = res.data;
      localStorage.setItem('token', token);
      setAuthHeader(token);
      await loadUser();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  // Login user
  const login = async (userData) => {
    setError(null);
    try {
      const res = await api.post('/api/auth/login', userData);
      const { token } = res.data;
      localStorage.setItem('token', token);
      setAuthHeader(token);
      await loadUser();
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      return false;
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setAuthHeader(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
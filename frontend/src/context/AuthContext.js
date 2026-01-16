import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchCurrentUser]);

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { access_token, user } = response.data;
    setToken(access_token);
    setUser(user);
    localStorage.setItem('token', access_token);
    return user;
  };

  const register = async (...args) => {
    // Support two call styles: register({email, password, name, role, phone}) or register(email, password, name, role, phone)
    let payload = {};
    if (args.length === 1 && typeof args[0] === 'object') {
      payload = args[0];
    } else {
      const [email, password, name, role, phone] = args;
      payload = { email, password, name, role, phone };
    }

    const response = await axios.post(`${API_URL}/auth/register`, payload);
    // Some registrations require admin approval and the backend returns a message instead of a token
    if (response.data && response.data.access_token) {
      const { access_token, user } = response.data;
      setToken(access_token);
      setUser(user);
      localStorage.setItem('token', access_token);
      return user;
    }

    // Return backend message for pending approvals
    return response.data; 
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

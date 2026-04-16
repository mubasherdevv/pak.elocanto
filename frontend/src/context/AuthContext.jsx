import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
      setInitialized(true);
    }
    // eslint-disable-next-line
  }, [token]);

  const fetchUserProfile = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const { data } = await api.get('/users/profile');
      setUser(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setToken(null);
    } finally {
      if (showLoading) setLoading(false);
      setInitialized(true);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post('/users/login', { email, password });
      setToken(data.token);
      setUser(data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (googleData) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post('/users/google', googleData);
      setToken(data.token);
      setUser(data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, phone = '', city = '') => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post('/users', { name, email, password, phone, city });
      return { success: true, userId: data.userId, message: data.message };
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      return { success: false, message: err.response?.data?.message || err.message };
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (userId, code) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post('/users/verify', { userId, code });
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      return { success: false, message: err.response?.data?.message || err.message };
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (userId) => {
    try {
      const { data } = await api.post('/users/resend-verify', { userId });
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post('/users/forgot-password', { email });
      return { success: true, userId: data.userId, message: data.message };
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      return { success: false, message: err.response?.data?.message || err.message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (userId, code, password) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.post('/users/reset-password', { userId, code, password });
      return { success: true, message: data.message };
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      return { success: false, message: err.response?.data?.message || err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const { data } = await api.put('/users/profile', profileData);
      setUser(data);
      if (data.token) setToken(data.token);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, initialized, error, login, googleLogin, register, verifyEmail, resendVerification, forgotPassword, resetPassword, logout, updateProfile, setError, fetchUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;

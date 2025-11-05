import { createContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      
      if (response.data.success && response.data.data) {
        const { token, user: userData } = response.data.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { success: true, data: userData };
      } else {
        return {
          success: false,
          message: response.data.message || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed. Please check your connection.'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axiosInstance.post('/auth/register', userData);
      
      if (response.data.success && response.data.data) {
        const { token, user: newUser } = response.data.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        
        return { success: true, data: newUser };
      } else {
        return {
          success: false,
          message: response.data.message || 'Registration failed'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed. Please check your connection.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isOwner: user?.role === 'owner',
    isCustomer: user?.role === 'customer'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


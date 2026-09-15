import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    
    console.log('AuthProvider: Checking for saved session');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('AuthProvider: Found saved user:', userData);
        apiService.setToken(token);
        setUser(userData);
        setLoading(false);
        verifyToken();
      } catch (e) {
        console.error('Error parsing saved user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const data = await apiService.getCurrentUser();
      console.log('AuthProvider: Token verified, user:', data.user);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch (error) {
      console.error('AuthProvider: Token verification failed:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      apiService.setToken(null);
      setUser(null);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('AuthProvider: Attempting login for:', email);
      const data = await apiService.login({ email, password });
      
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('access_token', data.access_token);
      apiService.setToken(data.access_token);
      
      setError(null);
      console.log('AuthProvider: Login successful for:', data.user.email);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('AuthProvider: Login failed:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      console.log('AuthProvider: Attempting registration for:', userData.email);
      const data = await apiService.register(userData);
      
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('access_token', data.access_token);
      apiService.setToken(data.access_token);
      
      setError(null);
      console.log('AuthProvider: Registration successful for:', data.user.email);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('AuthProvider: Registration failed:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    console.log('AuthProvider: Logging out user:', user?.email);
    apiService.setToken(null);
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
  };

  // FIXED: updateProfile method
  const updateProfile = async (data) => {
    try {
      console.log('AuthProvider: Updating profile for:', user?.email);
      console.log('AuthProvider: Data to update:', data);
      
      // Make sure apiService.updateProfile exists
      if (typeof apiService.updateProfile !== 'function') {
        console.error('apiService.updateProfile is not a function!');
        return { success: false, error: 'API service not properly configured' };
      }
      
      const response = await apiService.updateProfile(data);
      console.log('AuthProvider: Profile update response:', response);
      
      if (response && response.user) {
        // Update user state
        setUser(response.user);
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        return { success: true, user: response.user };
      } else {
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error) {
      console.error('AuthProvider: Profile update failed:', error);
      return { success: false, error: error.message || 'Failed to update profile' };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    hasToken: !!localStorage.getItem('access_token'),
    isAdmin: user?.is_admin || false,
    isVerified: user?.is_verified || false,
  };

  console.log('AuthProvider: Providing auth context:', { 
    isAuthenticated: !!user, 
    isAdmin: user?.is_admin,
    hasUpdateProfile: typeof updateProfile === 'function'
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

/**
 * Authentication Context
 * Manages user authentication state across the app
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';
import { getFCMToken } from '../services/notificationService';
import socketService from '../services/socketService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);

  // Load user from storage on app start
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      console.log('🔄 Loading user from storage...');
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('user');

      console.log('📦 Token exists:', !!token);
      console.log('📦 User data exists:', !!userData);

      if (token && userData) {
        setAuthToken(token);
        setUser(JSON.parse(userData));
        
        // Connect to WebSocket
        const parsedUser = JSON.parse(userData);
        console.log('🔌 Connecting to WebSocket for user:', parsedUser._id);
        socketService.connect(parsedUser._id);
        console.log('✅ User loaded successfully');
      } else {
        console.log('⚠️ No stored credentials found');
      }
    } catch (error) {
      console.error('❌ Load user error:', error);
    } finally {
      console.log('✅ Auth loading complete');
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Get FCM token for push notifications (will be null in Expo Go)
      const fcmToken = await getFCMToken();

      const response = await authAPI.login({
        email,
        password,
        fcmToken: fcmToken || undefined,
      });

      const { token, user: userData } = response.data;

      // Save to storage
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setAuthToken(token);
      setUser(userData);

      // Connect to WebSocket
      socketService.connect(userData._id);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
      };
    }
  };

  const register = async (name, email, password, role = 'developer') => {
    try {
      const response = await authAPI.register({
        name,
        email,
        password,
        role,
      });

      const { token, user: userData } = response.data;

      // Save to storage
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setAuthToken(token);
      setUser(userData);

      // Connect to WebSocket
      socketService.connect(userData._id);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');

      // Disconnect WebSocket
      socketService.disconnect();

      setAuthToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data.user;

      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Update failed',
      };
    }
  };

  const toggleOnCall = async () => {
    try {
      const response = await authAPI.toggleOnCall();
      const { isOnCall } = response.data;

      const updatedUser = { ...user, isOnCall };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      return { success: true, isOnCall };
    } catch (error) {
      console.error('Toggle on-call error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Toggle failed',
      };
    }
  };

  const value = {
    user,
    authToken,
    loading: !!loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    toggleOnCall,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;

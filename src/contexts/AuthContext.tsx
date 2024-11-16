import React, { createContext, useContext, useState } from 'react';
import { User } from '../types';
import api from '../lib/api';
import toast from 'react-hot-toast';
import axios from 'axios';

interface AuthContextType {
  currentUser: User | null;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const handleAuthError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      console.error('Auth Error:', error.response?.data || error.message);
      const message = error.response?.data?.error || 
                     error.message || 
                     'Authentication failed';
      toast.error(message);
      return;
    }
    toast.error('An unexpected error occurred');
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/register', {
        email: email.trim(),
        password,
        name: name.trim()
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      toast.success('Account created successfully!');
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/login', {
        email: email.trim(),
        password
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      toast.success('Welcome back!');
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    currentUser,
    signUp,
    signIn,
    signOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
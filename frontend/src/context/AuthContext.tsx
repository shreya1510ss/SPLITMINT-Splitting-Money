import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('splitmint_token');
      if (savedToken) {
        try {
          // Fetch real user profile from backend
          const userData = await api.get('/auth/me');
          setUser(userData);
        } catch (error) {
          console.error('Session expired or invalid:', error);
          api.clearToken(); // Wipe invalid token
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (credentials: any) => {
    try {
      const data = await api.post('/auth/login', credentials);
      // Backend returns { access_token, token_type }
      api.setToken(data.access_token);
      
      // Immediately fetch the user profile
      const userData = await api.get('/auth/me');
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      // 1. Register the user
      await api.post('/auth/register', data);
      
      // 2. Log them in (backend doesn't auto-generate token on register in current implementation)
      // Actually, let's keep it simple: Login right after register
      await login({ email: data.email, password: data.password });
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    api.clearToken();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

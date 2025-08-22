import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { login, logout, getCurrentUser } from '@/lib/api';

interface User {
  id: number;
  username: string;
  phone: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await getCurrentUser(token);
          setUser(userData);
        } catch (error) {
          console.error('Failed to get user data', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const handleLogin = async (identifier: string, password: string) => {
    try {
      const response = await login(identifier, password);
      if (response.success) {
        setToken(response.data.token);
        setUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        return true;
      }      
      return false;
    } catch (error) {
      console.error('Login failed', error);
      return false;
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await logout(token);
      } catch (error) {
        console.error('Logout failed', error);
      }
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login: handleLogin,
      logout: handleLogout,
      isLoading
    }}>
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
import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import type { AuthContextType } from './types';
import type { User } from '../../types/shared/User';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        axios.defaults.withCredentials = true;

        if (user) return;

        const response = await axios.get('/api/auth/me');
        const data = response.data;
        setUser(data);
      } catch (err) {
        // reference error to avoid unused-var lint
        console.error('Auth check failed', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void checkAuthStatus();
  }, [user]);

  const login = (userData: User | null) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

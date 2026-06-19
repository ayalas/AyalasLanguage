import React, { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import type { User } from '../../types/shared/User';
import { ROLE_TYPE, type AuthContextType } from '@ayalaslanguage/types/auth';

const AuthContext = createContext<AuthContextType<User> | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthContextType<User>['user']>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        axios.defaults.withCredentials = true;

        if (user && user.role == ROLE_TYPE.ADMIN) return;

        const response = await axios.get('/admin/api/auth/me');
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

    checkAuthStatus();
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

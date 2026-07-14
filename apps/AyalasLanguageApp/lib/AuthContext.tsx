import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';
import type { AuthContextType } from '@ayalaslanguage/types/auth';

const AuthContext = createContext<AuthContextType<User> | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthContextType<User>['user']>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
       // axios.defaults.withCredentials = true;

        if (user) return;

        const response = await axios.get('/api/auth/me');
        const data = response.data;
        setUser(data);
      } catch {
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

export const useAuth = (): AuthContextType<User> => {
  const ctx = useContext(AuthContext as unknown as React.Context<AuthContextType<User> | undefined>);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx as AuthContextType<User>;
};

export default AuthContext;

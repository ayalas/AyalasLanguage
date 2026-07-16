import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';
import type { AuthContextType } from '@ayalaslanguage/types/auth';
import api from './api'; // Use the custom axios instance
import { getToken, saveToken, deleteToken } from './authStorage';

const AuthContext = createContext<AuthContextType<User> | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthContextType<User>['user']>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = await getToken();

        if (token && user == null) {
          // Verify token by calling /me
          const response = await api.get('/api/auth/me');
          setUser(response.data);
        }
      } catch (error) {
        console.error("Session expired or invalid", error);
        await deleteToken();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [user]);

  const login = async (userData: User | null, token?: string) => {
    if (token != null) {
      await saveToken(token);
    }
    if (userData != null) {
      setUser(userData);
    }
  };

  const logout = async () => {
    await deleteToken();
    setUser(null);
  };

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

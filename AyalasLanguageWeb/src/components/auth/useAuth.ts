import { useContext } from 'react';
import AuthContext from './AuthContext';
import type { AuthContextType } from './types';

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext as unknown as React.Context<AuthContextType | undefined>);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx as AuthContextType;
};

export default useAuth;

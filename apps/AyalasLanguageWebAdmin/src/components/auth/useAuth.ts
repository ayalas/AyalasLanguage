import { useContext } from 'react';
import AuthContext from './AuthContext';
import type { AuthContextType } from '@ayalaslanguage/types/auth';
import type { User } from '../../types/shared/User';

export const useAuth = (): AuthContextType<User> => {
  const ctx = useContext(AuthContext as unknown as React.Context<AuthContextType<User> | undefined>);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx as AuthContextType<User>;
};

export default useAuth;

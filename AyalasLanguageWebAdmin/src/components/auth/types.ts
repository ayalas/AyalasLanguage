import type { User } from '../../types/shared/User';

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (userData: User | null) => void;
  logout: () => void;
};


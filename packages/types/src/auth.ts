
export const TWO_FACTOR_CODE_LENGTH = 6;

export const AUTHOR_ACCESS = 
{
    LEARNER: 1,
    CAN_EDIT: 2
} as const;

export const ROLE_TYPE = 
{
    LEARNER: 1,
    CONTENT_CREATOR: 2,
    ADMIN: 3
} as const;

export type RoleType = typeof ROLE_TYPE[keyof typeof ROLE_TYPE];

export type AuthContextType<T> = {
  user: T | null;
  loading: boolean;
  login: (userData: T | null) => void;
  logout: () => void;
};

export interface LoginRequest
{
    userName: string;
    password: string;
}

export interface LoginResponse<T>
{
    expires: string;
    user: T;
    requires2FA: boolean;
    verify2FAToken: string;
}

export interface Verify2FARequest
{
    verify2FAToken: string;
    code: string;
}

export interface Verify2FAResponse<T>
{
    expires: string;
    user: T;
}

export const TWO_FACTOR_CODE_LENGTH = 6;

export const AUTHOR_ACCESS = 
{
    LEARNER: 1,
    CAN_EDIT: 2
} as const;

export type AuthorAccess = typeof AUTHOR_ACCESS[keyof typeof AUTHOR_ACCESS];

export const ROLE_TYPE = 
{
    LEARNER: 1,
    CONTENT_CREATOR: 2,
    ADMIN: 3
} as const;

export const APP_IDENTIFIER = 
{
    MAIN: 1,
    ADMIN: 2,
    MAIN_2FA: 3,
    ADMIN_2FA: 4
} as const;

export type RoleType = typeof ROLE_TYPE[keyof typeof ROLE_TYPE];
export type AppIdentifier = typeof APP_IDENTIFIER[keyof typeof APP_IDENTIFIER];

export type AuthContextType<T> = {
  user: T | null;
  loading: boolean;
  login: (userData: T | null, token?: string) => void;
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
    token: string;
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
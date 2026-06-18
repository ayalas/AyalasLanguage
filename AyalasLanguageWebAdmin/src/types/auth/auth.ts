import { ROLE_TYPE } from "../../constants/admin";
import type { User } from "../shared/User";

export interface LoginRequest {
    userName: string;
    password: string;
}

export interface LoginResponse {
    expires: string;
    user: User;
    requires2FA: boolean;
    verify2FAToken: string;
}

export interface Verify2FARequest {
    verify2FAToken: string;
    code: string;
}

export interface Verify2FAResponse {
    expires: string;
    user: User;
}

export type RoleType = typeof ROLE_TYPE[keyof typeof ROLE_TYPE];

export const ROLE_MAPPING = {
  [ROLE_TYPE.LEARNER]: "Learner",
  [ROLE_TYPE.CONTENT_CREATOR]: "Content Creator",
  [ROLE_TYPE.ADMIN]: "Admin"
} as const;

export interface IRowUser {
    userId: number;
    displayName?: string;
    userName: string;
    role: RoleType;
    emailConfirmed: boolean;
    use2FALogin: boolean;
    knownLanguage?: string;
    targetLanguage?: string;
}
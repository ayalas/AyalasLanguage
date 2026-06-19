import { ROLE_TYPE, type RoleType } from "@ayalaslanguage/types/auth";

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
import { APP_IDENTIFIER, ROLE_TYPE, type AppIdentifier, type RoleType } from "@ayalaslanguage/types/auth";

export const ROLE_MAPPING = {
  [ROLE_TYPE.LEARNER]: "Learner",
  [ROLE_TYPE.CONTENT_CREATOR]: "Content Creator",
  [ROLE_TYPE.ADMIN]: "Admin"
} as const;

export const APP_ID_MAPPING= {
    [APP_IDENTIFIER.MAIN]: "Main",
    [APP_IDENTIFIER.ADMIN]: "Admin",
    [APP_IDENTIFIER.MAIN_2FA]: "Main (2FA)",
    [APP_IDENTIFIER.ADMIN_2FA]: "Admin (2FA)"
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
    createdOn: string;
}

export interface IRowLogin {
    userId: number;
    email: string;
    appId: number;
    createdOn: string;
    expiresOn: string;
}
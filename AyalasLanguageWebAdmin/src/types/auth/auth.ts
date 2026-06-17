import type { User } from "../shared/User";

export interface LoginRequest
{
    userName: string;
    password: string;
}

export interface LoginResponse
{
    expires: string;
    user: User;
    requires2FA: boolean;
    verify2FAToken: string;
}

export interface Verify2FARequest
{
    verify2FAToken: string;
    code: string;
}

export interface Verify2FAResponse
{
    expires: string;
    user: User;
}
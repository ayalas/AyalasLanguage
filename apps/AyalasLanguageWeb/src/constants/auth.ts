import type { Tab } from "../components/tabs/TabLinksComponent";

export const AuthTabsEnum= {
    Login: 0,
    Register: 1,
    ForgotPassword: 2
}

export const AUTH_TABS: Tab[] = [
    { id: AuthTabsEnum.Login, label: 'Login', path: '/login' },
    { id: AuthTabsEnum.Register, label: 'Register', path: '/register' },
    { id: AuthTabsEnum.ForgotPassword, label: 'Forgot Password', path: '/forgot' }
];
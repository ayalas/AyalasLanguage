import type { Tab } from "../components/tabs/TabLinksComponent";

export const AuthTabsEnum= {
    Login: 0,
    Register: 1
}

export const AUTH_TABS: Tab[] = [
    { id: AuthTabsEnum.Login, label: 'Log In', path: '/login' },
    { id: AuthTabsEnum.Register, label: 'Sign Up', path: '/register' }
];
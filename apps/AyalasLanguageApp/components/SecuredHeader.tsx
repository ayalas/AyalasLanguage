import React, { useState, useEffect } from 'react';
import { View, Image, Text } from 'react-native'
import { useAuth } from '@/lib/AuthContext';
import { Link, useRouter } from 'expo-router';
import { Mail, SquareMenu, Volleyball } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import * as DropdownMenu from 'zeego/dropdown-menu';
import api from '@/lib/api'; //secured axios instance
import { switchLanguage } from '@ayalaslanguage/types/sharedfrontlib/utils';
import type { Language, User } from '@ayalaslanguage/types/sharedfrontlib/user';
import { errorHandler } from '@ayalaslanguage/types/error';

import imgLogo from "@/assets/images/logo.png";
import imgLogoDark from "@/assets/images/logo-dark.png"; //todo
import useTextStyles from '@/lib/useTextStyles';

export const LANGUAGE_INDICATOR_ENUM = {
    NONE: 0,
    SWITCH: 1,
    SHOW_LANGUAGE: 2
};


export type LanguageIndicator = typeof LANGUAGE_INDICATOR_ENUM[keyof typeof LANGUAGE_INDICATOR_ENUM];

type SwitchLanguageFunc = (axiosInstance: any, user: User | null | undefined, loginFn: ((u: User) => void) | undefined, targetLanguageId: number, knownLanguageId?: number) => Promise<User>;


export default function SecuredHeader({ languageIndicator = LANGUAGE_INDICATOR_ENUM.NONE }: { languageIndicator?: LanguageIndicator }) {
    const { user, logout, login } = useAuth();
    const [selectedLanguageId, setSelectedLanguageId] = useState<string | number>('');
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const { styles, isDark } = useTextStyles();

    useEffect(() => {
        const loadLanguage = async function () {
            if (!user || !user.languageSettings) return;

            const targetId = user.languageSettings.targetLanguageId;
            if (targetId != null) {
                setSelectedLanguageId(targetId);
                setSelectedLanguage(user.languageSettings.targetLanguageEnglishName || '');
            }
        };
        loadLanguage();
    }, [user]);

    const logoutAction = async function () {
        try {
            await api.post('/api/auth/logout');
            logout();
            router.replace('/login');
        }
        catch (err) {
            errorHandler(err, setError);
        }
    }

    async function onChangeLanguage(value: string | number) {
        try {
            const val = Number(value);
            setSelectedLanguageId(val);
            const fn = switchLanguage as unknown as SwitchLanguageFunc;
            const newUser = await fn(api, user, login, val, user?.languageSettings?.knownLanguageId);
            setSelectedLanguage(newUser.languageSettings?.targetLanguageEnglishName ?? '');
        } catch (err) {
            console.error('Language switch error:', err);
        }
    }

    return (
        <>
            <View className="header-row">
                <View className="header-title">
                    <Link className="header-app-link" href="/"><Image className="logo" source={isDark? imgLogoDark : imgLogo} /></Link>
                </View>

                <View className="header-profile-container">
                    <View className="header-profile-name">
                        <Text style={styles.text}>{user?.displayName}</Text>
                        <View className="header-score"><Volleyball /><Text style={styles.text}> {user?.languageSettings?.score}</Text></View>
                    </View>
                </View>
                <DropdownMenu.Root>
                <DropdownMenu.Trigger className='menu-button'>
                    <SquareMenu />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content  className="menu-container">
                    <DropdownMenu.Item key="profile" onSelect={() => router.push('/profile')}>
                        <DropdownMenu.ItemTitle className='text menu-item'>Profile settings</DropdownMenu.ItemTitle>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item key="account" onSelect={() => router.push('/account')}>
                        <DropdownMenu.ItemTitle className='text menu-item'>Manage account</DropdownMenu.ItemTitle>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item key="usernote" onSelect={() => router.push('/usernote')}>
                        <DropdownMenu.ItemTitle className='text menu-item'><Mail />&nbsp;Contact Us</DropdownMenu.ItemTitle>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="menu-delimiter" />
                    <DropdownMenu.Item key="logout" onSelect={logoutAction}>
                        <DropdownMenu.ItemTitle className='text menu-item'>Logout</DropdownMenu.ItemTitle>
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
                </DropdownMenu.Root>
            </View>
            {languageIndicator !== LANGUAGE_INDICATOR_ENUM.NONE && (
                <View className="switch-container">
                    {(user && user.languageSettings && (user.languageSettings.knownLanguageId ?? 0) > 0 && user.languageSettings.otherUserLanguages && user.languageSettings.otherUserLanguages.length > 0 && (
                        <View className="header-input-cell">
                            {languageIndicator === LANGUAGE_INDICATOR_ENUM.SWITCH && (
                                <Picker className="header-select" testID="language-picker"
                                    selectedValue={selectedLanguageId}
                                    onValueChange={(itemValue) => onChangeLanguage(itemValue)}
                                    mode="dropdown" // Android only: 'dropdown' or 'dialog'
                                >
                                    <Picker.Item    key={user.languageSettings.targetLanguageId} 
                                                    label={user.languageSettings.targetLanguageEnglishName} 
                                                    value={user.languageSettings.targetLanguageId} />
                                    {user.languageSettings.otherUserLanguages.map((language: Language) => (
                                        <Picker.Item key={language.languageId}
                                            value={language.languageId}
                                            label={language.englishName}
                                        />
                                    ))}
                                </Picker>
                            ) || (
                                    <Text style={styles.text}>
                                        {selectedLanguage}
                                    </Text>
                                )}
                        </View>
                    ))}

                </View>
            )}
            {
                error !== '' && (
                    <View className="form-row">
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )
            }
        </>
    );
}

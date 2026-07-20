import React, { useState, useEffect, useMemo } from 'react';
import { View, Image, Text, StyleProp, ViewStyle } from 'react-native'
import { useAuth } from '@/lib/AuthContext';
import { Link, useRouter } from 'expo-router';
import { SquareMenu, Volleyball } from 'lucide-react-native';
import DropDownPicker, { ItemType, ValueType } from 'react-native-dropdown-picker';
import { Menu, Divider, IconButton } from 'react-native-paper';
import api from '@/lib/api'; //secured axios instance
import { switchLanguage } from '@ayalaslanguage/types/sharedfrontlib/utils';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';
import { errorHandler } from '@ayalaslanguage/types/error';

import imgLogo from "@/assets/images/logo.png";
import imgLogoDark from "@/assets/images/logo-dark.png"; //todo
import useTextStyles from '@/lib/useTextStyles';
import { BORDER_DARK, BORDER_LIGHT, PRIMARY_DARK, PRIMARY_LIGHT } from '@/constants';

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
    const [prevSelectedLanguageId, setPrevSelectedLanguageId] = useState<string | number>('');
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [selectedLanguageOpen, setSelectedLanguageOpen] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const [menuVisible, setMenuVisible] = useState(false);
    const { styles, isDark } = useTextStyles();
    const languageItems = useMemo(() => {
        if (user == null || !user.languageSettings || !user.languageSettings.otherUserLanguages) return [];
        return user.languageSettings.otherUserLanguages.map((language) => ({
            value: language.languageId,
            label: language.englishName,
        } as ItemType<ValueType>)) as ItemType<ValueType>[];
    }, [user]); // Only re-run if this specific data changes

    const IconUp = ({style}: {style: StyleProp<ViewStyle>}) => {
        return (
            <View style={style}>
                <Text style={{ color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT }}>▲</Text> 
            </View>
        );
    };

    const IconDown = ({style}: {style: StyleProp<ViewStyle>}) => {
        return (
            <View style={style}>
                <Text style={{ color: isDark ? PRIMARY_DARK : PRIMARY_LIGHT }}>▼</Text> 
            </View>
        );
    };

    const openMenu = () => setMenuVisible(true);
    const closeMenu = () => setMenuVisible(false);

    useEffect(() => {
        const loadLanguage = async function () {
            if (!user || !user.languageSettings) return;

            const targetId = user.languageSettings.targetLanguageId;
            if (targetId != null) {
                setPrevSelectedLanguageId(targetId);
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
            /* console.log('call to onChangeLanguage with ', value, ' while prev is ', prevSelectedLanguageId); */
            if (!value || Number(value) === Number(prevSelectedLanguageId)) return;
            /* console.log('valid call to onChangeLanguage with ', value); */
            setPrevSelectedLanguageId(value);
            const fn = switchLanguage as unknown as SwitchLanguageFunc;
            const newUser = await fn(api, user, login, Number(value), user?.languageSettings?.knownLanguageId);
            setSelectedLanguage(newUser.languageSettings?.targetLanguageEnglishName ?? '');
            setSelectedLanguageOpen(false);
        } catch (err) {
            console.error('Language switch error:', err);
        }
    }

    return (
        <>
            <View className="header-row">
                <View className="header-title">
                    <Link className="header-app-link" href="/"><Image className="logo" source={isDark ? imgLogoDark : imgLogo} /></Link>
                </View>

                <View className="header-profile-container">
                    <View className="header-profile-name">
                        <Text style={styles.text}>{user?.displayName}</Text>
                        <View className="header-score"><Volleyball /><Text style={styles.text}> {user?.languageSettings?.score}</Text></View>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', alignSelf: 'flex-start', width: 36, justifyContent: 'center' }}>
                    <Menu
                        visible={menuVisible}
                        onDismiss={closeMenu}
                        anchor={
                            <IconButton style={{ paddingHorizontal: 16, width:'100%', paddingVertical: 10}}
                                icon={() => <SquareMenu className="color-brand-primary" />}
                                onPress={openMenu}
                            />
                        }>
                        <Menu.Item onPress={() => { router.push('/profile'); closeMenu(); }} title="Profile settings" />
                        <Menu.Item onPress={() => { router.push('/account'); closeMenu(); }} title="Manage account" />
                        <Menu.Item onPress={() => { router.push('/usernote'); closeMenu(); }} title="Contact Us" />
                        <Divider />
                        <Menu.Item onPress={() => { logoutAction(); closeMenu(); }} title="Logout" />
                    </Menu>
                </View>
            </View>
            {languageIndicator !== LANGUAGE_INDICATOR_ENUM.NONE && (
                <View className="switch-container">
                    {(user && user.languageSettings && (user.languageSettings.knownLanguageId ?? 0) > 0 && user.languageSettings.otherUserLanguages && user.languageSettings.otherUserLanguages.length > 0 && (
                        <View className="header-input-cell">
                            {languageIndicator === LANGUAGE_INDICATOR_ENUM.SWITCH && (
                                <DropDownPicker
                                    value={selectedLanguageId}
                                    open={selectedLanguageOpen}
                                    setOpen={setSelectedLanguageOpen}
                                    listMode="SCROLLVIEW"
                                    multiple={false}

                                    ArrowUpIconComponent={IconUp}
                                    ArrowDownIconComponent={IconDown}
                                    style={{
                                        width: 'auto',
                                        maxWidth: 150,
                                        minHeight: 40,
                                        borderWidth: 1,
                                        borderStyle: 'solid',
                                        borderColor: isDark? PRIMARY_DARK : PRIMARY_LIGHT,
                                        backgroundColor: 'transparent',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    textStyle={[styles.text, { textAlign: 'center', paddingTop: 5 }]}
                                    listItemLabelStyle={{ textAlign: 'center', marginLeft: -28, paddingTop: 10 }}
                                    dropDownContainerStyle={{
                                        width: 'auto',
                                        minWidth: 150,
                                        borderWidth: 0
                                    }}
                                    listItemContainerStyle={[styles.bgAlter, { alignItems: 'center', justifyContent: 'center' }]}
                                    placeholder={selectedLanguage}
                                    setValue={setSelectedLanguageId}
                                    onChangeValue={(value) =>
                                        onChangeLanguage(value?.toString() ?? '')
                                    }
                                    items={languageItems}
                                />
                            )}
                            {languageIndicator === LANGUAGE_INDICATOR_ENUM.SHOW_LANGUAGE && (
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

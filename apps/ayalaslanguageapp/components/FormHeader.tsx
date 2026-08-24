import { View, Text, Pressable, GestureResponderEvent } from 'react-native'
import React from 'react'
import { X } from "lucide-react-native";
import { Link, useRouter } from "expo-router";
import useTextStyles from '@/lib/useTextStyles';
import { PressableProps } from 'react-native-paper/lib/typescript/components/TouchableRipple/Pressable';

interface FormHeaderProps {
    title: string;
    titleSize?: 'sm' | 'lg';
    OnPress?: null | ((event: GestureResponderEvent) => void);
}

export function FormHeader({ title, titleSize = 'lg', OnPress = null }: FormHeaderProps) {
    const { styles } = useTextStyles();
    const router = useRouter();

    return (
        <View className="form-header">
            <Text style={[titleSize == 'lg' ? styles.h2 : styles.dimmedText, {flexWrap: 'wrap', maxWidth: 220}]}>{title}</Text>
            <Pressable className="actions-menu-link-button" onPress={OnPress != null? OnPress : () => router.replace('/')}>
                <View className='flex-row items-center justify-center'><X className="color-brand-primary" /><Text style={styles.text}>&nbsp;Exit</Text></View>
            </Pressable>
        </View>
    );
}
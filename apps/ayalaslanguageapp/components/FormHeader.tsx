import { View, Text, Pressable } from 'react-native'
import React from 'react'
import { X } from "lucide-react-native";
import { Link, useRouter } from "expo-router";
import useTextStyles from '@/lib/useTextStyles';

interface FormHeaderProps {
    title: string;
    titleSize?: 'sm' | 'lg';
}

export function FormHeader({ title, titleSize = 'lg' }: FormHeaderProps) {
    const { styles } = useTextStyles();
    const router = useRouter();

    return (
        <View className="form-header">
            <Text style={[titleSize == 'lg' ? styles.h2 : styles.dimmedText, {flexWrap: 'wrap', maxWidth: 220}]}>{title}</Text>
            <Pressable className="actions-menu-link-button" onPress={() => router.replace('/')}>
                <View className='flex-row items-center justify-center'><X className="color-brand-primary" /><Text style={styles.text}>&nbsp;Exit</Text></View>
            </Pressable>
        </View>
    );
}
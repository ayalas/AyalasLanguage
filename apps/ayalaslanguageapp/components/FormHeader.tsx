import { View, Text, Pressable } from 'react-native'
import React from 'react'
import { X } from "lucide-react-native";
import { Link, useRouter } from "expo-router";
import useTextStyles from '@/lib/useTextStyles';

interface FormHeaderProps {
    title: string;
}

export function FormHeader({ title }: FormHeaderProps) {
    const { styles } = useTextStyles();
    const router = useRouter();

    return (
        <View className="form-header">
            <Text style={[styles.h1, {flexWrap: 'wrap', maxWidth: 230}]}>{title}</Text>
            <Pressable className="actions-menu-link-button" onPress={() => router.replace('/')}>
                <View className='flex-row items-center justify-center'><X className="color-brand-primary" /><Text style={styles.text}>&nbsp;Exit</Text></View>
            </Pressable>
        </View>
    );
}
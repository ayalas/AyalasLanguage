import { View, Text } from 'react-native'
import React from 'react'
import { X } from "lucide-react-native";
import { Link } from "expo-router";
import useTextStyles from '@/lib/useTextStyles';

interface FormHeaderProps
{
    title: string;
}

export function FormHeader ({title} :FormHeaderProps) {
    const { styles } = useTextStyles();
    
    return (
        <View className="form-header">
            <Text style={styles.h1}>{title}</Text>
            <Text style={[styles.text, { flexShrink: 0}]}>
                <Link href="/" className="actions-menu-link-button"><X />&nbsp;Exit</Link>
            </Text>
        </View>
    );
}
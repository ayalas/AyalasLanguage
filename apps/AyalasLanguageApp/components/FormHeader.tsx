import { View, Text } from 'react-native'
import React from 'react'
import { X } from "lucide-react-native";
import { Link } from "expo-router";

interface FormHeaderProps
{
    title: string;
}

export function FormHeader ({title} :FormHeaderProps) {
    return (
        <View className="form-header">
            <Text className="form-name h1">{title}</Text>
            <Text className="form-close-row">
                <Link href="/" className="actions-menu-link-button"><X />&nbsp;Exit</Link>
            </Text>
        </View>
    );
}
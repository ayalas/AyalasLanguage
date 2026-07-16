import { View, Button } from 'react-native'
import React from 'react'
import { useAuth } from '@/lib/AuthContext';
import { router } from 'expo-router';

export default function SecuredHeader() {
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        router.push('/login');
    }

    return (
        <View className="inline-row"><Button title="Logout" onPress={handleLogout} /></View>
    )
}
import { useAuth } from '@/lib/AuthContext';
import { useRouter, Tabs, usePathname } from 'expo-router'
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function PublicAuthLayout() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && pathname === "/login" && user != null) {
            router.replace({ pathname: "/" });
        }
    }, [user, loading]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: "#0F0D23" }}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    return (
        <Tabs screenOptions={{
            tabBarShowLabel: true,
            headerShown: false,
            tabBarItemStyle: {
                width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
            },
            tabBarStyle: {
                backgroundColor: "#0F0D23",
                borderRadius: 50,
                marginHorizontal: 20,
                marginBottom: 36,
                height: 152,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "#0F0D23",
            },
        }}>
            <Tabs.Screen name="login"
                options={{
                    title: "Log In"
                }} />
            <Tabs.Screen name="signup"
                options={{
                    title: "Sign Up"
                }} />
        </Tabs>
    )
}
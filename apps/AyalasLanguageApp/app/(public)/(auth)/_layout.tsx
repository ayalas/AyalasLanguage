import { useAuth } from '@/lib/AuthContext';
import { useRouter, Tabs, usePathname } from 'expo-router'
import { LogInIcon, UserIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

const TabIcon = ({
    focused,
    title,
}: {
    focused: boolean;
    title: string;
}) => (
    <View className="flex-1 flex flex-row items-center mt-4">
        {title === "Log In" && (
            <LogInIcon className={`text ${focused ? "" : "text-dimmed" }`} />
        ) || (
                <UserIcon className={`text ${focused ? "" : "text-dimmed" }`} />
            )}
        <Text
            className={`text text-nowrap ${focused ? "" : "text-dimmed" }`}>
            &nbsp;{title}
        </Text>
    </View>
);

export default function PublicAuthLayout() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    /* useEffect(() => {
        if (!loading && pathname === "/login" && user != null) {
            router.replace({ pathname: "/" });
        }
    }, [user, loading]); */

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: "#0F0D23" }}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    return (
        <Tabs screenOptions={{
            tabBarShowLabel: false,
            headerShown: false,
            tabBarStyle: {
                backgroundColor: "white",
                borderTopColor: "#0061FF1A",
                position: 'absolute',
                borderRadius: 20,
                borderTopWidth: 1,
                minHeight: 70,
                marginHorizontal: 24,
                marginBottom: 10,
                maxWidth: 350,
            }
        }}>
            <Tabs.Screen name="login"
                options={{
                    title: "Log In",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} title="Log In" />
                    ),
                }} />
            <Tabs.Screen name="signup"
                options={{
                    title: "Sign Up",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} title="Sign Up" />
                    ),
                }} />
        </Tabs>
    )
}
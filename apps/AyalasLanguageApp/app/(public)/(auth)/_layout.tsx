import { BG_DARK, BG_LIGHT } from '@/constants';
import { useAuth } from '@/lib/AuthContext';
import { Tabs } from 'expo-router'
import { LogInIcon, UserIcon } from 'lucide-react-native';
import { ActivityIndicator, View, Text, useColorScheme } from 'react-native';

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
    const { loading } = useAuth();
    const colorScheme = useColorScheme();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', backgroundColor: "#0F0D23" }}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    const isDark = colorScheme === 'dark';

    return (
        <Tabs screenOptions={{
            tabBarShowLabel: false,
            headerShown: false,
            tabBarStyle: {
                backgroundColor: isDark ? BG_DARK: BG_LIGHT,
                borderTopColor: "#dfe4ec",
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
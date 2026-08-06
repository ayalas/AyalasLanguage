import { BG_DARK, BG_LIGHT } from '@/constants';
import { useAuth } from '@/lib/AuthContext';
import useTextStyles from '@/lib/useTextStyles';
import { Tabs } from 'expo-router'
import { LogInIcon, UserIcon } from 'lucide-react-native';
import { ActivityIndicator, View, Text } from 'react-native';



export default function PublicAuthLayout() {
    const { loading } = useAuth();
    const { styles, isDark } = useTextStyles();

    const TabIcon = ({
        focused,
        title,
    }: {
        focused: boolean;
        title: string;
    }) => (
        <View style={{ 
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%'
        }}>
            {title === "Log In" && (
                <LogInIcon size={16} className={focused ? "color-brand-primary" : "color-brand-dimmed"} />
            ) || (
                    <UserIcon size={16} className={focused ? "color-brand-primary" : "color-brand-dimmed"} />
                )}
            <Text style={[focused? styles.text : styles.dimmedText, { marginLeft: 8 ,fontSize: 16, textAlign: 'center'}]}>
                {title}
            </Text>
        </View>
    );

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
                backgroundColor: isDark ? BG_DARK : BG_LIGHT,
                borderTopColor: "#dfe4ec",
                position: 'absolute',
                borderRadius: 20,
                borderTopWidth: 1,
                minHeight: 70,
                marginHorizontal: 5,
                marginBottom: 10,
                alignSelf: 'center',
                display: 'flex',
            },
            tabBarItemStyle: {width: 'auto', paddingHorizontal: 15},
            tabBarIconStyle: {  width: 200, height: 60 }
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
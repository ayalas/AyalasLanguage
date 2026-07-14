import { Tabs } from 'expo-router'

export default function PublicAuthLayout() {
  return (
    <Tabs screenOptions={{
            tabBarShowLabel: false,
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
                height: 52,
                position: "absolute",
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
import { SplashScreen, Stack } from "expo-router";
import "../global.css";
import axios from "axios";
import { AuthProvider } from "@/lib/AuthContext";
import { useFonts } from 'expo-font';
import { useEffect } from "react";

axios.defaults.baseURL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export default function RootLayout() {

  const [fontsLoaded, error] = useFonts({
    "Tajawal-Black": require('../assets/fonts/Tajawal-Black.ttf'),
    "Tajawal-Bold": require('../assets/fonts/Tajawal-Bold.ttf'),
    "Tajawal-ExtraBold": require('../assets/fonts/Tajawal-ExtraBold.ttf'),
    "Tajawal-ExtraLight": require('../assets/fonts/Tajawal-ExtraLight.ttf'),
    "Tajawal-Light": require('../assets/fonts/Tajawal-Light.ttf'),
    "Tajawal-Medium": require('../assets/fonts/Tajawal-Medium.ttf'),
    "Tajawal-Regular": require('../assets/fonts/Tajawal-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  )
}

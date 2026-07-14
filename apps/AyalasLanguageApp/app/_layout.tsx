import { Stack } from "expo-router";
import "../global.css";
import axios from "axios";
import { AuthProvider } from "@/lib/AuthContext";

axios.defaults.baseURL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

export default function RootLayout() {

  return (
    <AuthProvider>
      <Stack screenOptions={{headerShown: false}} />
    </AuthProvider>
  )
}

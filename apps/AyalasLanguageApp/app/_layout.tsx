import { Stack } from "expo-router";
import "../global.css";
import axios from "axios";

export default function RootLayout() {

  axios.defaults.baseURL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
  
  return <Stack />;
}

import axios from 'axios';
import { Slot } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SecuredLayout() {
  axios.defaults.baseURL = process.env.BACKEND_BASE_URL;
  
  return (
    <SafeAreaView className="root">
      <Slot/>
    </SafeAreaView>
  )
}
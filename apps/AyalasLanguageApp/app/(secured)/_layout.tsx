import { Slot } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SecuredLayout() {
  
  return (
    <SafeAreaView className="root">
      <Slot/>
    </SafeAreaView>
  )
}
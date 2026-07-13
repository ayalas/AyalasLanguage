import { Slot } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';


export default function PublicLayout() {
  return (
    <SafeAreaView className="root-container root">
      <Slot/>
    </SafeAreaView>
  )
}
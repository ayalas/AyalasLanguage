import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView className="root">
      <View className="home-container">
        <Text className="learning-path-empty text">It looks like there are not yet any lessons in this language.</Text>
      </View>
    </SafeAreaView>
  );
}

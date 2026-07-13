import { BRAND_NAME } from "@/constants";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      className="flex-1 justify-center items-center px-10"
    >
      <Text>{BRAND_NAME} is a place to keep learning the language we have set to learn with ever more new exercises, as well as practice our previous mistakes.</Text>
    </View>
  );
}

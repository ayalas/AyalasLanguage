import { View, Text } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router';

export default function ConfirmEmailScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();

  return (
    <View>
      <Text>Requires deep linking: {token}</Text>
    </View>
  )
}
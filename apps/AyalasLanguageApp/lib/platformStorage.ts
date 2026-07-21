import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';



export async function saveToStorage(key: string, token: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, token)
  }
  else {
    await SecureStore.setItemAsync(key, token);
  }
}

export async function getFromStorage(key: string) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  else {
    return await SecureStore.getItemAsync(key);
  }
}

export async function removeFromStorage(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  }
  else {
    await SecureStore.deleteItemAsync(key);
  }
}
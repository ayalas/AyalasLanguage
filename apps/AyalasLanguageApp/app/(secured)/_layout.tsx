import { useAuth } from '@/lib/AuthContext';
import { router, Stack, usePathname } from 'expo-router'
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';


export default function SecuredLayout() {
  const pathname = usePathname(); // Gets the current path, e.g., "/profile"
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login and pass the current pathname as a query param
      router.replace({
        pathname: "/login",
        params: { from: pathname }
      });
    }
  }, [user, loading, pathname]);

  if (loading) {
    return (
      <View className="bg-white h-full flex justify-center items-center">
        <ActivityIndicator className="text-primary-300" size="large" />
      </View>
    );
  }

  if (user) {
    return (
       <Stack screenOptions={{ headerShown: false }} />
    )
  }
}
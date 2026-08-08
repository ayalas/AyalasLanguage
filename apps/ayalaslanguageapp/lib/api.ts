import { create } from 'axios';
import { Platform } from 'react-native';
import { getFromStorage } from './platformStorage';
import { STORAGE_TOKEN_KEY } from '@/constants';

export const getAPIBaseUrl = () => {
  const stackEnv = process.env.EXPO_PUBLIC_STACK_ENV || 'Development';
  const isDeployed = stackEnv.toLowerCase() !== 'development';

  // If we are on Web AND it's a production build (built by Docker)
  if (Platform.OS === 'web' && isDeployed) {
    return '/mobile';
  }

  // Otherwise (Local Dev or Native App), use the .env value
  return process.env.EXPO_PUBLIC_BACKEND_BASE_URL;
};

const api = create({
  baseURL: getAPIBaseUrl(),
});

// Interceptor to add the token to every request
api.interceptors.request.use(async (config) => {
  const token = await getFromStorage(STORAGE_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
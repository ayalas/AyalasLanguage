import { create } from 'axios';
import { getFromStorage } from './platformStorage';
import { STORAGE_TOKEN_KEY } from '@/constants';

const api = create({
  baseURL: process.env.EXPO_PUBLIC_BACKEND_BASE_URL,
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
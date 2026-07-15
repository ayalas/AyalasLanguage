import { create } from 'axios';
import { getToken } from './authStorage';

const api = create({
  baseURL: process.env.EXPO_PUBLIC_BACKEND_BASE_URL,
});

// Interceptor to add the token to every request
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
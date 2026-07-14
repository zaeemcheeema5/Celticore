import { api } from './client';

export const authService = {
  login: (credentials: any) => api.post('/api/auth/login', credentials),
  signup: (userData: any) => api.post('/api/auth/signup', userData),
  getProfile: () => api.get('/api/auth/profile')
};

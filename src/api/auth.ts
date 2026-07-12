import { api } from './client';

export const authService = {
  login: (credentials: any) => api.post('/api/auth/login', credentials),
  signup: (userData: any) => api.post('/api/auth/signup', userData),
  getProfile: () => api.get('/api/auth/profile'),
  // Cookie-based auth means there's nothing on the client to just "forget"
  // anymore — this actually clears the httpOnly cookie server-side.
  logout: () => api.post('/api/auth/logout', {})
};

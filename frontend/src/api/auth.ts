import { api } from './client';

export const authService = {
  login: (credentials: any) => api.post('/api/auth/login', credentials),
  signup: (userData: any) => api.post('/api/auth/signup', userData),
  getProfile: () => api.get('/api/auth/profile'),
  // Cookie-based auth means there's nothing on the client to just "forget"
  // anymore — this actually clears the httpOnly cookie server-side.
  logout: () => api.post('/api/auth/logout', {}),

  // Password recovery flow — previously called directly via hardcoded
  // axios calls to http://localhost:5000 in AuthModal.tsx, which meant
  // every environment (including production) tried to hit the developer's
  // own machine. Routed through the shared `api` client instead, so it
  // respects API_URL the same way login/signup always have.
  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),

  verifyOtp: (email: string, otp: string) =>
    api.post('/api/auth/verify-otp', { email, otp }),

  resetPassword: (email: string, otp: string, password: string) =>
    api.post('/api/auth/reset-password', { email, otp, password })
};
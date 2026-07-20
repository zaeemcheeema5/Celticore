import { api } from './client';

export const settingsService = {
  getSettings: () => api.get('/api/settings'),
  updateSettings: (settings: any) => api.put('/api/settings', settings),
  getUsers: () => api.get('/api/settings/users'),
  createAdminProfile: (creds: any) => api.post('/api/settings/admins', creds),
  deleteUser: (id: string | number) => api.delete(`/api/settings/users/${id}`),
  updateAdminCredentials: (creds: any) => api.put('/api/settings/admin/credentials', creds)
};

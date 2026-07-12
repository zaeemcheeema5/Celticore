import { api } from './client';
import { DashboardStats } from '../types';

export const dashboardService = {
  getStats: (): Promise<DashboardStats> => api.get('/api/dashboard')
};

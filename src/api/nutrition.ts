import { api } from './client';
import { NutritionRequest } from '../types';

export const nutritionService = {
  submitRequest: (requestData: Omit<NutritionRequest, 'id' | 'status' | 'admin_notes' | 'created_at'>): Promise<NutritionRequest> => 
    api.post('/api/nutrition', requestData),
  getAllRequests: (): Promise<NutritionRequest[]> => 
    api.get('/api/nutrition'),
  getRequest: (id: number | string): Promise<NutritionRequest> => 
    api.get(`/api/nutrition/${id}`),
  updateStatus: (id: number | string, status: 'pending' | 'completed' | 'cancelled'): Promise<NutritionRequest> => 
    api.put(`/api/nutrition/${id}/status`, { status }),
  addNotes: (id: number | string, admin_notes: string): Promise<NutritionRequest> => 
    api.put(`/api/nutrition/${id}/notes`, { admin_notes })
};

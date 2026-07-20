import { api } from './client';
import { ContactMessage } from '../types';

export const contactService = {
  sendMessage: (messageData: { name: string; email: string; subject: string; message: string }): Promise<ContactMessage> => 
    api.post('/api/contact', messageData),
  getAllMessages: (): Promise<ContactMessage[]> => 
    api.get('/api/contact'),
  markAsRead: (id: number | string): Promise<any> => 
    api.put(`/api/contact/${id}/read`, {}),
  deleteMessage: (id: number | string): Promise<any> => 
    api.delete(`/api/contact/${id}`)
};

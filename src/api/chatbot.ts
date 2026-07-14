import { api } from './client';

export interface ChatHistoryEntry {
  sender: 'user' | 'bot';
  text: string;
}

export const chatbotService = {
  startSession: (): Promise<{ sessionId: string }> =>
    api.post('/api/chat/start', {}),

  sendMessage: (sessionId: string, message: string): Promise<{ response: string }> =>
    api.post('/api/chat/message', { sessionId, message }),

  getHistory: async (sessionId: string): Promise<ChatHistoryEntry[]> => {
    const result = await api.get(`/api/chat/history/${sessionId}`);

    // Backend returns { success: true, messages: [{ role, message, ... }] }.
    // Guard against unexpected shapes so the widget never gets handed
    // something non-array (that's what was crashing the page).
    const rows = Array.isArray(result?.messages) ? result.messages : [];

    return rows.map((row: any) => ({
      sender: row.role === 'assistant' ? 'bot' : 'user',
      text: row.message
    }));
  }
};
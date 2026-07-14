import { api } from './client';

export interface ChatHistoryEntry {
  sender: 'user' | 'bot';
  text: string;
}

export const chatbotService = {
  startSession: (): Promise<{ sessionId: string; sessionToken: string }> =>
    api.post('/api/chat/start', {}),

  sendMessage: (sessionId: string, message: string): Promise<{ response: string }> =>
    api.post('/api/chat/message', { sessionId, message }),

  // sessionToken is required now — the sessionId alone is a sequential,
  // guessable integer, and the backend rejects history reads that don't
  // present the matching opaque token issued at session start.
  getHistory: async (sessionId: string, sessionToken: string): Promise<ChatHistoryEntry[]> => {
    const result = await api.get(`/api/chat/history/${sessionId}?token=${encodeURIComponent(sessionToken)}`);

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
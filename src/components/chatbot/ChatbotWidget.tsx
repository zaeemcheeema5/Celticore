import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User as UserIcon, Loader } from 'lucide-react';
import { chatbotService } from '../../api/chatbot';
import { ChatMessage } from '../../types';

export const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize session on mount
  useEffect(() => {
    const startSession = async () => {
      try {
        const storedSession = sessionStorage.getItem('chat_session_id');
        if (storedSession) {
          setSessionId(storedSession);
          try {
            const history = await chatbotService.getHistory(storedSession);
            // Defensive: never hand the renderer anything but an array,
            // even if the API response shape changes unexpectedly.
            setMessages(Array.isArray(history) ? history : []);
          } catch (historyErr) {
            console.error("Failed to load chat history", historyErr);
            // Stored session exists but history couldn't be loaded (e.g.
            // it's stale/invalid server-side) — fall back to a fresh
            // greeting instead of leaving the widget in a broken state.
            setMessages([
              { sender: 'bot', text: 'Hi! I am your Celti Core fitness assistant. Ask me anything about proteins, creatine, or workouts!' }
            ]);
          }
        } else {
          const result = await chatbotService.startSession();
          const newSessionId = String(result.sessionId);
          setSessionId(newSessionId);
          sessionStorage.setItem('chat_session_id', newSessionId);
          // Initial greeting
          setMessages([
            { sender: 'bot', text: 'Hi! I am your Celti Core fitness assistant. Ask me anything about proteins, creatine, or workouts!' }
          ]);
        }
      } catch (err) {
        console.error("Failed to initialize chatbot", err);
      }
    };
    startSession();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionId) return;

    const userMsg = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const result = await chatbotService.sendMessage(sessionId, userMsg);
      setMessages((prev) => [...prev, { sender: 'bot', text: result.response }]);
    } catch (err) {
      console.error("Failed to send message", err);
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Sorry, I encountered an issue. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div
          className="w-80 sm:w-96 h-[450px] bg-[#090909] border border-white/10 rounded-lg flex flex-col justify-between shadow-2xl mb-4 overflow-hidden"
          style={{
            animation: "fade-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both"
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#0d0d0d] border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Bot size={14} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-white tracking-wider" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Celti Core Assistant
                </h3>
                <p className="text-[9px] text-emerald-400">Online & Ready</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-white/40 hover:text-white rounded hover:bg-white/5 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#060606] scrollbar-hide">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] ${
                    msg.sender === 'user'
                      ? 'bg-emerald-500 text-black'
                      : 'bg-white/5 border border-white/10 text-white/60'
                  }`}
                >
                  {msg.sender === 'user' ? <UserIcon size={11} /> : <Bot size={11} />}
                </div>

                {/* Bubble */}
                <div
                  className={`p-2.5 text-xs rounded leading-relaxed font-light ${
                    msg.sender === 'user'
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-white'
                      : 'bg-[#0d0d0d] border border-white/5 text-white/80'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                  <Bot size={11} />
                </div>
                <div className="p-2.5 bg-[#0d0d0d] border border-white/5 text-white/40 text-xs flex items-center gap-1.5">
                  <Loader size={11} className="animate-spin text-emerald-400" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-[#0d0d0d] border-t border-white/5 flex gap-2">
            <input
              type="text"
              placeholder="Ask a question..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3 py-2 text-xs text-white placeholder-white/25 border border-white/10 focus:border-emerald-500/60 bg-black outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-2 bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Send size={12} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-350 cursor-pointer hover:scale-105"
        style={{
          background: "linear-gradient(135deg, #10B981, #059669)",
          color: "#000",
          boxShadow: "0 4px 20px rgba(16, 185, 129, 0.4)"
        }}
        title="Chat with Assistant"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </button>
    </div>
  );
};
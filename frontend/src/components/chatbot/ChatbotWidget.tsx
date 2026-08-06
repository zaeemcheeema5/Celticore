import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User as UserIcon, Loader, Star, ChevronRight, Package } from 'lucide-react';
import { chatbotService } from '../../api/chatbot';
import { API_URL } from '../../api/client';

// Shape of each item in the `products` array the backend now sends back
// alongside a reply whenever it does a catalog/budget search (see
// chatController.js searchProducts/budgetProducts — formattedProducts).
interface ChatProduct {
  id: string | number;
  name: string;
  subtitle?: string;
  image?: string;
  price: number;
  original_price?: number;
  badge?: string;
  rating?: number;
  category?: string;
}

interface DisplayMessage {
  sender: 'user' | 'bot';
  text: string;
  products?: ChatProduct[];
}

interface ChatbotWidgetProps {
  // Optional: lets the parent (App.tsx) wire product cards up to the same
  // product-details modal used everywhere else on the site, e.g.
  // <ChatbotWidget onProductClick={(p) => setSelectedProduct(p)} />
  // Without it, product cards still render with full info, just without
  // the "View Product" click-through.
  onProductClick?: (product: ChatProduct) => void;
}

// The backend still sends product lines inline in the reply text as
// "Name - €Price" (kept for backward compatibility / session-context
// parsing on the server). Now that we render those same products as
// proper image cards below the bubble, we strip the raw lines back out
// of the displayed text so they're not shown twice.
const PRODUCT_LINE_REGEX = /^(.*?)\s-\s€\d+(\.\d+)?$/;

function stripProductLines(text: string, hasProducts: boolean): string {
  if (!hasProducts) return text;
  return text
    .split('\n')
    .filter((line) => !PRODUCT_LINE_REGEX.test(line.trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function resolveImageSrc(image?: string): string | null {
  if (!image) return null;
  return image.startsWith('http') ? image : `${API_URL}${image}`;
}

const ProductCard: React.FC<{ product: ChatProduct; onClick?: () => void }> = ({ product, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const imgSrc = resolveImageSrc(product.image);
  const hasDiscount = !!product.original_price && product.original_price > product.price;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-2.5 bg-[#0d0d0d] border border-white/8 rounded-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]' : ''
      }`}
    >
      <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center">
        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Package size={16} className="text-white/20" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-semibold text-white truncate">{product.name}</p>
          {product.badge && (
            <span className="shrink-0 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              {product.badge}
            </span>
          )}
        </div>
        {product.subtitle && (
          <p className="text-[9px] text-white/35 truncate mt-0.5">{product.subtitle}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-bold text-emerald-400">€{product.price}</span>
          {hasDiscount && (
            <span className="text-[9px] text-white/30 line-through">€{product.original_price}</span>
          )}
          {product.rating ? (
            <span className="flex items-center gap-0.5 text-[9px] text-amber-400">
              <Star size={9} fill="currentColor" />
              {product.rating}
            </span>
          ) : null}
        </div>
      </div>

      {onClick && <ChevronRight size={14} className="text-white/25 shrink-0" />}
    </div>
  );
};

const GREETING_TEXT =
  "Hi, welcome to Celti Core! Ask me about proteins, creatine, pre-workout, or workouts \u2014 or say \"talk to a human\" any time to reach our team.";

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ onProductClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session on mount
  useEffect(() => {
    const startSession = async () => {
      try {
        const storedSession = sessionStorage.getItem('chat_session_id');
        const storedToken = sessionStorage.getItem('chat_session_token');
        if (storedSession && storedToken) {
          setSessionId(storedSession);
          try {
            const history = await chatbotService.getHistory(storedSession, storedToken);
            // Defensive: never hand the renderer anything but an array,
            // even if the API response shape changes unexpectedly.
            // Note: historical messages don't carry `products` — those are
            // only attached to a live reply, not persisted server-side —
            // so a reloaded product-search reply falls back to plain text.
            setMessages(Array.isArray(history) ? history : []);
          } catch (historyErr) {
            console.error('Failed to load chat history', historyErr);
            // Stored session exists but history couldn't be loaded (e.g.
            // it's stale/invalid server-side) — fall back to a fresh
            // greeting instead of leaving the widget in a broken state.
            setMessages([{ sender: 'bot', text: GREETING_TEXT }]);
          }
        } else {
          const result = await chatbotService.startSession();
          const newSessionId = String(result.sessionId);
          setSessionId(newSessionId);
          sessionStorage.setItem('chat_session_id', newSessionId);
          sessionStorage.setItem('chat_session_token', result.sessionToken);
          setMessages([{ sender: 'bot', text: GREETING_TEXT }]);
        }
      } catch (err) {
        console.error('Failed to initialize chatbot', err);
      }
    };
    startSession();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, loading]);

  // Focus the input whenever the panel opens, and clear the unread pulse
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionId) return;

    const userMsg = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const result: any = await chatbotService.sendMessage(sessionId, userMsg);
      const products: ChatProduct[] | undefined =
        Array.isArray(result.products) && result.products.length > 0 ? result.products : undefined;

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: stripProductLines(result.response, !!products),
          products,
        },
      ]);

      if (!isOpen) setHasUnread(true);
    } catch (err) {
      console.error('Failed to send message', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: "Sorry, I ran into an issue there \u2014 please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end max-w-[calc(100vw-2rem)]">
      {/* Chat Window */}
      {isOpen && (
        <div
          className="w-[calc(100vw-2rem)] max-w-[24rem] sm:w-[26rem] h-[75vh] max-h-[560px] bg-[#090909] border border-white/10 rounded-xl flex flex-col justify-between shadow-2xl mb-3 sm:mb-4 overflow-hidden"
          style={{
            animation: 'fade-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(16,185,129,0.06)',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between shrink-0"
            style={{ background: 'linear-gradient(135deg, #0d0d0d 0%, #0a0f0d 100%)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Bot size={15} />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0d0d0d]" />
              </div>
              <div>
                <h3
                  className="text-xs font-black uppercase text-white tracking-wider"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Celti Core Assistant
                </h3>
                <p className="text-[9px] text-emerald-400 font-medium">Online & Ready to Help</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-white/40 hover:text-white rounded-md hover:bg-white/5 cursor-pointer transition-colors"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#060606] scrollbar-hide">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse max-w-[85%]' : 'max-w-[92%]'
                }`}
                style={{ animation: 'fade-up 0.3s cubic-bezier(0.16,1,0.3,1) both' }}
              >
                {/* Avatar */}
                <div
                  className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] mt-0.5 ${
                    msg.sender === 'user'
                      ? 'bg-emerald-500 text-black'
                      : 'bg-white/5 border border-white/10 text-white/60'
                  }`}
                >
                  {msg.sender === 'user' ? <UserIcon size={11} /> : <Bot size={11} />}
                </div>

                {/* Bubble + product cards */}
                <div className="flex flex-col gap-2 min-w-0">
                  {msg.text && (
                    <div
                      className={`p-2.5 text-xs rounded-lg leading-relaxed font-light whitespace-pre-line ${
                        msg.sender === 'user'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-white'
                          : 'bg-[#0d0d0d] border border-white/5 text-white/80'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}

                  {msg.products && msg.products.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      {msg.products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onClick={onProductClick ? () => onProductClick(product) : undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div
                className="flex gap-2.5 max-w-[85%]"
                style={{ animation: 'fade-up 0.25s ease both' }}
              >
                <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 mt-0.5">
                  <Bot size={11} />
                </div>
                <div className="p-2.5 bg-[#0d0d0d] border border-white/5 rounded-lg text-white/40 text-xs flex items-center gap-1.5">
                  <Loader size={11} className="animate-spin text-emerald-400" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-[#0d0d0d] border-t border-white/5 flex gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask a question..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3 py-2.5 text-xs text-white placeholder-white/25 border border-white/10 focus:border-emerald-500/60 bg-black outline-none rounded-md transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-black disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer rounded-md shrink-0"
              aria-label="Send message"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-350 cursor-pointer hover:scale-105 shrink-0"
        style={{
          background: 'linear-gradient(135deg, #10B981, #059669)',
          color: '#000',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
        }}
        title="Chat with Assistant"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {/* Gentle attention pulse while closed and unread */}
        {!isOpen && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: 'rgba(16,185,129,0.5)', animationDuration: '2.2s' }}
          />
        )}
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
        {!isOpen && hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-black" />
        )}
      </button>
    </div>
  );
};
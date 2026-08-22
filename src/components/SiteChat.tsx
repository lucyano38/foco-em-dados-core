import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export default function SiteChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Olá! Sou o Luciano, consultor de IA da Foco em Dados. Como posso ajudar?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    let id = localStorage.getItem('hermesSessionId');
    if (!id) {
      id = 'site_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('hermesSessionId', id);
    }
    setSessionId(id);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const appendBot = useCallback((text: string) => {
    setMessages(prev => [...prev, { sender: 'bot', text }]);
  }, []);

  const postToBackend = useCallback(async (payload: Record<string, unknown>) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      return data;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text }]);
    setLoading(true);

    try {
      const payload = {
        message: text,
        phone: sessionId || 'Visitante_Site',
        source: 'Site',
      };
      const data = await postToBackend(payload);

      const reply =
        typeof data === 'string' ? data : data?.reply || data?.answer || data?.text;

      if (reply && typeof reply === 'string') {
        appendBot(reply);
      } else if (reply && typeof reply === 'object') {
        appendBot(JSON.stringify(reply));
      } else {
        appendBot('Desculpe, não consegui processar a resposta.');
      }
    } catch (err) {
      console.error('Erro no SiteChat:', err);
      appendBot('Ops, falha na conexão. Tente novamente ou nos chame no WhatsApp/Telegram.');
    } finally {
      setLoading(false);
      try { inputRef.current?.focus(); } catch {}
    }
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] font-sans">
      {isOpen ? (
        <div className="glassmorphism w-[340px] h-[460px] rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-[#fabd00] to-[#ffc107] text-[#121414] p-4 font-bold flex justify-between items-center">
            <span className="flex items-center gap-2">💬 Luciano · Foco em Dados</span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
              aria-label="Fechar chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#18191c]">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl text-sm max-w-[85%] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-[#fabd00] to-[#ffc107] text-[#121414] ml-auto font-medium rounded-br-none'
                    : 'bg-[#2a2c31] text-[#e3e2e2] mr-auto rounded-bl-none border border-white/10'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded-xl text-sm bg-[#2a2c31] text-[#d4c5ab] mr-auto rounded-bl-none border border-white/10 w-fit">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fabd00] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fabd00] animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fabd00] animate-bounce [animation-delay:0.3s]" />
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-white/10 flex gap-2 bg-[#18191c]">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Digite sua mensagem..."
              className="input-mystic flex-1 h-10 px-3 text-sm text-[#e3e2e2] placeholder:text-[#d4c5ab]/50"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="btn-glow w-10 h-10 rounded-lg flex items-center justify-center disabled:opacity-50"
              aria-label="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          id="site-chat-open-btn"
          onClick={toggleChat}
          className="btn-glow fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full flex items-center justify-center"
          aria-label="Abrir chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

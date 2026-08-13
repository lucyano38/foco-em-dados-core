import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

const N8N_WEBHOOK_URL = 'https://focoemdados2.app.n8n.cloud/webhook/site-chat';

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

  const postToN8n = async (payload: Record<string, unknown>) => {
    const direct = fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(9000),
    });
    const proxy = fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(9000),
    });

    // Tenta direto no n8n primeiro; se falhar (CORS/rede), usa o proxy local.
    const results = await Promise.allSettled([direct, proxy]);
    const ok = results.find(
      (r) => r.status === 'fulfilled' && (r.value as Response).ok
    ) as PromiseFulfilledResult<Response> | undefined;

    if (ok) {
      const data = await ok.value.json().catch(() => ({}));
      return data;
    }

    const first = results[0];
    if (first.status === 'fulfilled') {
      const data = await first.value.json().catch(() => ({}));
      return data;
    }
    throw new Error('n8n indisponível');
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const payload = {
        message: userMsg,
        phone: sessionId || 'Visitante_Site',
        source: 'Site',
      };
      const data = await postToN8n(payload);
      if (data && data.reply) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Desculpe, não consegui processar a resposta.' }]);
      }
    } catch (err) {
      console.error('Erro no SiteChat:', err);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Ops, falha na conexão. Tente novamente ou nos chame no Telegram.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] font-sans">
      {isOpen ? (
        <div className="glassmorphism w-[340px] h-[460px] rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-[#fabd00] to-[#ffc107] text-[#121414] p-4 font-bold flex justify-between items-center">
            <span className="flex items-center gap-2">💬 Luciano · Foco em Dados</span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Fechar chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#121414]/80">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl text-sm max-w-[85%] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-[#fabd00] to-[#ffc107] text-[#121414] ml-auto font-medium rounded-br-none'
                    : 'bg-white/5 text-[#e3e2e2] mr-auto rounded-bl-none border border-white/10'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded-xl text-sm bg-white/5 text-[#d4c5ab] mr-auto rounded-bl-none border border-white/10 w-fit">
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fabd00] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fabd00] animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fabd00] animate-bounce [animation-delay:0.3s]" />
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-white/10 flex gap-2 bg-[#121414]/80">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua mensagem..."
              className="input-mystic flex-1 h-10 px-3 text-sm text-[#e3e2e2] placeholder:text-[#d4c5ab]/50"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="btn-glow w-10 h-10 rounded-lg flex items-center justify-center disabled:opacity-50 cursor-pointer"
              aria-label="Enviar mensagem"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="btn-glow w-14 h-14 rounded-full flex items-center justify-center cursor-pointer"
          aria-label="Abrir chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export default function HermesChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Olá! Sou o Hermes, consultor da Foco em Dados. Como posso te ajudar hoje?' }
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

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch('https://focoemdados2.app.n8n.cloud/webhook/site-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          phone: sessionId || 'Visitante_Site',
          source: 'Site'
        })
      });

      const data = await response.json();
      if (data && data.reply) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Desculpe, não consegui processar a resposta.' }]);
      }
    } catch (err) {
      console.error('Erro no Chat Hermes:', err);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Ops, falha na conexão. Tente novamente ou nos chame no Telegram.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[9999] font-sans">
      {isOpen ? (
        <div className="w-[340px] h-[450px] bg-slate-900 border border-amber-400/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4">
          <div className="bg-amber-400 text-slate-950 p-4 font-bold flex justify-between items-center">
            <span className="flex items-center gap-2">💬 Hermes - Foco em Dados</span>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-xl text-sm max-w-[85%] leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-amber-400 text-slate-950 ml-auto font-medium rounded-br-none' 
                    : 'bg-white/10 text-slate-200 mr-auto rounded-bl-none border border-white/5'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="p-3 rounded-xl text-sm max-w-[85%] bg-white/10 text-amber-400 mr-auto rounded-bl-none animate-pulse">
                Hermes está digitando...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-slate-900 border-t border-white/10 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua mensagem..." 
              className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-6 py-3.5 rounded-full font-bold shadow-[0_4px_20px_rgba(255,193,7,0.4)] flex items-center gap-2.5 transition-all hover:scale-105 cursor-pointer"
        >
          <MessageCircle className="w-5 h-5 fill-slate-950" />
          Fale com o Hermes
        </button>
      )}
    </div>
  );
}

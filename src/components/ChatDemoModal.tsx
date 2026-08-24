import { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { TELEGRAM_URL } from '../lib/contact';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface Message {
  from: 'user' | 'bot';
  text: string;
}

const QUICK_PROMPTS = [
  'Qual o valor da automação?',
  'Como funciona a integração com Telegram/n8n?',
  'Quero agendar uma demonstração',
];

const AUTO_REPLIES: Record<string, string> = {
  'Qual o valor da automação?':
    'Os valores variam por fluxo e volume. Posso enviar uma proposta enxuta; se quiser, já abro o comparador antes/depois.',
  'Como funciona a integração com Telegram/n8n?':
    'Usamos n8n para orquestrar Telegram/WhatsApp/Webhooks. O agente qualifica e dispara ações automáticas 24/7.',
  'Quero agendar uma demonstração':
    'Perfeito. Posso agendar por aqui ou, se preferir, já te direciono para o atendimento no Telegram/WhatsApp.',
};

const FALLBACK_REPLY =
  'Recebi sua mensagem. Nosso agente vai responder em instantes. Se quiser atendimento humano, use o WhatsApp/Telegram.';

export default function ChatDemoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: 'Olá! Sou o Agente Luciano. Faça uma pergunta ou use os botões rápidos para testar a automação.' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMessages([{ from: 'bot', text: 'Olá! Sou o Agente Luciano. Faça uma pergunta ou use os botões rápidos para testar a automação.' }]);
      setInput('');
      setTyping(false);
    }
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    setMessages(prev => [...prev, { from: 'user', text: trimmed }]);
    setInput('');
    setTyping(true);

    const delay = 900 + Math.random() * 1000;
    setTimeout(() => {
      const reply = AUTO_REPLIES[trimmed] || FALLBACK_REPLY;
      setMessages(prev => [...prev, { from: 'bot', text: reply }]);
      setTyping(false);
    }, delay);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl glass-card rounded-3xl border border-white/10 bg-[#121414]/90 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div>
            <p className="text-xs font-bold text-[#ffe4af] uppercase tracking-wider">Demonstração</p>
            <p className="text-sm text-[#e3e2e2]">Simulação do Agente Luciano</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center" aria-label="Fechar">
            <X className="w-4 h-4 text-[#d4c5ab]" />
          </button>
        </div>

        <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-[#0f1113] min-h-[260px] max-h-[360px]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl text-sm max-w-[85%] leading-relaxed ${
                msg.from === 'user'
                  ? 'ml-auto bg-gradient-to-r from-[#fabd00] to-[#ffc107] text-[#121414] rounded-br-none font-medium'
                  : 'mr-auto bg-[#1e1f23] text-[#e3e2e2] rounded-bl-none border border-white/10'
              }`}
            >
              {msg.text}
            </div>
          ))}
          {typing && (
            <div className="mr-auto p-3 rounded-2xl text-sm bg-[#1e1f23] text-[#d4c5ab] rounded-bl-none border border-white/10 w-fit">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fabd00] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#fabd00] animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#fabd00] animate-bounce [animation-delay:0.3s]" />
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="p-3 border-t border-white/10 flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((q) => (
            <Button
              key={q}
              variant="secondary"
              size="sm"
              onClick={() => send(q)}
              className="h-8 px-3 rounded-xl text-xs"
            >
              {q}
            </Button>
          ))}
        </div>

        <div className="p-3 border-t border-white/10 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => send(input)}
            disabled={typing}
            aria-label="Enviar mensagem"
            className="w-10 h-10"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-3 pt-0">
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="block w-full text-center h-10 rounded-xl bg-gradient-to-r from-[#fabd00] to-[#ffc107] text-[#121414] text-xs font-bold"
          >
            Abrir Telegram
          </a>
        </div>
      </div>
    </div>
  );
}

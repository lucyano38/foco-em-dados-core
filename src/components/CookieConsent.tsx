import { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';

const COOKIE_KEY = 'cookies_accepted';

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_KEY);
      if (stored !== 'true') {
        const timer = setTimeout(() => setIsOpen(true), 1200);
        return () => clearTimeout(timer);
      } else {
        setAccepted(true);
      }
    } catch {
      /* storage indisponível — não exibe banner */
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(COOKIE_KEY, 'true');
    } catch {
      /* ignore */
    }
    setAccepted(true);
    setIsOpen(false);
  };

  const close = () => {
    setIsOpen(false);
  };

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[9998] w-[calc(100%-2rem)] max-w-2xl ${!isOpen || accepted ? 'pointer-events-none' : ''}`}>
      {isOpen && !accepted ? (
        <div
          className="glassmorphism rounded-2xl px-5 py-4 flex items-center gap-4 pointer-events-auto"
          role="dialog"
          aria-label="Aviso de cookies"
        >
          <div className="w-10 h-10 rounded-xl bg-[#fabd00]/10 border border-[#fabd00]/30 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 text-[#fabd00]" />
          </div>
          <p className="text-xs leading-relaxed text-[#e3e2e2] flex-1">
            Usamos cookies para garantir o funcionamento do site, medir audiência e exibir anúncios
            (Google AdSense). Ao continuar, você concorda com nossa{' '}
            <a href="/politica-de-privacidade" className="text-[#fabd00] hover:underline">Política de Privacidade</a>{' '}
            e <a href="/termos-de-uso" className="text-[#fabd00] hover:underline">Termos de Uso</a>.
          </p>
          <button
            onClick={accept}
            className="btn-glow h-9 px-4 rounded-lg text-xs font-bold text-[#121414] whitespace-nowrap cursor-pointer"
          >
            Aceitar e Continuar
          </button>
          <button
            onClick={close}
            aria-label="Fechar aviso de cookies"
            className="text-[#d4c5ab]/60 hover:text-[#e3e2e2] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

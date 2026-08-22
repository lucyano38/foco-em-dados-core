import { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';

const COOKIE_KEY = 'cookie_accepted';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_KEY);
      if (stored === 'true') {
        setIsVisible(false);
        return;
      }
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    } catch {
      setIsVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(COOKIE_KEY, 'true');
    } catch {
      // storage indisponível
    }
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4">
      <div
        className="glassmorphism rounded-2xl p-4 flex items-center gap-4 border border-outline-variant/40 pointer-events-auto max-w-xl w-full"
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
          onClick={accept}
          aria-label="Fechar aviso de cookies"
          className="text-[#d4c5ab]/60 hover:text-[#e3e2e2] transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

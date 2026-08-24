import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';

const COOKIE_KEY = 'cookie_consent';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search.includes('cookies=off')) {
        localStorage.setItem(COOKIE_KEY, 'dismissed');
        setIsVisible(false);
        return;
      }
      const stored = localStorage.getItem(COOKIE_KEY);
      if (stored === 'dismissed') {
        setIsVisible(false);
        return;
      }
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    } catch {
      setIsVisible(true);
    }
  }, []);

  const close = () => {
    try {
      localStorage.setItem(COOKIE_KEY, 'dismissed');
    } catch {
      // storage indisponível
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-2xl z-[9999]">
      <div className="bg-[#201f21] border border-[#3b494b]/60 rounded-2xl shadow-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#fabd00]/10 border border-[#fabd00]/30 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 text-[#fabd00]" />
          </div>
          <p className="text-sm leading-relaxed text-[#e3e2e2]">
            Usamos cookies para garantir o funcionamento do site, medir audiência e exibir anúncios
            (Google AdSense). Ao continuar, você concorda com nossa{' '}
            <a href="/politica-de-privacidade" onClick={close} className="text-[#fabd00] hover:underline">
              Política de Privacidade
            </a>{' '}
            e{' '}
            <a href="/termos-de-uso" onClick={close} className="text-[#fabd00] hover:underline">
              Termos de Uso
            </a>
            .
          </p>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="h-9 px-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#e3e2e2] transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={close}
            className="h-9 px-4 rounded-lg bg-[#ffc107] hover:bg-[#ffca28] text-[#121414] text-xs font-bold transition-colors"
          >
            Aceitar e Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

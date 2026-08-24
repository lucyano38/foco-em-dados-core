import { useEffect } from 'react';
import { Cookie } from 'lucide-react';

const COOKIE_KEY = 'cookie_accepted';

export default function CookieConsent({ isVisible, onChangeVisible }: { isVisible: boolean; onChangeVisible: (visible: boolean) => void }) {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_KEY);
      if (stored === 'true') {
        onChangeVisible(false);
        return;
      }
      const timer = setTimeout(() => onChangeVisible(true), 1200);
      return () => clearTimeout(timer);
    } catch {
      onChangeVisible(true);
    }
  }, []);

  const close = () => {
    try {
      localStorage.setItem(COOKIE_KEY, 'true');
    } catch {
      // storage indisponível
    }
    onChangeVisible(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    if (isVisible) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
      <div
        className="relative z-10 w-full max-w-2xl bg-[#201f21] border border-[#3b494b]/60 rounded-2xl shadow-2xl"
        role="dialog"
        aria-label="Aviso de cookies"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
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
    </div>
  );
}

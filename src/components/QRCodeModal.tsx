import { motion } from 'motion/react';
import { X, RefreshCw, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrData: string | null;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  title?: string;
  description?: string;
}

export default function QRCodeModal({
  isOpen,
  onClose,
  qrData,
  isLoading = false,
  error = null,
  onRefresh,
  title = "Conectar WhatsApp Real",
  description = "Escaneie o QR Code abaixo para sincronizar seu WhatsApp corporativo com as nossas automações de IA."
}: QRCodeModalProps) {
  const [localQr, setLocalQr] = useState<string | null>(qrData);
  const [localLoading, setLocalLoading] = useState(isLoading);
  const [localError, setLocalError] = useState<string | null>(error);

  // Sync with props when they change
  useEffect(() => {
    setLocalQr(qrData);
  }, [qrData]);

  useEffect(() => {
    setLocalLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    setLocalError(error);
  }, [error]);

  // Polling logic: fetch every 15 seconds from '/get-qr' if open
  useEffect(() => {
    if (!isOpen) return;

    const fetchLatestQR = async () => {
      try {
        const response = await fetch('/get-qr');
      
        if (!response.ok) {
          throw new Error('Falha ao obter QR Code atualizado do back-end.');
        }
        
        const data = await response.json();
        const qr = data.qrCode || data.qr || data.url;
        
        if (qr) {
          if (qr.startsWith('data:image') || qr.startsWith('http')) {
            setLocalQr(qr);
          } else {
            setLocalQr(`data:image/png;base64,${qr}`);
          }
          setLocalError(null);
        }
      } catch (err: any) {
        console.warn("[QRCodeModal Polling] Erro:", err.message || err);
      } finally {
        setLocalLoading(false);
      }
    };

    // First run immediately
    fetchLatestQR();

    // Poll every 15 seconds
    const intervalId = setInterval(fetchLatestQR, 15000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="backdrop-blur-lg bg-slate-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full relative z-10 shadow-[0_0_50px_rgba(16,185,129,0.2)] space-y-6 text-center"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 bg-white/5 rounded-xl border border-white/10 hover:border-emerald-500/20 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-950/50 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] mb-2">
            <MessageCircle className="w-6 h-6 fill-current" />
          </div>
          <h3 className="text-xl font-black text-slate-100 text-center">{title}</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed text-center">
            {description}
          </p>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-950 border border-white/5 rounded-2xl relative min-h-[240px]">
          {localLoading ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-8">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <span className="text-xs font-mono text-slate-400 animate-pulse">Gerando QR Code...</span>
            </div>
          ) : localError ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-6 px-4">
              <div className="w-10 h-10 rounded-full bg-red-950/50 border border-red-500/20 flex items-center justify-center text-red-400">
                <X className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-red-400 text-center">{localError}</span>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="mt-2 h-9 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md"
                >
                  Tentar Novamente
                </button>
              )}
            </div>
          ) : localQr ? (
            <div className="space-y-4">
              <div className="p-3 bg-white rounded-2xl inline-block shadow-lg">
                <img
                  src={localQr}
                  alt="QR Code"
                  className="w-[256px] h-[256px] block mx-auto [image-rendering:pixelated] object-contain"
                  referrerPolicy="no-referrer"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto leading-normal">
                Abra o WhatsApp &gt; Dispositivos Conectados &gt; Conectar um dispositivo e aponte a câmera.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3 py-8">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <span className="text-xs font-mono text-slate-400 animate-pulse">Aguardando sessão...</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Cancelar
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={localLoading}
              className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95 duration-300 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${localLoading ? 'animate-spin' : ''}`} />
              Atualizar QR
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

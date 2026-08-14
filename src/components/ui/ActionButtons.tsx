import React from 'react';

// Icons placeholder (would typically use lucide-react or similar)
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zM6.54 15.526c.49.278 1.08.432 1.62.432.535 0 1.076-.145 1.545-.419.467-.275.877-.652 1.189-1.12.311-.469.52-1.02.585-1.603.064-.582-.016-1.155-.23-1.666-.214-.511-.555-.959-.988-1.298-.432-.338-.95-.536-1.492-.563-.541-.027-1.077.114-1.536.394-.458.28-.838.681-1.096 1.164-.258.483-.393 1.036-.388 1.602.005.566.155 1.116.425 1.608.27.492.656.884 1.123 1.144z" />
  </svg>
);

const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

interface ActionButtonProps {
  type: 'whatsapp' | 'email';
  messageText: string;
  clientEmail?: string;
  className?: string;
}

export const ActionButton = ({ type, messageText, clientEmail, className = "" }: ActionButtonProps) => {
  const baseClasses = "w-full md:w-auto px-8 py-4 text-white font-bold text-lg rounded-xl shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-3";
  
  if (type === 'whatsapp') {
    return (
      <a
        href={`https://wa.me/5511994411307?text=${encodeURIComponent(messageText)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} bg-emerald-600 hover:bg-emerald-500 ${className}`}
      >
        <WhatsAppIcon className="w-6 h-6" />
        Enviar proposta via WhatsApp
      </a>
    );
  }

  return (
    <a
      href={`mailto:${clientEmail}?subject=Proposta%20Foco%20em%20Dados&body=${encodeURIComponent(messageText)}`}
      className={`${baseClasses} bg-blue-600 hover:bg-blue-500 ${className}`}
    >
      <MailIcon className="w-6 h-6" />
      Enviar proposta por E-mail
    </a>
  );
};

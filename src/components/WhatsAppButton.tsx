import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5511994411307"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 p-4 bg-green-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform duration-300"
    >
      <MessageCircle size={28} />
    </a>
  );
}

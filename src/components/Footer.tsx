import { Link } from 'react-router-dom'
import { Database, MessageCircle, Mail, Phone, Shield, Globe, MapPin, FileText, Send } from 'lucide-react'

import { CONTACT_EMAIL, WHATSAPP_URL, TELEGRAM_URL } from '../lib/contact'

export default function Footer() {
  return (
    <footer id="contato" className="relative border-t border-white/5 bg-white/[0.02] backdrop-blur-xl">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#fabd00] to-[#5203d5] flex items-center justify-center shadow-lg shadow-[#5203d5]/20">
                <Database className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-[#e3e2e2] leading-tight">Foco em Dados</p>
                <p className="text-[10px] font-mono text-[#fabd00]/80">CNPJ: 00.000.000/0001-00</p>
              </div>
            </div>
            <p className="text-xs text-[#d4c5ab]/80 leading-relaxed max-w-xs">
              Automação com IA, sites de alta conversão e Business Intelligence para o seu negócio.
            </p>
            <div className="space-y-1.5 text-[11px] text-[#d4c5ab]/70">
              <p className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-[#fabd00]/80" /> São Paulo, SP — Brasil
              </p>
              <p className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-[#fabd00]/80" /> LGPD compliant
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#fabd00]/70">
              Atendimento & Automação
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="text-[#d4c5ab] hover:text-[#fabd00] transition-colors inline-flex items-center gap-2"
                >
                  <Mail className="w-3.5 h-3.5" /> {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#d4c5ab] hover:text-[#4ade80] transition-colors inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp (11) 99441-1307
                </a>
              </li>
              <li>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#d4c5ab] hover:text-[#60a5fa] transition-colors inline-flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" /> Telegram n8n
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#fabd00]/70">
              Políticas & Transparência
            </p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/termos-de-uso" className="text-[#d4c5ab] hover:text-[#fabd00] transition-colors inline-flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/politica-de-privacidade" className="text-[#d4c5ab] hover:text-[#fabd00] transition-colors inline-flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> Política de Privacidade
                </Link>
              </li>
              <li className="text-[#d4c5ab]/70">
                <span className="inline-flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" /> Sem vínculo com Google Inc.
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#d4c5ab]/50">
          <p>© 2026 Foco em Dados — Luciano Tavares. Todos os direitos reservados.</p>
          <p className="flex items-center gap-2">
            <Globe className="w-3 h-3" /> focoemdados.com.br
          </p>
        </div>
      </div>
    </footer>
  )
}

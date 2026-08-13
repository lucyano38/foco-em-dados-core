import { Link } from 'react-router-dom'
import { Database, MessageCircle, Mail } from 'lucide-react'

import { CONTACT_EMAIL, WHATSAPP_URL } from '../lib/contact'

export default function Footer() {
  return (
    <footer id="contato" className="border-t border-[#4f4632]/40 py-10 px-4 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[#d4c5ab]/70">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#fabd00]" />
            <span className="font-semibold text-[#e3e2e2]">Foco em Dados</span>
          </div>
          <p className="text-xs text-[#d4c5ab]/50 max-w-[240px]">
            Automação com IA, sites de alta conversão e Business Intelligence para o seu negócio.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#fabd00]/70">
            Legal / Institucional
          </p>
          <nav className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-2 flex-wrap">
            <Link to="/politica-de-privacidade" className="hover:text-[#fabd00] transition-colors">
              Política de Privacidade
            </Link>
            <Link to="/termos-de-uso" className="hover:text-[#fabd00] transition-colors">
              Termos de Uso
            </Link>
            <Link to="/admin" className="text-[#fabd00]/60 hover:text-[#fabd00] transition-colors">
              Painel Administrativo
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[#fabd00]/80 hover:text-[#fabd00] transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp (11) 99441-1307
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-1.5 hover:text-[#e3e2e2] transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              {CONTACT_EMAIL}
            </a>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 pt-4 border-t border-[#4f4632]/30 text-center text-[11px] text-[#d4c5ab]/40">
        © 2026 Foco em Dados — Luciano Tavares. Todos os direitos reservados.
      </div>
    </footer>
  )
}
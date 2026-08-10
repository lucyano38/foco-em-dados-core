import { Link } from 'react-router-dom'
import { Database } from 'lucide-react'

export const CONTACT_EMAIL = 'atendimento@focoemdados.com.br'

export default function Footer() {
  return (
    <footer id="contato" className="border-t border-[#4f4632]/40 py-12 px-4 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#d4c5ab]/70">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#fabd00]" />
          <span className="font-semibold text-[#e3e2e2]">Foco em Dados</span>
        </div>
        <div className="flex items-center gap-6 flex-wrap justify-center">
          <Link to="/admin" className="text-[#fabd00]/60 hover:text-[#fabd00] transition-colors">Painel Administrativo</Link>
          <Link to="/privacidade" className="hover:text-[#e3e2e2] transition-colors">Privacidade</Link>
          <Link to="/termos" className="hover:text-[#e3e2e2] transition-colors">Termos</Link>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="hover:text-[#e3e2e2] transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  )
}

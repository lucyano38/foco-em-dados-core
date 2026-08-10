import { ListTodo } from 'lucide-react';

interface LeadRow {
  company: string;
  phone: string;
  niche: string;
  city: string;
  presence: { label: string; cls: string };
  status: { label: string; dot: string };
}

const LEADS: LeadRow[] = [
  {
    company: 'Restaurante Sabor & Arte',
    phone: '(11) 3256-8890',
    niche: 'Restaurante',
    city: 'São Paulo, SP',
    presence: { label: 'COM SITE (3/10)', cls: 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20' },
    status: { label: 'QUALIFICADO', dot: 'bg-[#4ade80]' },
  },
  {
    company: 'Barbearia Vintage Club',
    phone: '(11) 3081-4433',
    niche: 'Barbearia',
    city: 'São Paulo, SP',
    presence: { label: 'COM SITE (4/10)', cls: 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20' },
    status: { label: 'EM ANÁLISE', dot: 'bg-[#fbbf24]' },
  },
  {
    company: 'Pet Shop AuAu Care',
    phone: '(19) 3251-9000',
    niche: 'Pet Shop',
    city: 'Campinas, SP',
    presence: { label: 'SEM SITE', cls: 'bg-[#fabd00]/10 text-[#fabd00] border-[#fabd00]/20' },
    status: { label: 'CONTACTADO', dot: 'bg-[#60a5fa]' },
  },
];

export default function LeadsTable() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto py-12">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#fabd00]/10 text-[#fabd00] border border-[#fabd00]/20">
            <ListTodo className="w-5 h-5" />
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#e3e2e2]">
            Últimos Leads Prospectados
          </h2>
        </div>
        <span className="text-sm text-[#d4c5ab]/70">Ver todos (5)</span>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 font-[family-name:var(--font-mono)] text-[10px] text-[#d4c5ab]/70 uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-4 font-[family-name:var(--font-mono)] text-[10px] text-[#d4c5ab]/70 uppercase tracking-wider">Nicho &amp; Cidade</th>
                <th className="px-6 py-4 font-[family-name:var(--font-mono)] text-[10px] text-[#d4c5ab]/70 uppercase tracking-wider">Presença Web</th>
                <th className="px-6 py-4 font-[family-name:var(--font-mono)] text-[10px] text-[#d4c5ab]/70 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right font-[family-name:var(--font-mono)] text-[10px] text-[#d4c5ab]/70 uppercase tracking-wider">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {LEADS.map((lead) => (
                <tr key={lead.company} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-6">
                    <p className="font-bold text-[#e3e2e2] group-hover:text-[#fabd00] transition-colors">{lead.company}</p>
                    <p className="text-sm text-[#d4c5ab]/60">{lead.phone}</p>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-1.5 text-sm text-[#d4c5ab]">
                      <span className="text-[#e3e2e2]">{lead.niche}</span>
                      <span className="text-[#4f4632]">•</span>
                      <span className="text-[#d4c5ab]/70">{lead.city}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${lead.presence.cls}`}>
                      {lead.presence.label}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${lead.status.dot}`} />
                      <span className="text-sm font-medium text-[#e3e2e2]">{lead.status.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <button className="px-4 py-2 rounded-lg border border-white/10 hover:border-[#fabd00]/50 text-sm text-[#d4c5ab] hover:text-[#ffe4af] transition-all cursor-pointer">
                      Gerenciar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

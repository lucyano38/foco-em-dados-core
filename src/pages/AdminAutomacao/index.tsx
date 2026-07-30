import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Plus, Trash2, Mail, Phone, Search, RefreshCw, AlertCircle, CheckCircle2, Bot, Sparkles } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  notes: string;
  created_at: string;
}

export default function AdminAutomacao() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('novo');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar leads:', err);
      setError(err.message || 'Erro ao carregar leads do Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('Usuário não autenticado.');
      return;
    }

    try {
      const { error } = await supabase.from('leads').insert([
        {
          user_id: user.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          status,
          notes: notes.trim(),
        },
      ]);

      if (error) throw error;

      setSuccess('Lead cadastrado e automatizado com sucesso!');
      setName('');
      setEmail('');
      setPhone('');
      setNotes('');
      fetchLeads();
    } catch (err: any) {
      console.error('Erro ao inserir lead:', err);
      setError(err.message || 'Erro ao cadastrar lead.');
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      setLeads(leads.filter((l) => l.id !== id));
      setSuccess('Lead removido com sucesso.');
    } catch (err: any) {
      console.error('Erro ao remover lead:', err);
      setError(err.message || 'Erro ao remover lead.');
    }
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.email && l.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Bot className="w-4 h-4 text-white animate-pulse" />
            </div>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              Módulo Prospector & Automação
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Gestão de Leads & Automações</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Capture, qualifique e dispare fluxos de atendimento automatizados integrados diretamente com o Supabase.
          </p>
        </div>
        <button
          onClick={fetchLeads}
          className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 h-11 rounded-xl text-xs font-semibold text-slate-200 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulário de Cadastro / Novo Lead */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
            <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              Adicionar Novo Lead
            </h2>

            <form onSubmit={handleAddLead} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ana Silva"
                  className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ana@empresa.com"
                  className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  WhatsApp / Telefone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Status do Funil
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 text-xs text-slate-200 outline-none transition-all"
                >
                  <option value="novo">Novo Lead</option>
                  <option value="qualificado">Qualificado</option>
                  <option value="contatado">Em Contato</option>
                  <option value="convertido">Convertido (Cliente)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Observações / Notas
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Interessado no plano Pro..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Cadastrar e Disparar Bot
              </button>
            </form>
          </div>
        </div>

        {/* Tabela de Leads */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Base de Leads Capturados ({filteredLeads.length})
              </h2>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="w-full h-10 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-4 text-xs text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-500 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Carregando base de leads...
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Nenhum lead encontrado.</p>
                <p className="text-[10px] text-slate-600 mt-1">Cadastre o primeiro lead usando o formulário ao lado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Nome</th>
                      <th className="pb-3 px-3">Contato</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3">Data</th>
                      <th className="pb-3 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-200">
                          {lead.name}
                          {lead.notes && (
                            <span className="block text-[10px] text-slate-500 font-normal truncate max-w-xs">
                              {lead.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{lead.email}</span>
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                              lead.status === 'convertido'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : lead.status === 'qualificado'
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                            title="Remover Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

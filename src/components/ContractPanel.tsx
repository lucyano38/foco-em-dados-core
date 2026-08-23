import { useEffect, useState } from 'react';
import { Download, Loader2, FileText } from 'lucide-react';

type Lead = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  value?: number;
  status: string;
  source?: string;
  created_at: string;
};

type ContractData = {
  nome_negocio: string;
  nome_cliente: string;
  cpf_cnpj_cliente: string;
  cpf_cnpj_cliente_label: string;
  endereco_cliente: string;
  cidade_uf_cliente: string;
  nome_prestador: string;
  cpf_cnpj_prestador: string;
  cpf_cnpj_prestador_label: string;
  endereco_prestador: string;
  cidade_uf_prestador: string;
  url_site_antigo: string;
  url_publicada: string;
  valor: string;
  valor_extenso: string;
  forma_pagamento: string;
  prazo_entrega: string;
  rodadas_ajustes: string;
  clausula_manutencao: string;
  n_conteudo: string;
  n_hospedagem: string;
  n_rescisao: string;
  n_foro: string;
  texto_hospedagem: string;
  cidade_foro: string;
  cidade_assinatura: string;
  data_extenso: string;
};

const DEFAULT_PRESTADOR = {
  nome: 'Luciano Tavares',
  cpf_cnpj: '000.000.000-00',
  cpf_cnpj_label: 'inscrito(a) no CPF',
  endereco: 'Rua Exemplo, 123',
  cidade_uf: 'Itupeva/SP',
};

const DEFAULT_CONTRACT: ContractData = {
  nome_negocio: '',
  nome_cliente: '',
  cpf_cnpj_cliente: '',
  cpf_cnpj_cliente_label: 'inscrito(a) no CPF',
  endereco_cliente: '',
  cidade_uf_cliente: '',
  nome_prestador: DEFAULT_PRESTADOR.nome,
  cpf_cnpj_prestador: DEFAULT_PRESTADOR.cpf_cnpj,
  cpf_cnpj_prestador_label: DEFAULT_PRESTADOR.cpf_cnpj_label,
  endereco_prestador: DEFAULT_PRESTADOR.endereco,
  cidade_uf_prestador: DEFAULT_PRESTADOR.cidade_uf,
  url_site_antigo: '',
  url_publicada: '',
  valor: '',
  valor_extenso: '',
  forma_pagamento: '',
  prazo_entrega: '7 (sete) dias úteis',
  rodadas_ajustes: '1 (uma)',
  clausula_manutencao: '',
  n_conteudo: '4',
  n_hospedagem: '5',
  n_rescisao: '6',
  n_foro: '7',
  texto_hospedagem: 'A página será entregue publicada; a partir da entrega, a contratação e renovação de hospedagem e domínio próprios são de responsabilidade do CONTRATANTE, com suporte do CONTRATADO(A) na migração, se solicitado.',
  cidade_foro: 'Itupeva/SP',
  cidade_assinatura: 'Itupeva/SP',
  data_extenso: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
};

function toRoman(num: number): string {
  const map = [
    ['M', 1000],
    ['CM', 900],
    ['D', 500],
    ['CD', 400],
    ['C', 100],
    ['XC', 90],
    ['L', 50],
    ['XL', 40],
    ['X', 10],
    ['IX', 9],
    ['V', 5],
    ['IV', 4],
    ['I', 1],
  ];
  let n = num;
  let out = '';
  for (const [r, v] of map) {
    while (n >= v) {
      out += r;
      n -= v;
    }
  }
  return out;
}

function normalizeNumeral(raw: string, fallback: number): number {
  const n = Number(String(raw).replace(/[^\d]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function buildHtml(data: ContractData): string {
  const maintenanceBlock = data.clausula_manutencao
    ? `<h2>Cláusula 4ª — Da manutenção mensal</h2>
<p>${data.clausula_manutencao}</p>`
    : '';

  const numeration = maintenanceBlock
    ? { n_conteudo: 5, n_hospedagem: 6, n_rescisao: 7, n_foro: 8 }
    : { n_conteudo: 4, n_hospedagem: 5, n_rescisao: 6, n_foro: 7 };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Contrato de Prestação de Serviços — ${data.nome_negocio || data.nome_cliente || 'Cliente'}</title>
<style>
@page{size:A4;margin:2.2cm}
body{font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;line-height:1.65;font-size:12.5pt;margin:0;background:#E9E7E1;padding:46px 16px}
.folha{background:#fff;max-width:21cm;margin:0 auto;padding:2.2cm;box-shadow:0 12px 44px rgba(0,0,0,.18);border-radius:4px}
.print-bar{position:fixed;top:14px;right:16px;display:flex;gap:8px;font-family:Arial,sans-serif;z-index:10}
.print-bar button{border:0;border-radius:9px;padding:10px 18px;font-size:13px;font-weight:700;cursor:pointer;background:#D97757;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.2)}
.print-bar button:hover{background:#C15F3C}
h1{font-size:15pt;text-align:center;text-transform:uppercase;letter-spacing:.05em;margin:0 0 28px}
h2{font-size:12.5pt;margin:22px 0 8px}
p{margin:8px 0;text-align:justify}
.partes p{margin:6px 0}
.assinaturas{margin-top:56px;display:flex;gap:40px;justify-content:space-between;page-break-inside:avoid}
.assinaturas div{flex:1;text-align:center}
.linha{border-top:1px solid #1a1a1a;margin-bottom:6px;padding-top:6px}
.aviso{margin-top:36px;font-size:9pt;color:#666;border-top:1px solid #ccc;padding-top:10px;font-family:Arial,sans-serif}
.local-data{margin-top:40px}
@media print{.aviso{position:fixed;bottom:0}body{background:#fff;padding:0}.folha{box-shadow:none;border-radius:0;max-width:none;padding:0}.print-bar{display:none}}
</style>
</head>
<body>
<div class="print-bar"><button onclick="window.print()">Imprimir / Salvar PDF</button></div>
<div class="folha">
<h1>Contrato de Prestação de Serviços<br>Criação e Publicação de Página na Internet</h1>

<div class="partes">
<p><b>CONTRATANTE:</b> ${data.nome_cliente || '_________________'}, ${data.cpf_cnpj_cliente_label} nº ${data.cpf_cnpj_cliente || '_________________'}, com endereço em ${data.endereco_cliente || '_________________'}, ${data.cidade_uf_cliente || '_________________'}.</p>
<p><b>CONTRATADO(A):</b> ${data.nome_prestador}, ${data.cpf_cnpj_prestador_label} nº ${data.cpf_cnpj_prestador}, com endereço em ${data.endereco_prestador}, ${data.cidade_uf_prestador}.</p>
</div>

<p>As partes acima identificadas celebram o presente contrato de prestação de serviços, que se regerá pelas cláusulas seguintes.</p>

<h2>Cláusula 1ª — Do objeto</h2>
<p>O presente contrato tem por objeto a criação de nova versão da página na internet do CONTRATANTE (${data.url_site_antigo || '_________________'}), incluindo: redesign completo do layout com manutenção da identidade visual (logotipo, cores e imagens fornecidas), redação aprimorada do conteúdo existente, adaptação para dispositivos móveis e publicação da página no endereço ${data.url_publicada || '_________________'}.</p>

<h2>Cláusula 2ª — Do valor e forma de pagamento</h2>
<p>Pelos serviços descritos na Cláusula 1ª, o CONTRATANTE pagará ao CONTRATADO(A) o valor total de <b>R$ ${data.valor || '____'} (${data.valor_extenso || '_________________'})</b>, na seguinte forma: ${data.forma_pagamento || '_________________'}.</p>

<h2>Cláusula 3ª — Do prazo de entrega</h2>
<p>A página em sua versão final será entregue e publicada em até ${data.prazo_entrega} a contar da assinatura deste contrato e do fornecimento, pelo CONTRATANTE, dos materiais e aprovações necessários. Está incluída ${data.rodadas_ajustes} rodada(s) de ajustes de texto e imagens após a entrega.</p>

${maintenanceBlock}

<h2>Cláusula ${numeration.n_conteudo}ª — Do conteúdo e responsabilidades</h2>
<p>O CONTRATANTE declara ser titular ou possuir autorização de uso de todos os textos, imagens, logotipo e informações fornecidos, responsabilizando-se pela veracidade das informações profissionais divulgadas. O CONTRATADO(A) compromete-se a não inserir na página informações não fornecidas ou não aprovadas pelo CONTRATANTE.</p>

<h2>Cláusula ${numeration.n_hospedagem}ª — Da hospedagem e domínio</h2>
<p>${data.texto_hospedagem}</p>

<h2>Cláusula ${numeration.n_rescisao}ª — Da rescisão</h2>
<p>Este contrato poderá ser rescindido por qualquer das partes mediante comunicação por escrito. Em caso de rescisão pelo CONTRATANTE após o início dos trabalhos, será devido o valor proporcional aos serviços já executados. Serviços de manutenção mensal, quando contratados, podem ser cancelados por qualquer parte com aviso prévio de 30 (trinta) dias.</p>

<h2>Cláusula ${numeration.n_foro}ª — Do foro</h2>
<p>Fica eleito o foro da comarca de ${data.cidade_foro} para dirimir quaisquer controvérsias oriundas deste contrato.</p>

<p class="local-data">${data.cidade_assinatura}, ${data.data_extenso}.</p>

<div class="assinaturas">
  <div><div class="linha"></div><b>${data.nome_cliente || '_________________'}</b><br>Contratante</div>
  <div><div class="linha"></div><b>${data.nome_prestador}</b><br>Contratado(a)</div>
</div>

<p class="aviso">Este documento é uma minuta base gerada automaticamente para facilitar a formalização entre as partes. Recomenda-se a revisão por profissional jurídico antes da assinatura. Gerado pelo plugin Prospector de Sites.</p>
</div>
</body>
</html>`;
}

function numberToBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function numberToWords(n: number): string {
  // Simplificação: para valores redondos em reais, sem centavos
  if (n <= 0) return 'zero reais';
  const inteiro = Math.floor(n);
  const centavos = Math.round((n - inteiro) * 100);

  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dez = ['', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  const three = (v: number): string => {
    if (v === 0) return '';
    if (v === 100) return 'cem';
    const c = Math.floor(v / 100);
    const d = Math.floor((v % 100) / 10);
    const u = v % 10;
    const parts: string[] = [];
    if (c) parts.push(centenas[c]);
    if (d === 1 && u) {
      parts.push(dez[u]);
    } else {
      if (d) parts.push(dezenas[d]);
      if (u) parts.push(unidades[u]);
    }
    return parts.join(' e ');
  };

  const chunks: string[] = [];
  if (inteiro >= 1000000000) {
    const bilhoes = Math.floor(inteiro / 1000000000);
    const resto = inteiro % 1000000000;
    const text = three(bilhoes);
    chunks.push(`${text} bilh${text === 'um' ? 'ão' : 'ões'}`);
    if (resto) chunks.push(three(resto));
  } else if (inteiro >= 1000000) {
    const milhoes = Math.floor(inteiro / 1000000);
    const resto = inteiro % 1000000;
    const text = three(milhoes);
    chunks.push(`${text} milh${text === 'um' ? 'ão' : 'ões'}`);
    if (resto) chunks.push(three(resto));
  } else if (inteiro >= 1000) {
    const mil = Math.floor(inteiro / 1000);
    const resto = inteiro % 1000;
    const text = three(mil);
    chunks.push(`${text} mil`);
    if (resto) chunks.push(three(resto));
  } else {
    chunks.push(three(inteiro));
  }

  const reais = chunks.filter(Boolean).join(' e ') + ' reais';
  if (centavos === 0) return reais;
  return `${reais} e ${centavos} centavos`;
}

export default function ContractPanel({ lead, onBack }: { lead?: Lead | null; onBack?: () => void }) {
  const [form, setForm] = useState<ContractData>(DEFAULT_CONTRACT);
  const [html, setHtml] = useState<string>('');
  const [copyOk, setCopyOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lead) return;
    const value = Number(lead.value || 0);
    setForm((prev) => ({
      ...prev,
      nome_negocio: lead.name || prev.nome_negocio,
      nome_cliente: lead.name || prev.nome_cliente,
      valor: value ? numberToBRL(value).replace('R$', '').trim() : prev.valor,
      valor_extenso: value ? numberToWords(value) : prev.valor_extenso,
      url_site_antigo: lead.notes || prev.url_site_antigo,
      data_extenso: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    }));
  }, [lead]);

  const update = (key: keyof ContractData, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const generate = () => {
    try {
      const next = { ...form, data_extenso: form.data_extenso || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) };
      setHtml(buildHtml(next));
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Erro ao gerar contrato.');
    }
  };

  const downloadHtml = () => {
    if (!html) {
      setError('Gere o contrato antes de baixar.');
      return;
    }
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contrato-${(form.nome_negocio || form.nome_cliente || 'cliente').replace(/[^a-zA-Z0-9\-]+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyEmail = async () => {
    const subject = encodeURIComponent(`Contrato — ${form.nome_negocio || form.nome_cliente || 'Proposta'}`);
    const body = encodeURIComponent(
      `Olá, ${form.nome_cliente || '!'}.\n\nSegue o contrato para revisão/impressão.\n\n` +
        `Valor: R$ ${form.valor || '___'} (${form.valor_extenso || '___'}).\n` +
        `Prazo: ${form.prazo_entrega || '___'}.\n\n` +
        `Se quiser, já posso enviar também o link do comparador Antes/Depois.\n\n` +
        `Abraço,\nLuciano Tavares — Foco em Dados`
    );
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(lead?.email || '')}&su=${subject}&body=${body}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyOk('Link do Gmail copiado para a área de transferência.');
    } catch {
      setCopyOk('Pronto para abrir no Gmail.');
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#ffe4af] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#fabd00]" />
            Contrato de Prestação de Serviços
          </h2>
          <p className="text-[11px] text-[#d4c5ab] mt-1">Preencha os campos obrigatórios e gere a minuta em HTML/PDF A4.</p>
        </div>
        {onBack && (
          <button onClick={onBack} className="h-9 px-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#e3e2e2]">
            Voltar
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-300">{error}</div>
      )}
      {copyOk && (
        <div className="bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl p-4 text-sm text-[#4ade80]">{copyOk}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-2xl space-y-3">
          <p className="text-xs font-semibold text-[#ffe4af] uppercase tracking-wider">Dados do cliente</p>
          <input className="input-mystic w-full h-9 px-3 text-xs" placeholder="Nome do cliente/negócio" value={form.nome_cliente} onChange={(e) => update('nome_cliente', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input-mystic w-full h-9 px-3 text-xs" placeholder="CPF/CNPJ" value={form.cpf_cnpj_cliente} onChange={(e) => update('cpf_cnpj_cliente', e.target.value)} />
            <select className="input-mystic w-full h-9 px-3 text-xs" value={form.cpf_cnpj_cliente_label} onChange={(e) => update('cpf_cnpj_cliente_label', e.target.value)}>
              <option value="inscrito(a) no CPF">CPF</option>
              <option value="inscrita no CNPJ">CNPJ</option>
            </select>
          </div>
          <input className="input-mystic w-full h-9 px-3 text-xs" placeholder="Endereço" value={form.endereco_cliente} onChange={(e) => update('endereco_cliente', e.target.value)} />
          <input className="input-mystic w-full h-9 px-3 text-xs" placeholder="Cidade/UF" value={form.cidade_uf_cliente} onChange={(e) => update('cidade_uf_cliente', e.target.value)} />
          <input className="input-mystic w-full h-9 px-3 text-xs" placeholder="URL do site atual" value={form.url_site_antigo} onChange={(e) => update('url_site_antigo', e.target.value)} />
          <input className="input-mystic w-full h-9 px-3 text-xs" placeholder="URL da página publicada" value={form.url_publicada} onChange={(e) => update('url_publicada', e.target.value)} />
        </div>

        <div className="glass-card p-4 rounded-2xl space-y-3">
          <p className="text-xs font-semibold text-[#ffe4af] uppercase tracking-wider">Valor e prazo</p>
          <div className="grid grid-cols-2 gap-3">
            <input className="input-mystic w-full h-9 px-3 text-xs" placeholder="Valor (R$)" value={form.valor} onChange={(e) => update('valor', e.target.value)} />
            <input className="input-mystic w-full h-9 px-3 text-xs" placeholder="Valor por extenso" value={form.valor_extenso} onChange={(e) => update('valor_extenso', e.target.value)} />
          </div>
          <input className="input-mystic w-full h-9 px-3 text-xs" placeholder="Forma de pagamento" value={form.forma_pagamento} onChange={(e) => update('forma_pagamento', e.target.value)} />
          <input className="input-mystic w-full h-9 px-3 text-xs" placeholder="Prazo de entrega" value={form.prazo_entrega} onChange={(e) => update('prazo_entrega', e.target.value)} />
          <input className="input-mystic w-full h-9 px-3 text-xs" placeholder="Rodadas de ajustes" value={form.rodadas_ajustes} onChange={(e) => update('rodadas_ajustes', e.target.value)} />
          <label className="flex items-center gap-2 text-xs text-[#e3e2e2]">
            <input type="checkbox" checked={!!form.clausula_manutencao} onChange={(e) => update('clausula_manutencao', e.target.checked ? `<h2>Cláusula 4ª — Da manutenção mensal</h2><p>O CONTRATANTE contrata ainda o serviço de manutenção mensal da página (hospedagem, pequenas atualizações de texto/imagens e suporte), pelo valor de R$ ___ mensais, com vigência a partir da publicação e renovação automática mensal.</p>` : '')} />
            Incluir cláusula de manutenção
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={generate} className="btn-glow h-10 px-5 rounded-lg text-xs font-bold flex items-center gap-2">
          <FileText className="w-3.5 h-3.5" />
          Gerar Contrato
        </button>
        <button onClick={downloadHtml} disabled={!html} className="h-10 px-5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-[#e3e2e2] disabled:opacity-50 flex items-center gap-2">
          <Download className="w-3.5 h-3.5" />
          Baixar HTML
        </button>
        <button onClick={copyEmail} className="h-10 px-5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-[#e3e2e2] flex items-center gap-2">
          Abrir rascunho no Gmail
        </button>
      </div>

      {html && (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="bg-white/[0.04] border-b border-white/10 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-[#d4c5ab]">
            Pré-visualização — use Ctrl+P para salvar como PDF
          </div>
          <iframe srcDoc={html} title="Pré-visualização do contrato" className="w-full h-[520px] bg-white" sandbox="allow-scripts allow-same-origin" />
        </div>
      )}
    </div>
  );
}

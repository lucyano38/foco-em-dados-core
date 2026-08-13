import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { safeJson, friendlyFetchError } from '../lib/safeFetch';
import {
  Upload, FileSpreadsheet, Lock, CheckCircle2, AlertTriangle, Loader2,
  BarChart3, PieChart, LineChart, Download, RefreshCcw, LayoutDashboard, Check,
  Sparkles, Table2, Crown,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart as RPieChart, Pie, Cell, Legend,
  LineChart as RLineChart, Line,
} from 'recharts';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;
const MAX_FREE_ROWS = 100;
const PAID_PRICE_CENTS = 3990;

interface ParsedSheet {
  rows: Record<string, any>[];
  columns: string[];
  totalRows: number;
}

interface BiData {
  filename: string;
  sheet: ParsedSheet;
  numericColumns: string[];
  dimensionColumn: string;
  metricColumn: string;
  totals: { [col: string]: number };
  byCategory: { name: string; value: number }[];
}

type EtlStageId = 'idle' | 'extract' | 'transform' | 'load' | 'done';

interface EtlState {
  stage: EtlStageId;
  activeIndex: number;
  log: string[];
}

const ETL_STAGES = [
  { id: 'extract', label: 'Ingestão', sub: 'Extract', icon: Download, desc: 'Lendo CSV/XLSX' },
  { id: 'transform', label: 'Transformação', sub: 'Transform', icon: RefreshCcw, desc: 'Limpando e padronizando' },
  { id: 'load', label: 'Carregamento', sub: 'Load', icon: LayoutDashboard, desc: 'Gerando o Dashboard' },
] as const;

const PIE_COLORS = ['#fabd00', '#cdbdff', '#4ade80', '#60a5fa', '#fbbf24', '#ff8a5c', '#5203d5', '#ffe4af'];

const MAX_FILE_MB = 10;

const DEMO_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DEMO_REGIONS = [
  { name: 'Sudeste', factor: 1.45 },
  { name: 'Sul', factor: 1.15 },
  { name: 'Nordeste', factor: 0.95 },
  { name: 'Centro-Oeste', factor: 0.70 },
  { name: 'Norte', factor: 0.55 },
];

function buildDemoSheet(): ParsedSheet {
  const rows: Record<string, any>[] = [];
  let seed = 42;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (const region of DEMO_REGIONS) {
    let run = 90000 * region.factor;
    for (const month of DEMO_MONTHS) {
      const growth = 1 + (0.6 + next() * 1.8) / 100;
      run *= growth;
      const faturamento = Math.round(run / 50) * 50;
      const pedidos = Math.round(faturamento / (165 + next() * 60));
      const ticket = Math.round((faturamento / pedidos) * 100) / 100;
      const novosClientes = Math.round(8 + next() * 45);
      rows.push({
        'Mês': month,
        'Região': region.name,
        'Faturamento (R$)': faturamento,
        'Pedidos': pedidos,
        'Ticket Médio (R$)': ticket,
        'Novos Clientes': novosClientes,
      });
    }
  }
  const columns = ['Mês', 'Região', 'Faturamento (R$)', 'Pedidos', 'Ticket Médio (R$)', 'Novos Clientes'];
  return { rows, columns, totalRows: rows.length };
}

const DEMO_TOP_CLIENTS = [
  { name: 'Mercado Bom Preço', cidade: 'São Paulo/SP', valor: 148900, pedidos: 1245 },
  { name: 'Clínica Vida Plena', cidade: 'Belo Horizonte/MG', valor: 98200, pedidos: 876 },
  { name: 'Moda Bella Store', cidade: 'Curitiba/PR', valor: 84750, pedidos: 731 },
  { name: 'Auto Peças Silva', cidade: 'Rio de Janeiro/RJ', valor: 77600, pedidos: 654 },
  { name: 'Padaria Pão Dourado', cidade: 'Campinas/SP', valor: 52300, pedidos: 489 },
  { name: 'Distribuidora Central Bebidas', cidade: 'Goiânia/GO', valor: 49150, pedidos: 372 },
  { name: 'Petshop Amigo Fiel', cidade: 'Porto Alegre/RS', valor: 38800, pedidos: 341 },
  { name: 'Salão Studio Beleza', cidade: 'Florianópolis/SC', valor: 27650, pedidos: 198 },
];

function friendlyParseError(err: any, filename: string): string {
  const msg = String(err?.message || '');
  if (/corrupt|invalid|unsupported|incomplete|zip|crc|header/i.test(msg)) {
    return `O arquivo "${filename}" parece estar corrompido ou em formato não suportado. Renomeie para .csv/.xlsx/.xls e tente novamente.`;
  }
  if (/empty|no sheet|planilhas/i.test(msg)) {
    return `O arquivo "${filename}" está vazio ou sem planilhas válidas.`;
  }
  if (/abort/i.test(msg)) {
    return 'A leitura do arquivo demorou demais e foi cancelada. Tente um arquivo menor.';
  }
  return msg ? `Não foi possível processar "${filename}": ${msg}` : `Não foi possível processar "${filename}". Verifique se o arquivo é válido.`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function readRawFile(file: File): Promise<string | ArrayBuffer> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      const timer = setTimeout(() => {
        reader.abort();
        reject(new Error('abort'));
      }, 30000);
      reader.onload = (e) => {
        clearTimeout(timer);
        resolve(e.target?.result as string | ArrayBuffer);
      };
      reader.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Falha ao ler o arquivo.'));
      };
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Falha inesperada ao ler o arquivo.'));
    }
  });
}

function parseSheetGuarded(file: File, raw: string | ArrayBuffer): ParsedSheet {
  if (raw === null || raw === undefined) throw new Error('Arquivo vazio ou ilegível.');
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
  if (isExcel) {
    const workbook = XLSX.read(raw as ArrayBuffer, { type: 'array', cellDates: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('O arquivo Excel não possui planilhas.');
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[sheetName], { defval: null });
    if (!json || json.length === 0) throw new Error('O arquivo Excel está vazio (0 linhas de dados).');
    return { rows: json, columns: Object.keys(json[0] || {}), totalRows: json.length };
  }
  const text = String(raw);
  if (!text.trim()) throw new Error('O arquivo CSV está vazio.');
  const results = Papa.parse<Record<string, any>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  if (results.errors && results.errors.length > 0 && results.data.length === 0) {
    throw new Error(`Erro ao interpretar o CSV: ${results.errors[0].message}`);
  }
  const columns = (results.meta.fields || []).map((h) => String(h).trim());
  if (results.data.length === 0) throw new Error('O arquivo CSV está vazio (0 linhas de dados).');
  return { rows: results.data, columns, totalRows: results.data.length };
}

function cleanRows(sheet: ParsedSheet): ParsedSheet {
  const cleanedRows = sheet.rows.filter((r) =>
    sheet.columns.some((c) => {
      const v = r[c];
      return v !== undefined && v !== null && String(v).trim() !== '';
    })
  );
  return {
    rows: cleanedRows,
    columns: sheet.columns.filter((c) => c.trim() !== ''),
    totalRows: cleanedRows.length,
  };
}

function buildBiData(filename: string, sheet: ParsedSheet): BiData {
  const numericColumns = sheet.columns.filter((col) => {
    const values = sheet.rows.slice(0, 60).map((r) => r[col]);
    const numeric = values.filter((v) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(String(v).replace(/[R$\s.]/g, '').replace(',', '.')))));
    return numeric.length >= Math.min(4, sheet.totalRows);
  });

  const dimensionColumn = sheet.columns.find((c) => !numericColumns.includes(c)) || sheet.columns[0];
  const metricColumn = numericColumns[0] || sheet.columns[sheet.columns.length - 1];

  const totals: { [col: string]: number } = {};
  for (const col of numericColumns) {
    totals[col] = sheet.rows.reduce((acc, r) => {
      const v = r[col];
      if (typeof v === 'number') return acc + v;
      if (typeof v === 'string') {
        const cleaned = Number(v.replace(/[R$\s.]/g, '').replace(',', '.'));
        if (!isNaN(cleaned)) return acc + cleaned;
      }
      return acc;
    }, 0);
  }

  const byMap = new Map<string, number>();
  for (const row of sheet.rows) {
    const key = String(row[dimensionColumn] ?? 'Sem valor');
    const v = row[metricColumn];
    let num = 0;
    if (typeof v === 'number') num = v;
    else if (typeof v === 'string') num = Number(v.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
    byMap.set(key, (byMap.get(key) || 0) + num);
  }
  const byCategory = Array.from(byMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return { filename, sheet, numericColumns, dimensionColumn, metricColumn, totals, byCategory };
}

function EtlPipeline({ etl }: { etl: EtlState }) {
  const stageIndex = etl.stage === 'idle' ? -1 : ETL_STAGES.findIndex((s) => s.id === etl.stage);

  return (
    <div className="bg-white/[0.03] border border-[#4f4632]/40 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[#fabd00]">
          Pipeline de Dados (ETL)
        </p>
        {etl.stage === 'done' && (
          <span className="text-[10px] text-[#4ade80] flex items-center gap-1">
            <Check className="w-3 h-3" /> Concluído
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {ETL_STAGES.map((stage, i) => {
          const state =
            stageIndex === -1 ? 'pending'
            : i < stageIndex ? 'done'
            : i === stageIndex ? 'active'
            : 'pending';
          const Icon = stage.icon;
          return (
            <div key={stage.id} className="flex-1">
              <div
                className={`rounded-xl border px-3 py-2.5 transition-all ${
                  state === 'active'
                    ? 'border-[#fabd00]/60 bg-[#fabd00]/10'
                    : state === 'done'
                    ? 'border-[#4ade80]/40 bg-[#4ade80]/5'
                    : 'border-[#4f4632]/50 bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      state === 'active'
                        ? 'bg-[#fabd00] text-[#121414]'
                        : state === 'done'
                        ? 'bg-[#4ade80]/20 text-[#4ade80]'
                        : 'bg-white/5 text-[#d4c5ab]/50'
                    }`}
                  >
                    {state === 'done' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : state === 'active' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${state === 'pending' ? 'text-[#d4c5ab]/50' : 'text-[#e3e2e2]'}`}>
                      {stage.label}
                    </p>
                    <p className="font-[family-name:var(--font-mono)] text-[9px] text-[#d4c5ab]/50 uppercase">
                      {stage.sub}
                    </p>
                  </div>
                </div>
              </div>
              {i < ETL_STAGES.length - 1 && (
                <div className={`h-0.5 mx-1 -mt-0.5 rounded-full ${i < stageIndex ? 'bg-[#4ade80]/50' : 'bg-[#4f4632]/40'}`} />
              )}
            </div>
          );
        })}
      </div>

      {etl.log.length > 0 && (
        <div className="mt-3 space-y-1">
          {etl.log.map((line, i) => (
            <p key={i} className="font-[family-name:var(--font-mono)] text-[10px] text-[#d4c5ab]/70 flex items-center gap-1.5">
              <span className="text-[#fabd00]">▸</span>
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BIExecutivePanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [bi, setBi] = useState<BiData | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [etl, setEtl] = useState<EtlState>({ stage: 'idle', activeIndex: -1, log: [] });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const demoLoadedRef = useRef(false);

  useEffect(() => {
    if (demoLoadedRef.current) return;
    demoLoadedRef.current = true;
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    setParsing(true);
    setError(null);
    setSaved(false);
    setEtl({ stage: 'extract', activeIndex: 0, log: [] });
    try {
      setEtl((prev) => ({ ...prev, log: ['Lendo dados de demonstração (vendas 2025)…'] }));
      await sleep(700);
      const sheet = buildDemoSheet();
      setEtl((prev) => ({ ...prev, stage: 'transform', activeIndex: 1, log: [...prev.log, 'Parseando dataset demo…'] }));
      await sleep(800);
      const cleaned = cleanRows(sheet);
      setEtl((prev) => ({
        ...prev,
        log: [
          ...prev.log,
          `${cleaned.columns.length} colunas detectadas`,
          `${cleaned.totalRows} linhas válidas após limpeza`,
        ],
      }));
      setEtl((prev) => ({ ...prev, stage: 'load', activeIndex: 2, log: [...prev.log, 'Detectando métricas numéricas…'] }));
      await sleep(800);
      const result = buildBiData('vendas-demo-2025.csv', cleaned);
      setEtl((prev) => ({
        ...prev,
        stage: 'done',
        activeIndex: 2,
        log: [...prev.log, `Coluna de dimensão: ${result.dimensionColumn}`, `Métrica principal: ${result.metricColumn}`, 'Dashboard executivo gerado'],
      }));
      setBi(result);
      setIsDemo(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(friendlyParseError(err, 'dados de demonstração'));
      setEtl({ stage: 'idle', activeIndex: -1, log: [] });
    } finally {
      setParsing(false);
    }
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    setError(null);
    setSaved(false);
    setBi(null);
    setIsDemo(false);
    setEtl({ stage: 'extract', activeIndex: 0, log: [] });
    try {
      if (!file.name.toLowerCase().match(/\.(csv|xlsx?)$/)) {
        throw new Error(`Formato não suportado: "${file.name}". Use .csv, .xlsx ou .xls.`);
      }
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        throw new Error(`O arquivo excede o limite de ${MAX_FILE_MB}MB. Gere uma planilha menor e tente novamente.`);
      }
      if (file.size === 0) {
        throw new Error('O arquivo está vazio (0 bytes).');
      }
      setEtl((prev) => ({ ...prev, log: [`Lendo ${file.name}…`] }));
      await sleep(700);
      const raw = await readRawFile(file);
      setEtl((prev) => ({ ...prev, log: [...prev.log, `Arquivo lido (${(file.size / 1024).toFixed(1)} KB)`] }));

      setEtl((prev) => ({ ...prev, stage: 'transform', activeIndex: 1, log: [...prev.log, 'Parseando CSV/XLSX…'] }));
      await sleep(800);
      const rawSheet = parseSheetGuarded(file, raw);
      const sheet = cleanRows(rawSheet);
      if (sheet.totalRows === 0) {
        throw new Error('Nenhuma linha válida encontrada após a limpeza dos dados.');
      }
      setEtl((prev) => ({
        ...prev,
        log: [
          ...prev.log,
          `${rawSheet.columns.length} colunas detectadas`,
          `${sheet.totalRows} linhas válidas após limpeza`,
        ],
      }));

      setEtl((prev) => ({ ...prev, stage: 'load', activeIndex: 2, log: [...prev.log, 'Detectando métricas numéricas…'] }));
      await sleep(800);
      const result = buildBiData(file.name, sheet);
      if (result.numericColumns.length === 0) {
        throw new Error('Nenhuma coluna numérica identificada. Inclua valores de venda/faturamento para gerar o dashboard.');
      }
      setEtl((prev) => ({
        ...prev,
        stage: 'done',
        activeIndex: 2,
        log: [...prev.log, `Coluna de dimensão: ${result.dimensionColumn}`, `Métrica principal: ${result.metricColumn}`, 'Dashboard executivo gerado'],
      }));
      setBi(result);
    } catch (err: any) {
      setError(friendlyParseError(err, file.name));
      setEtl({ stage: 'idle', activeIndex: -1, log: [] });
    } finally {
      setParsing(false);
    }
  };

  const submitToPipeline = async () => {
    if (!bi || !fileInputRef.current?.files?.[0]) return;
    setSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Falha no envio.');
      setSaved(true);
    } catch (err: any) {
      setError(friendlyFetchError(err, 'Erro ao enviar a planilha.'));
    } finally {
      setSubmitting(false);
    }
  };

  const openStripeCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!STRIPE_PUBLISHABLE_KEY) {
      setError('Pagamento indisponível: chave do Stripe não configurada.');
      return;
    }
    setCheckingOut(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: PAID_PRICE_CENTS,
          successUrl: `${window.location.origin}/app?checkout=success`,
          cancelUrl: `${window.location.origin}/?checkout=canceled`,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao iniciar o checkout.');
      }
      if (!data.url) throw new Error('URL de checkout não retornada pelo servidor.');
      window.location.href = data.url;
    } catch (err: any) {
      setError(friendlyFetchError(err, 'Erro ao iniciar o pagamento.'));
    } finally {
      setCheckingOut(false);
    }
  };

  const needsPayment = bi !== null && bi.sheet.totalRows > MAX_FREE_ROWS;

  return (
    <div className="glassmorphism rounded-3xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-[#fabd00]/10 border border-[#fabd00]/30 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-[#fabd00]" />
        </div>
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-[#ffe4af]">
            Dashboard Executivo de BI
          </h3>
          <p className="text-xs text-[#d4c5ab]">
            Upload CSV/XLSX — até {MAX_FREE_ROWS} linhas grátis · estilo Power BI / Qlik Sense
          </p>
        </div>
      </div>

      <EtlPipeline etl={etl} />

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {!bi && (
        <div className="mt-4 space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={parsing}
            className="w-full border-2 border-dashed border-[#fabd00]/30 hover:border-[#fabd00]/60 rounded-xl py-10 flex flex-col items-center gap-3 transition-all bg-white/[0.02] cursor-pointer"
          >
            {parsing ? (
              <Loader2 className="w-6 h-6 text-[#fabd00] animate-spin" />
            ) : (
              <FileSpreadsheet className="w-6 h-6 text-[#fabd00]" />
            )}
            <span className="text-sm text-[#e3e2e2]">{parsing ? 'Processando pipeline de dados...' : 'Clique para selecionar a planilha'}</span>
            <span className="text-[11px] text-[#d4c5ab]/60">Formatos aceitos: .csv, .xlsx, .xls · até {MAX_FILE_MB}MB</span>
          </button>
          <button
            onClick={loadDemoData}
            disabled={parsing}
            className="w-full rounded-xl border border-[#cdbdff]/40 hover:border-[#cdbdff]/70 bg-[#cdbdff]/[0.06] py-4 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {parsing ? <Loader2 className="w-4 h-4 text-[#cdbdff] animate-spin" /> : <Sparkles className="w-4 h-4 text-[#cdbdff]" />}
            <span className="text-sm text-[#e3e2e2]">Carregar Dados de Exemplo (Demonstração)</span>
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {bi && (
        <div className="space-y-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#e3e2e2] truncate max-w-[280px]">
                  {isDemo ? 'Dataset de Demonstração — Vendas 2025' : bi.filename}
                </p>
                {isDemo && (
                  <span className="text-[10px] flex items-center gap-1 bg-[#cdbdff]/10 border border-[#cdbdff]/30 text-[#cdbdff] rounded-full px-2 py-0.5 shrink-0">
                    <Sparkles className="w-3 h-3" /> Exemplo
                  </span>
                )}
              </div>
              <p className="text-xs text-[#d4c5ab]">
                <strong className="text-[#fabd00]">{bi.sheet.totalRows.toLocaleString('pt-BR')}</strong> linhas ·{' '}
                {bi.sheet.columns.length} colunas · {bi.numericColumns.length} métricas
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isDemo && !parsing && (
                <button
                  onClick={loadDemoData}
                  className="text-xs text-[#cdbdff]/80 hover:text-[#cdbdff] cursor-pointer"
                  title="Recarregar dados de exemplo"
                >
                  Regenerar exemplo
                </button>
              )}
              <button
                onClick={() => {
                  setBi(null);
                  setIsDemo(false);
                  setSaved(false);
                  setEtl({ stage: 'idle', activeIndex: -1, log: [] });
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-xs text-[#d4c5ab]/70 hover:text-[#ffe4af] cursor-pointer"
              >
                Trocar arquivo
              </button>
            </div>
          </div>

          {!needsPayment ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={submitToPipeline}
                disabled={submitting}
                className="btn-glow h-11 px-6 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Enviar para o Pipeline de Dados
              </button>
              {saved && (
                <span className="text-xs text-[#4ade80] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Dados enviados com sucesso!
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-[#fabd00]/10 border border-[#fabd00]/40 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-[#fabd00] shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-[#ffe4af] font-semibold">Planilha com mais de {MAX_FREE_ROWS} linhas</p>
                  <p className="text-[#d4c5ab] text-xs mt-1">
                    Para processamento em massa é necessário login e pagamento único de{' '}
                    <strong className="text-[#fabd00]">R$ 39,90</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={openStripeCheckout}
                disabled={checkingOut}
                className="btn-glow w-full h-12 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {user ? 'Pagar R$ 39,90 e Desbloquear' : 'Fazer Login e Pagar R$ 39,90'}
              </button>
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4 card-hover">
              <p className="font-[family-name:var(--font-mono)] text-[10px] text-[#d4c5ab]/70 uppercase tracking-widest">Linhas</p>
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#fabd00]">{bi.sheet.totalRows.toLocaleString('pt-BR')}</p>
            </div>
            {bi.numericColumns.slice(0, 3).map((col) => (
              <div key={col} className="glass-card p-4 card-hover">
                <p className="font-[family-name:var(--font-mono)] text-[10px] text-[#d4c5ab]/70 uppercase tracking-widest truncate">{col}</p>
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#4ade80]">
                  {bi.totals[col].toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>

          {/* Gráficos */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <p className="text-sm font-semibold text-[#e3e2e2] mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#fabd00]" />
                {bi.metricColumn} por {bi.dimensionColumn}
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={bi.byCategory.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#d4c5ab', fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: '#d4c5ab', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#121414', border: '1px solid rgba(250,189,0,0.3)', borderRadius: 12 }} />
                  <Bar dataKey="value" fill="#fabd00" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-5">
              <p className="text-sm font-semibold text-[#e3e2e2] mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#cdbdff]" />
                Distribuição por {bi.dimensionColumn}
              </p>
              <ResponsiveContainer width="100%" height={240}>
                <RPieChart>
                  <Pie data={bi.byCategory.slice(0, 8)} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {bi.byCategory.slice(0, 8).map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#121414', border: '1px solid rgba(250,189,0,0.3)', borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#d4c5ab' }} />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-5">
            <p className="text-sm font-semibold text-[#e3e2e2] mb-4 flex items-center gap-2">
              <LineChart className="w-4 h-4 text-[#4ade80]" />
              Tendência ({bi.metricColumn})
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <RLineChart data={bi.byCategory.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#d4c5ab', fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fill: '#d4c5ab', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#121414', border: '1px solid rgba(250,189,0,0.3)', borderRadius: 12 }} />
                <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} dot={{ fill: '#4ade80', r: 3 }} />
              </RLineChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela */}
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#121414]">
                  <tr>
                    {bi.sheet.columns.slice(0, 6).map((col) => (
                      <th key={col} className="px-4 py-3 font-[family-name:var(--font-mono)] text-[10px] text-[#fabd00] uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bi.sheet.rows.slice(0, 12).map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      {bi.sheet.columns.slice(0, 6).map((col) => (
                        <td key={col} className="px-4 py-2.5 text-xs text-[#d4c5ab] whitespace-nowrap max-w-[220px] truncate">
                          {row[col] == null ? '—' : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {isDemo && (
            <>
              <div className="glass-card p-5">
                <p className="text-sm font-semibold text-[#e3e2e2] mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#fabd00]" />
                  Vendas por Região (2025)
                </p>
                <div className="space-y-3">
                  {(() => {
                    const byRegion = new Map<string, number>();
                    for (const row of bi.sheet.rows) {
                      const region = String(row['Região'] ?? '—');
                      const val = Number(String(row['Faturamento (R$)'] ?? '0').replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
                      byRegion.set(region, (byRegion.get(region) || 0) + val);
                    }
                    const max = Math.max(...Array.from(byRegion.values()), 1);
                    return Array.from(byRegion.entries()).map(([name, value]) => (
                      <div key={name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#d4c5ab]">{name}</span>
                          <span className="text-[#ffe4af] font-mono">R$ {value.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#fabd00] to-[#5203d5] transition-all duration-700"
                            style={{ width: `${Math.max(4, (value / max) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="glass-card p-5">
                <p className="text-sm font-semibold text-[#e3e2e2] mb-4 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-[#fabd00]" />
                  Top Clientes do Mês
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] text-[#fabd00] uppercase tracking-wider">#</th>
                        <th className="px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] text-[#fabd00] uppercase tracking-wider">Cliente</th>
                        <th className="px-3 py-2 font-[family-name:var(--font-mono)] text-[10px] text-[#fabd00] uppercase tracking-wider">Cidade</th>
                        <th className="px-3 py-2 text-right font-[family-name:var(--font-mono)] text-[10px] text-[#fabd00] uppercase tracking-wider">Pedidos</th>
                        <th className="px-3 py-2 text-right font-[family-name:var(--font-mono)] text-[10px] text-[#fabd00] uppercase tracking-wider">Faturamento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {DEMO_TOP_CLIENTS.map((c, i) => (
                        <tr key={c.name} className="hover:bg-white/[0.02]">
                          <td className="px-3 py-2.5 font-mono text-xs text-[#cdbdff]">{i + 1}</td>
                          <td className="px-3 py-2.5 text-xs font-medium text-[#e3e2e2] whitespace-nowrap">{c.name}</td>
                          <td className="px-3 py-2.5 text-xs text-[#d4c5ab] whitespace-nowrap">{c.cidade}</td>
                          <td className="px-3 py-2.5 text-xs text-[#d4c5ab] text-right font-mono">{c.pedidos.toLocaleString('pt-BR')}</td>
                          <td className="px-3 py-2.5 text-xs text-[#4ade80] text-right font-mono">R$ {c.valor.toLocaleString('pt-BR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

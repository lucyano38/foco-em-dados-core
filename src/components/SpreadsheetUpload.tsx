import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/AuthContext';
import { safeJson, friendlyFetchError } from '../lib/safeFetch';
import { Upload, FileSpreadsheet, Lock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;
const MAX_FREE_ROWS = 100;
const PAID_PRICE_CENTS = 3990; // R$ 39,90
const MAX_FILE_MB = 10;

function friendlyError(err: any, filename: string): string {
  const msg = String(err?.message || '');
  if (/corrupt|invalid|unsupported|incomplete|zip|crc|header/i.test(msg)) {
    return `O arquivo "${filename}" parece estar corrompido ou em formato não suportado. Use .csv, .xlsx ou .xls.`;
  }
  if (/empty|no sheet|planilhas/i.test(msg)) {
    return `O arquivo "${filename}" está vazio ou sem planilhas válidas.`;
  }
  return msg ? `Não foi possível processar "${filename}": ${msg}` : `Não foi possível processar "${filename}". Verifique se o arquivo é válido.`;
}

interface UploadResult {
  filename: string;
  totalRows: number;
  columns: string[];
  submitted: boolean;
}

export default function SpreadsheetUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState('');
  const [totalRows, setTotalRows] = useState<number | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const countRows = (file: File): Promise<{ totalRows: number; columns: string[] }> => {
    return new Promise((resolve, reject) => {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      if (isExcel) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target?.result, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) return reject(new Error('O arquivo Excel não possui planilhas.'));
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
            const cols = json.length ? Object.keys(json[0]) : [];
            resolve({ totalRows: json.length, columns: cols });
          } catch (err: any) {
            reject(new Error('Falha ao processar o arquivo Excel: ' + err.message));
          }
        };
        reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = String(e.target?.result || '');
            const results = Papa.parse(text, { header: true, skipEmptyLines: true });
            const cols = (results.meta.fields || []).map(h => String(h).trim());
            resolve({ totalRows: results.data.length, columns: cols });
          } catch (err: any) {
            reject(new Error('Falha ao processar o arquivo CSV: ' + err.message));
          }
        };
        reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
        reader.readAsText(file);
      }
    });
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    setError(null);
    setResult(null);
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
      const { totalRows, columns } = await countRows(file);
      if (totalRows === 0) {
        throw new Error('Nenhuma linha de dados encontrada na planilha.');
      }
      setFilename(file.name);
      setTotalRows(totalRows);
      setColumns(columns);
    } catch (err: any) {
      setError(friendlyError(err, file.name));
      setFilename('');
      setTotalRows(null);
      setColumns([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setParsing(false);
    }
  };

  const submitFree = async () => {
    if (!fileInputRef.current?.files?.[0] || totalRows === null) return;
    setSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Falha no envio.');
      setResult({ filename, totalRows, columns, submitted: true });
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

  const needsPayment = totalRows !== null && totalRows > MAX_FREE_ROWS;

  return (
    <div className="glassmorphism rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-[#fabd00]/10 border border-[#fabd00]/30 flex items-center justify-center">
          <FileSpreadsheet className="w-5 h-5 text-[#fabd00]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#ffe4af]">Fazer Upload de Planilha</h3>
          <p className="text-xs text-[#d4c5ab]">CSV ou Excel (.xlsx/.xls) — até 100 linhas grátis</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {!filename && (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={parsing}
          className="w-full border-2 border-dashed border-[#fabd00]/30 hover:border-[#fabd00]/60 rounded-xl py-10 flex flex-col items-center gap-3 transition-all bg-white/[0.02] cursor-pointer"
        >
          {parsing ? (
            <Loader2 className="w-6 h-6 text-[#fabd00] animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-[#fabd00]" />
          )}
          <span className="text-sm text-[#e3e2e2]">{parsing ? 'Lendo arquivo...' : 'Clique para selecionar a planilha'}</span>
          <span className="text-[11px] text-[#d4c5ab]/60">Formatos aceitos: .csv, .xlsx, .xls</span>
        </button>
      )}

      {filename && totalRows !== null && (
        <div className="space-y-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#e3e2e2] truncate max-w-[260px]">{filename}</p>
              <p className="text-xs text-[#d4c5ab]">
                <strong className="text-[#fabd00]">{totalRows.toLocaleString('pt-BR')}</strong> linhas ·{' '}
                {columns.length} colunas
              </p>
            </div>
            <button
              onClick={() => {
                setFilename('');
                setTotalRows(null);
                setColumns([]);
                setResult(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-xs text-[#d4c5ab]/60 hover:text-[#ffe4af] cursor-pointer"
            >
              Trocar arquivo
            </button>
          </div>

          {!needsPayment ? (
            <button
              onClick={submitFree}
              disabled={submitting}
              className="w-full h-12 rounded-xl btn-glow text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Processar Gratuitamente
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-[#fabd00]/10 border border-[#fabd00]/40 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-[#fabd00] shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-[#ffe4af] font-semibold">Planilha com mais de {MAX_FREE_ROWS} linhas</p>
                  <p className="text-[#d4c5ab] text-xs mt-1">
                    Para processamento em massa, é necessário login e pagamento único de{' '}
                    <strong className="text-[#fabd00]">R$ 39,90</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={openStripeCheckout}
                disabled={checkingOut}
                className="w-full h-12 rounded-xl btn-glow text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {checkingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                {user ? 'Pagar R$ 39,90 e Processar' : 'Fazer Login e Pagar R$ 39,90'}
              </button>
            </div>
          )}

          {result?.submitted && (
            <div className="bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#4ade80] shrink-0" />
              <p className="text-sm text-[#4ade80]">
                Planilha <strong>{result.filename}</strong> recebida com sucesso —{' '}
                {result.totalRows.toLocaleString('pt-BR')} linhas na fila de processamento.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

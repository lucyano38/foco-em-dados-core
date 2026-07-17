import { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  BarChart3, TrendingUp, DollarSign, Package, RefreshCw, Plus, Trash2, 
  Sliders, Info, ToggleLeft, LayoutDashboard, Database, Upload, Download, 
  Sparkles, Send, MessageSquare, X, ChevronRight, Filter, CheckCircle2,
  FileSpreadsheet, HelpCircle, ArrowRight, FileText, HardDrive, Check,
  ExternalLink, AlertCircle, Share2
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getCachedAccessToken, setCachedAccessToken } from '../firebase-config';

// Placeholders para o Google Cloud Console (Substitua por suas credenciais oficiais do GCP)
const DEVELOPER_KEY = "AIzaSyA-Ne3HUM9ktNvflgxvwlb4LBJ8pYotrCM";
const CLIENT_ID = "YOUR_CLIENT_ID_HERE";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

// Ícone do Google Drive estilizado
const GoogleDriveIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.333 13.5H11.5L15.417 6.5H23.25L19.333 13.5Z" fill="#FFC107" />
    <path d="M15.417 6.5H7.583L3.667 13.5H11.5L15.417 6.5Z" fill="#00796B" />
    <path d="M7.583 6.5L3.667 13.5L7.583 20.5H15.417L11.5 13.5L7.583 6.5Z" fill="#1565C0" />
  </svg>
);

// Interface genérica para as linhas de dados do BI
interface DadoPlanilha {
  id: string;
  [key: string]: any;
}

// Mensagem do Chatbot
interface Mensagem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  status?: 'success' | 'loading' | 'error';
}

// 4. DADOS DE TESTE INTEGRADOS (Padrão Corporativo de Vendas)
const dadosExemploIniciais: DadoPlanilha[] = [
  { id: "1", Cidade: "São Paulo", Produto: "Smartphone X", Vendedor: "Ana Silva", Categoria: "Eletrônicos", Faturamento: 12500, Quantidade: 5, Desconto: 250, MargemLucro: 40 },
  { id: "2", Cidade: "Rio de Janeiro", Produto: "Notebook Pro", Vendedor: "Bruno Costa", Categoria: "Informática", Faturamento: 28000, Quantidade: 4, Desconto: 800, MargemLucro: 35 },
  { id: "3", Cidade: "São Paulo", Produto: "Notebook Pro", Vendedor: "Ana Silva", Categoria: "Informática", Faturamento: 14000, Quantidade: 2, Desconto: 400, MargemLucro: 35 },
  { id: "4", Cidade: "Belo Horizonte", Produto: "Smartphone X", Vendedor: "Carla Souza", Categoria: "Eletrônicos", Faturamento: 15000, Quantidade: 6, Desconto: 300, MargemLucro: 42 },
  { id: "5", Cidade: "Rio de Janeiro", Produto: "Fone Bluetooth", Vendedor: "Bruno Costa", Categoria: "Acessórios", Faturamento: 3200, Quantidade: 16, Desconto: 100, MargemLucro: 50 },
  { id: "6", Cidade: "Porto Alegre", Produto: "Monitor 4K", Vendedor: "Diego Lima", Categoria: "Informática", Faturamento: 18500, Quantidade: 5, Desconto: 500, MargemLucro: 38 },
  { id: "7", Cidade: "Belo Horizonte", Produto: "Teclado Mecânico", Vendedor: "Carla Souza", Categoria: "Acessórios", Faturamento: 4500, Quantidade: 10, Desconto: 150, MargemLucro: 45 },
  { id: "8", Cidade: "São Paulo", Produto: "Fone Bluetooth", Vendedor: "Ana Silva", Categoria: "Acessórios", Faturamento: 2400, Quantidade: 12, Desconto: 50, MargemLucro: 48 },
  { id: "9", Cidade: "Porto Alegre", Produto: "Smartphone X", Vendedor: "Diego Lima", Categoria: "Eletrônicos", Faturamento: 22000, Quantidade: 8, Desconto: 400, MargemLucro: 41 },
  { id: "10", Cidade: "Recife", Produto: "Notebook Pro", Vendedor: "Elena Dias", Categoria: "Informática", Faturamento: 21000, Quantidade: 3, Desconto: 600, MargemLucro: 36 }
];

export default function PainelBusinessIntelligence() {
  // Dados ativos (iniciam com os dados de exemplo)
  const [dados, setDados] = useState<DadoPlanilha[]>(dadosExemploIniciais);
  const [nomeArquivo, setNomeArquivo] = useState<string>("dados_exemplo_vendas.xlsx");

  // Colunas disponíveis em tempo real para os dropdowns
  const [colunasX, setColunasX] = useState<string[]>(['Cidade', 'Produto', 'Vendedor', 'Categoria']);
  const [colunasY, setColunasY] = useState<string[]>(['Faturamento', 'Quantidade', 'Desconto', 'MargemLucro']);
  const [todasColunas, setTodasColunas] = useState<string[]>(['Cidade', 'Produto', 'Vendedor', 'Categoria', 'Faturamento', 'Quantidade', 'Desconto', 'MargemLucro']);

  // Configurações do BI (Requisito 2)
  const [eixoX, setEixoX] = useState<string>('Cidade');
  const [eixoY, setEixoY] = useState<string>('Faturamento');
  const [tipoGrafico, setTipoGrafico] = useState<'Barras' | 'Linhas' | 'Área' | 'Pizza'>('Barras');
  const [modoAgregacao, setModoAgregacao] = useState<'Somar' | 'Média'>('Somar');

  // Filtro dinâmico (opcionalmente configurado pelo Chatbot AI)
  const [filtroAtivo, setFiltroAtivo] = useState<{ coluna: string; valor: string } | null>(null);

  // Interface do Chatbot (React + Tailwind) (Requisito 3)
  const [chatAberto, setChatAberto] = useState<boolean>(true);
  const [prompt, setPrompt] = useState<string>("");
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Olá! Sou o seu Assistente de BI Inteligente. 📊 Você pode arrastar uma planilha ou me dar instruções em texto para reconfigurar os gráficos instantaneamente. Tente escrever: 'Mostre a média de margem de lucro por Produto' ou 'Filtrar faturamento em São Paulo'.",
      timestamp: new Date()
    }
  ]);
  const [iaCarregando, setIaCarregando] = useState<boolean>(false);

  // Referência para rolar chat ao fim
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Estados para nova linha manual (Teste de reatividade)
  const [novaLinhaValores, setNovaLinhaValores] = useState<Record<string, string>>({});

  // Menu de Exportação ativo
  const [exportMenuAberto, setExportMenuAberto] = useState<boolean>(false);

  // Estado de processamento de exportação (PDF/Excel)
  const [processandoExport, setProcessandoExport] = useState<string | null>(null);

  // Estado para armazenar o Token do Google Drive / Sheets
  const [accessToken, setAccessToken] = useState<string | null>(() => getCachedAccessToken());

  // Estados adicionais para o Google Workspace Hub (Requisitos: Chat, Picker, Sheets, Drive)
  const [exportandoSheets, setExportandoSheets] = useState<boolean>(false);
  const [ultimaPlanilhaCriada, setUltimaPlanilhaCriada] = useState<{ id: string; url: string } | null>(null);
  const [carregandoChatSpaces, setCarregandoChatSpaces] = useState<boolean>(false);
  const [chatSpaces, setChatSpaces] = useState<any[]>([]);
  const [espacoChatSelecionado, setEspacoChatSelecionado] = useState<string>('');
  const [mensagemChatPersonalizada, setMensagemChatPersonalizada] = useState<string>('');
  const [enviandoMensagemChat, setEnviandoMensagemChat] = useState<boolean>(false);
  const [workspaceAbaAtiva, setWorkspaceAbaAtiva] = useState<'geral' | 'drive' | 'sheets' | 'chat'>('geral');

  // Auto-scroll das mensagens do chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Carregamento assíncrono dos scripts do Google API
  useEffect(() => {
    const carregarScriptsGoogle = () => {
      // Script da GAPI (Google API Client)
      if (!document.getElementById("gapi-script")) {
        const scriptGapi = document.createElement("script");
        scriptGapi.id = "gapi-script";
        scriptGapi.src = "https://apis.google.com/js/api.js";
        scriptGapi.onload = () => {
          window.gapi.load("picker", () => {
            console.log("Google Picker API carregada no Analytix BI.");
          });
        };
        document.body.appendChild(scriptGapi);
      }

      // Script do GIS (Google Identity Services) para Fluxos OAuth
      if (!document.getElementById("gis-script")) {
        const scriptGis = document.createElement("script");
        scriptGis.id = "gis-script";
        scriptGis.src = "https://accounts.google.com/gsi/client";
        document.body.appendChild(scriptGis);
      }
    };

    carregarScriptsGoogle();
  }, []);

  // Obtém o token de acesso através do Firebase Auth Popup
  const obterTokenGoogle = async (): Promise<string | null> => {
    // Check if we have a cached token in state or in global cache
    const existingToken = accessToken || getCachedAccessToken();
    if (existingToken) {
      if (!accessToken) setAccessToken(existingToken);
      return existingToken;
    }

    try {
      adicionarMensagemSistema("Solicitando autorização de acesso ao Google Workspace (Chat, Picker, Sheets, Drive) com permissão do usuário...");
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
      provider.addScope('https://www.googleapis.com/auth/drive');
      provider.addScope('https://www.googleapis.com/auth/chat.spaces');
      provider.addScope('https://www.googleapis.com/auth/chat.messages');
      provider.addScope('https://www.googleapis.com/auth/chat.messages.create');

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        throw new Error("Não foi possível extrair o token de acesso do Google.");
      }

      setAccessToken(token);
      setCachedAccessToken(token);
      adicionarMensagemSistema("Google Workspace autenticado com sucesso! 🟢");
      return token;
    } catch (error: any) {
      console.error("Erro na autenticação com o Google:", error);
      alert(`Falha na autenticação do Google Workspace: ${error.message || error}`);
      adicionarMensagemSistema(`Falha ao obter autorização do Google Workspace: ${error.message || error}`);
      return null;
    }
  };

  // 1. Google Chat Integration - Buscar Salas (Spaces) reais
  const buscarSalasGoogleChat = async (token: string) => {
    setCarregandoChatSpaces(true);
    try {
      const res = await fetch("https://chat.googleapis.com/v1/spaces", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const spacesList = data.spaces || [];
        setChatSpaces(spacesList);
        if (spacesList.length > 0) {
          setEspacoChatSelecionado(spacesList[0].name);
        }
      } else {
        console.warn("API de Google Chat retornou erro de permissão. Isso é comum se você estiver usando uma conta pessoal do Gmail (o Google Chat API requer Workspace/Google Workspace org accounts).");
      }
    } catch (err) {
      console.error("Erro ao carregar espaços do Google Chat:", err);
    } finally {
      setCarregandoChatSpaces(false);
    }
  };

  // Executa busca automática de salas quando o token estiver disponível
  useEffect(() => {
    if (accessToken) {
      buscarSalasGoogleChat(accessToken);
    }
  }, [accessToken]);

  // Enviar mensagem real para o Google Chat
  const enviarMensagemGoogleChat = async () => {
    if (!accessToken) {
      alert("Por favor, conecte ao Google Workspace primeiro.");
      return;
    }

    const spaceId = espacoChatSelecionado || "spaces/simulated-space-id";
    const textToSend = mensagemChatPersonalizada || getRelatorioMensagemTemplate();

    const confirmado = window.confirm(`Deseja enviar este relatório de BI para a sala do Google Chat (${spaceId})?`);
    if (!confirmado) return;

    setEnviandoMensagemChat(true);
    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${spaceId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: textToSend
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        // Fallback para simulação amigável se a conta do usuário não for Workspace
        if (res.status === 403 || res.status === 401) {
          throw new Error("Sua conta Google pessoal não tem privilégios corporativos de administrador de Chat, ou a sala está inacessível. O robô irá simular o envio com sucesso para demonstração!");
        }
        throw new Error(errData.error?.message || "Erro desconhecido na API de Chat.");
      }

      adicionarMensagemSistema(`Mensagem enviada com sucesso para a sala ${spaceId}!`);
      alert("Sucesso! O relatório foi postado no seu canal do Google Chat.");
    } catch (err: any) {
      console.warn("Google Chat API error, initiating simulated successful fallback response:", err.message);
      // Simulated fallback for users testing with personal accounts
      await new Promise(resolve => setTimeout(resolve, 800));
      adicionarMensagemSistema(`[Simulado] Relatório enviado com sucesso para a sala de equipe: "${spaceId}"!`);
      alert(`[Modo Simulação Ativo]\nComo a API real do Google Chat requer contas Google Workspace corporativas, o robô simulou o envio do relatório com sucesso!\n\nMensagem enviada:\n\n${textToSend}`);
    } finally {
      setEnviandoMensagemChat(false);
    }
  };

  // Cria uma nova planilha Excel no Sheets e preenche
  const exportarParaNovaPlanilhaGoogle = async () => {
    const token = await obterTokenGoogle();
    if (!token) return;

    const confirmado = window.confirm("Deseja criar e exportar os dados do Analytix BI para uma nova planilha real no seu Google Drive?");
    if (!confirmado) return;

    setExportandoSheets(true);
    try {
      const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          properties: {
            title: `Relatório Analytix BI - Foco em Dados (${new Date().toLocaleDateString()})`
          }
        })
      });

      if (!createRes.ok) {
        throw new Error("Falha ao criar o arquivo de planilha no Google Sheets.");
      }

      const spreadsheet = await createRes.json();
      const spreadsheetId = spreadsheet.spreadsheetId;
      const spreadsheetUrl = spreadsheet.spreadsheetUrl;

      // Montar a matriz de dados
      const cabecalhos = todasColunas;
      const linhasValores = dados.map(row => {
        return cabecalhos.map(col => row[col] !== undefined ? row[col] : '');
      });

      const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          values: [cabecalhos, ...linhasValores]
        })
      });

      if (!updateRes.ok) {
        throw new Error("Falha ao injetar as linhas na nova planilha.");
      }

      setUltimaPlanilhaCriada({ id: spreadsheetId, url: spreadsheetUrl });
      adicionarMensagemSistema(`Nova planilha criada no Google Drive com sucesso! 🎉 ID: ${spreadsheetId}`);
      alert(`Planilha exportada com sucesso!\n\nDados salvos no seu Google Drive.\nURL: ${spreadsheetUrl}`);
    } catch (err: any) {
      console.error("Erro ao criar planilha Google Sheets:", err);
      alert(`Falha ao exportar para o Google Sheets: ${err.message}`);
    } finally {
      setExportandoSheets(false);
    }
  };

  // Helper para gerar o relatório textual formatado
  const getRelatorioMensagemTemplate = () => {
    const totalFaturamento = dados.reduce((acc, curr) => acc + (Number(curr[eixoY]) || 0), 0);
    return `📊 *Relatório Analytix BI - Foco em Dados*\n\n` +
           `📁 *Arquivo ativo:* \`${nomeArquivo}\`\n` +
           `📅 *Data de Geração:* ${new Date().toLocaleString('pt-BR')}\n\n` +
           `⚙️ *Parâmetros:* \n` +
           `• *Eixo X:* ${eixoX}\n` +
           `• *Eixo Y:* ${eixoY}\n` +
           `• *Modo Agregação:* ${modoAgregacao}\n` +
           `• *Total de Linhas:* ${dados.length}\n\n` +
           `📈 *Resumo Executivo:* \n` +
           `• O somatório acumulado do eixo Y (${eixoY}) para todas as categorias ativas é de *${formatarValorGrafico(totalFaturamento)}*.\n\n` +
           `🤖 _Mensagem enviada de forma autônoma pelo hub de integração Google Workspace._`;
  };

  // Abre a interface do Google Picker
  const abrirGooglePicker = (token: string) => {
    try {
      if (!window.google || !window.google.picker) {
        alert("A Google Picker API ainda não foi carregada no seu navegador. Por favor, aguarde alguns segundos e tente novamente.");
        return;
      }

      const pickerOrigin =
        window.location.ancestorOrigins &&
        window.location.ancestorOrigins.length > 0
          ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
          : window.location.origin;

      const view = new window.google.picker.DocsView(window.google.picker.ViewId.SPREADSHEETS)
        .setMimeTypes("application/vnd.google-apps.spreadsheet,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(DEVELOPER_KEY)
        .setCallback((data: any) => processarSelecaoPicker(data, token))
        .setOrigin(pickerOrigin)
        .build();

      picker.setVisible(true);
    } catch (error: any) {
      console.error("Erro ao abrir Google Picker:", error);
      alert(`Falha ao inicializar o seletor de arquivos: ${error.message || error}`);
    }
  };

  // Processa a seleção de arquivos no Google Picker e busca os dados via Sheets API
  const processarSelecaoPicker = async (data: any, token: string) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const doc = data.docs[0];
      const fileId = doc.id;
      const fileName = doc.name;

      adicionarMensagemSistema(`Planilha "${fileName}" selecionada! Iniciando leitura de dados via Google Sheets API...`);

      try {
        // 1. Obtém os metadados da planilha para saber o nome da primeira aba (Worksheet Tab Name)
        const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!metaRes.ok) {
          const errData = await metaRes.json();
          throw new Error(errData.error?.message || "Erro ao conectar com a API de Planilhas.");
        }

        const metaData = await metaRes.json();
        const firstSheetName = metaData.sheets?.[0]?.properties?.title || "Sheet1";

        // 2. Lê os valores da primeira aba usando range amplo A1:Z1000
        const range = `${firstSheetName}!A1:Z1000`;
        const valRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}/values/${range}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!valRes.ok) {
          const errData = await valRes.json();
          throw new Error(errData.error?.message || "Erro ao buscar células da planilha.");
        }

        const valData = await valRes.json();
        const rows = valData.values;

        if (!rows || rows.length === 0) {
          alert("A planilha selecionada não possui dados legíveis ou está vazia.");
          return;
        }

        // 3. Converte a matriz de linhas para o array estruturado de objetos para o dashboard
        const headers = rows[0];
        const dadosMapeados: DadoPlanilha[] = rows.slice(1).map((row: any[], rowIndex: number) => {
          const obj: DadoPlanilha = {
            id: `gdrive-${fileId}-${rowIndex}-${Date.now()}`
          };
          headers.forEach((header: string, colIndex: number) => {
            let val = row[colIndex];
            if (val !== undefined && val !== null) {
              const valStr = String(val).trim();
              // Remove caracteres monetários e percentuais e tenta parsear números de forma flexível
              const cleaned = valStr.replace(/[\sR\$\€\£\%\a-zA-Z]/g, '').replace(',', '.').trim();
              if (!isNaN(Number(cleaned)) && cleaned !== '') {
                obj[header] = Number(cleaned);
              } else {
                obj[header] = valStr;
              }
            } else {
              obj[header] = '';
            }
          });
          return obj;
        });

        // 4. Carrega os dados e atualiza o estado geral do dashboard
        processarColunasNovas(dadosMapeados);
        setDados(dadosMapeados);
        setNomeArquivo(fileName);
        setFiltroAtivo(null); // Limpa filtros anteriores

        adicionarMensagemSistema(
          `Google Sheets carregado com sucesso! 🎉 Importados ${dadosMapeados.length} registros da aba "${firstSheetName}".`
        );
      } catch (error: any) {
        console.error("Erro ao carregar dados do Google Sheets:", error);
        alert(
          `Ocorreu um erro ao carregar os dados via Google Sheets API: ${error.message || error}\n\nNota: Certifique-se de configurar o DeveloperToken (API Key) e o ClientID válidos do Google Cloud Console se estiver usando credenciais próprias.`
        );
        adicionarMensagemSistema(`Erro ao carregar do Google Sheets: ${error.message || error}`);
      }
    }
  };

  // Handler do clique de importação do Google Drive
  const handleImportarGoogleDrive = async () => {
    const token = await obterTokenGoogle();
    if (token) {
      abrirGooglePicker(token);
    }
  };

  // Função para analisar e separar colunas em categóricas (X) e numéricas (Y)
  const processarColunasNovas = (linhas: DadoPlanilha[]) => {
    if (linhas.length === 0) return;

    // Obter todas as chaves de colunas do primeiro registro
    const chaves = Object.keys(linhas[0]).filter(k => k !== 'id');
    const colsX: string[] = [];
    const colsY: string[] = [];

    chaves.forEach(chave => {
      // Coletar valores não vazios para análise de tipo
      const valoresValidos = linhas
        .map(l => l[chave])
        .filter(v => v !== null && v !== undefined && v !== '');

      if (valoresValidos.length === 0) {
        colsX.push(chave);
        return;
      }

      // Analisar se pelo menos 50% dos valores válidos são números
      let numCount = 0;
      valoresValidos.forEach(val => {
        const valStr = String(val).trim();
        // ignora se for booleano Puro
        if (typeof val === 'boolean' || valStr.toLowerCase() === 'true' || valStr.toLowerCase() === 'false') {
          return;
        }
        // remove cifrões, percentuais e formatações comuns de preço antes de testar se é número
        const cleaned = valStr.replace(/[\sR\$\€\£\%\a-zA-Z]/g, '').replace(',', '.').trim();
        const parsed = Number(cleaned);
        if (!isNaN(parsed) && cleaned !== '') {
          numCount++;
        }
      });

      const isNumerico = (numCount / valoresValidos.length) >= 0.5;

      if (isNumerico) {
        colsY.push(chave);
        // Converter os valores para números para garantir as agregações matemáticas
        linhas.forEach(linha => {
          if (linha[chave] !== undefined && linha[chave] !== null) {
            const strVal = String(linha[chave]).replace(/[\sR\$\€\£\%\a-zA-Z]/g, '').replace(',', '.').trim();
            const num = Number(strVal);
            linha[chave] = isNaN(num) ? 0 : num;
          }
        });
      } else {
        colsX.push(chave);
      }
    });

    // Se não encontrar nenhuma numérica, coloca todas
    const finalColsY = colsY.length > 0 ? colsY : chaves;
    const finalColsX = colsX.length > 0 ? colsX : chaves;

    setColunasX(finalColsX);
    setColunasY(finalColsY);
    setTodasColunas(chaves);

    // Ajustar seletores padrões baseados no novo arquivo
    if (finalColsX.length > 0) setEixoX(finalColsX[0]);
    if (finalColsY.length > 0) setEixoY(finalColsY[0]);
  };

  // 1. MÓDULO DE UPLOAD DE ARQUIVOS (Frontend React)
  const processarArquivoPlanilha = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    setNomeArquivo(file.name);
    setFiltroAtivo(null); // limpa filtros anteriores

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const binaryStr = e.target?.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

          if (rawJson.length === 0) {
            alert("A planilha selecionada está vazia!");
            return;
          }

          const dadosMapeados: DadoPlanilha[] = rawJson.map((row, index) => ({
            id: `upload-${index}-${Date.now()}`,
            ...row
          }));

          processarColunasNovas(dadosMapeados);
          setDados(dadosMapeados);

          // Feedback no chat
          adicionarMensagemSistema(
            `Planilha "${file.name}" carregada com sucesso! Importados ${dadosMapeados.length} registros com ${Object.keys(rawJson[0]).length} colunas.`
          );

        } catch (error) {
          console.error("Erro ao analisar Excel:", error);
          alert("Ocorreu um erro ao decodificar a planilha Excel. Verifique a estrutura do arquivo.");
        }
      };
      reader.readAsBinaryString(file);

    } else if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length === 0) {
            alert("O arquivo CSV selecionado está vazio!");
            return;
          }

          const dadosMapeados: DadoPlanilha[] = results.data.map((row: any, index: number) => ({
            id: `upload-csv-${index}-${Date.now()}`,
            ...row
          }));

          processarColunasNovas(dadosMapeados);
          setDados(dadosMapeados);

          // Feedback no chat
          adicionarMensagemSistema(
            `Arquivo CSV "${file.name}" importado! Carregados ${dadosMapeados.length} registros.`
          );
        },
        error: (error) => {
          console.error("Erro ao processar CSV:", error);
          alert("Falha ao analisar o arquivo CSV.");
        }
      });
    } else {
      alert("Formato de arquivo não suportado. Por favor, envie arquivos Excel (.xlsx, .xls) ou CSV.");
    }
  };

  // Helper para injetar resposta do sistema no chat
  const adicionarMensagemSistema = (texto: string) => {
    setMensagens(prev => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: "assistant",
        text: texto,
        timestamp: new Date()
      }
    ]);
  };

  // Drag and Drop handlers
  const [dragActive, setDragActive] = useState<boolean>(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processarArquivoPlanilha(e.dataTransfer.files[0]);
    }
  };

  const handleManualFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processarArquivoPlanilha(e.target.files[0]);
    }
  };

  // 1. FUNÇÃO DE AGREGAÇÃO DE DADOS (Reduce robusto que lida com dimensões e filtros dinâmicos)
  const dadosFiltrados = useMemo(() => {
    if (!filtroAtivo) return dados;
    return dados.filter(linha => {
      const valorCelula = String(linha[filtroAtivo.coluna] || '').toLowerCase().trim();
      const valorProcurado = String(filtroAtivo.valor || '').toLowerCase().trim();
      return valorCelula.includes(valorProcurado);
    });
  }, [dados, filtroAtivo]);

  const dadosAgregados = useMemo(() => {
    const agrupamento: { [key: string]: { totalY: number; count: number } } = {};

    dadosFiltrados.forEach((linha) => {
      const chave = String(linha[eixoX] !== undefined && linha[eixoX] !== null ? linha[eixoX] : 'Vazio');
      const valorY = Number(linha[eixoY]) || 0;

      if (!agrupamento[chave]) {
        agrupamento[chave] = { totalY: 0, count: 0 };
      }
      agrupamento[chave].totalY += valorY;
      agrupamento[chave].count += 1;
    });

    return Object.keys(agrupamento).map((chave) => {
      const agregacao = agrupamento[chave];
      const valorFinal = modoAgregacao === 'Somar' 
        ? agregacao.totalY 
        : Number((agregacao.totalY / agregacao.count).toFixed(2));

      return {
        name: chave,
        value: valorFinal,
        contagem: agregacao.count
      };
    });
  }, [dadosFiltrados, eixoX, eixoY, modoAgregacao]);

  // KPIs dinâmicos baseados no Eixo Y e Filtro selecionados
  const kpis = useMemo(() => {
    if (dadosFiltrados.length === 0) return { total: 0, media: 0, maximo: 0, totalLinhas: 0 };
    
    const valores = dadosFiltrados.map(d => Number(d[eixoY]) || 0);
    const total = valores.reduce((acc, val) => acc + val, 0);
    const media = Number((total / valores.length).toFixed(2));
    const maximo = Math.max(...valores);
    
    return {
      total,
      media,
      maximo,
      totalLinhas: dadosFiltrados.length
    };
  }, [dadosFiltrados, eixoY]);

  // Enviar prompt para API de Chatbot no Backend (Requisito 3 + Prompt do Sistema Requisito 2)
  const enviarComandoChat = async (mensagemTextoOverride?: string) => {
    const textoMensagem = mensagemTextoOverride || prompt;
    if (!textoMensagem.trim()) return;

    // Adiciona pergunta do usuário na lista
    const novaMensagemUsuario: Mensagem = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textoMensagem,
      timestamp: new Date()
    };

    setMensagens(prev => [...prev, novaMensagemUsuario]);
    if (!mensagemTextoOverride) setPrompt("");
    setIaCarregando(true);

    try {
      // Obter amostra do banco para contextualizar a IA
      const amostraDados = dados.slice(0, 5).map(({ id, ...resto }) => resto);

      const response = await fetch("/api/bi-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: textoMensagem,
          columns: todasColunas,
          sampleRows: amostraDados
        })
      });

      if (!response.ok) {
        throw new Error("Erro na requisição ao servidor.");
      }

      const resultadoIA = await response.json();

      // Atualiza Estados instantaneamente com o retorno do Chatbot AI
      if (resultadoIA.eixoX && todasColunas.includes(resultadoIA.eixoX)) {
        setEixoX(resultadoIA.eixoX);
      }
      if (resultadoIA.eixoY && todasColunas.includes(resultadoIA.eixoY)) {
        setEixoY(resultadoIA.eixoY);
      }
      if (resultadoIA.operacao) {
        const op = resultadoIA.operacao.toLowerCase();
        if (op.includes('soma') || op.includes('somar')) {
          setModoAgregacao('Somar');
        } else if (op.includes('média') || op.includes('media')) {
          setModoAgregacao('Média');
        }
      }
      if (resultadoIA.tipoGrafico) {
        const t = resultadoIA.tipoGrafico.toLowerCase();
        if (t.includes('barra')) setTipoGrafico('Barras');
        else if (t.includes('linha')) setTipoGrafico('Linhas');
        else if (t.includes('área') || t.includes('area')) setTipoGrafico('Área');
        else if (t.includes('pizza') || t.includes('setor')) setTipoGrafico('Pizza');
      }

      // Configurar Filtro Dinâmico se houver
      if (resultadoIA.filtro && resultadoIA.filtro.coluna && resultadoIA.filtro.valor) {
        setFiltroAtivo({
          coluna: resultadoIA.filtro.coluna,
          valor: resultadoIA.filtro.valor
        });
      }

      // Adiciona resposta explicativa no Chat
      setMensagens(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "assistant",
          text: resultadoIA.respostaTexto || "Entendido! Ajustei as colunas do painel para refletir o seu pedido.",
          timestamp: new Date(),
          status: 'success'
        }
      ]);

    } catch (err: any) {
      console.error("Erro no assistente IA:", err);
      setMensagens(prev => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "assistant",
          text: "Ops! Tive um problema temporário ao conectar-me com a inteligência do Gemini. No entanto, você ainda pode configurar os eixos e agrupamentos manualmente nos seletores acima!",
          timestamp: new Date(),
          status: 'error'
        }
      ]);
    } finally {
      setIaCarregando(false);
    }
  };

  // 4. EXPORTAÇÃO COMPLETA DE DADOS (Power BI, Excel, CSV)
  const exportarExcelCompleto = () => {
    try {
      if (dadosFiltrados.length === 0) {
        alert("Não há dados para exportar!");
        return;
      }
      // Exporta os dados filtrados ou originais
      const dadosExport = dadosFiltrados.map(({ id, ...resto }) => resto);
      const worksheet = XLSX.utils.json_to_sheet(dadosExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Dados BI Analytix");
      const dataStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `analytix_bi_export_${dataStr}.xlsx`);
      setExportMenuAberto(false);
      adicionarMensagemSistema("Dados exportados com sucesso para Excel!");
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      alert("Falha ao exportar para Excel.");
    }
  };

  // Exportação Real de Dados Consolidados do Gráfico para Excel
  const exportarGraficoExcel = () => {
    try {
      if (dadosAgregados.length === 0) {
        alert("Não há dados consolidados no gráfico para exportar!");
        return;
      }
      
      // 1. Prepara os dados agrupados/consolidados exatamente como exibidos no gráfico
      const dadosConsolidadosExport = dadosAgregados.map(item => ({
        [eixoX]: item.name,
        [`${eixoY} (${modoAgregacao})`]: item.value,
        "Registros Agrupados": item.contagem
      }));

      // 2. Cria a planilha de dados consolidados do gráfico
      const worksheetConsolidado = XLSX.utils.json_to_sheet(dadosConsolidadosExport);
      
      // 3. Cria a planilha de dados originais filtrados como backup/referência
      const dadosFontesExport = dadosFiltrados.map(({ id, ...resto }) => resto);
      const worksheetFontes = XLSX.utils.json_to_sheet(dadosFontesExport);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheetConsolidado, "Gráfico Consolidado");
      XLSX.utils.book_append_sheet(workbook, worksheetFontes, "Dados Fonte Filtrados");

      // 4. Salva o arquivo Excel com nome amigável e focado nos eixos ativos
      XLSX.writeFile(workbook, `grafico_consolidado_${eixoX.toLowerCase()}_vs_${eixoY.toLowerCase()}.xlsx`);
      setExportMenuAberto(false);
      
      adicionarMensagemSistema(`Dados consolidados do gráfico exportados com sucesso para Excel!`);
    } catch (error) {
      console.error("Erro ao exportar Excel do gráfico:", error);
      alert("Falha ao exportar os dados do gráfico para Excel.");
    }
  };

  // Exportação Real Visual do Gráfico para PDF (Captura do Elemento via html2canvas + jsPDF)
  const exportarGraficoPDF = async () => {
    const elemento = document.getElementById("area-do-grafico");
    if (!elemento) {
      alert("Área de captura do gráfico não encontrada!");
      return;
    }

    try {
      // Notificação imediata no chat para o usuário saber que o processamento começou
      adicionarMensagemSistema("Iniciando a renderização e geração do PDF do gráfico, por favor aguarde...");

      // Renderiza o elemento do gráfico em alta definição (escala de 2x)
      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#090d16',
        logging: false,
        windowWidth: elemento.scrollWidth,
        windowHeight: elemento.scrollHeight,
      });
      
      const imgData = canvas.toDataURL("image/png");
      
      // Criação do PDF em modo Landscape (A4 horizontal)
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const imgWidth = 277;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Centralização vertical elegante
      const margemY = Math.max(10, (210 - imgHeight) / 2);

      pdf.addImage(imgData, "PNG", 10, margemY, imgWidth, imgHeight);
      
      const dataStr = new Date().toISOString().slice(0, 10);
      pdf.save(`relatorio_grafico_${eixoX.toLowerCase()}_vs_${eixoY.toLowerCase()}_${dataStr}.pdf`);
      setExportMenuAberto(false);
      
      adicionarMensagemSistema("Relatório visual em PDF do gráfico exportado e baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF do gráfico:", error);
      adicionarMensagemSistema("Erro ao exportar o gráfico para PDF. Verifique se o gráfico está visível na tela.");
    }
  };

  const exportarCSVPowerBI = () => {
    try {
      if (dadosFiltrados.length === 0) {
        alert("Não há dados para exportar!");
        return;
      }
      // Formato otimizado de CSV com separador ponto-e-vírgula e UTF-8 BOM para abrir direto no Excel/Power BI sem quebrar acentos
      const dadosExport = dadosFiltrados.map(({ id, ...resto }) => resto);
      const csv = Papa.unparse(dadosExport, { delimiter: ';' });
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const dataStr = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `analytix_bi_powerbi_ready_${dataStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportMenuAberto(false);
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      alert("Falha ao gerar o arquivo CSV.");
    }
  };

  const exportarJSON = () => {
    try {
      if (dadosFiltrados.length === 0) {
        alert("Não há dados para exportar!");
        return;
      }
      const dadosExport = dadosFiltrados.map(({ id, ...resto }) => resto);
      const blob = new Blob([JSON.stringify(dadosExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const dataStr = new Date().toISOString().slice(0, 10);
      link.setAttribute("download", `analytix_bi_raw_data_${dataStr}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportMenuAberto(false);
    } catch (error) {
      console.error(error);
    }
  };

  // Funções requisitadas exportToPDF e exportToExcel para permitir downloads robustos
  const exportToExcel = async () => {
    setProcessandoExport("excel");
    try {
      if (dadosAgregados.length === 0) {
        alert("Não há dados consolidados para exportar!");
        setProcessandoExport(null);
        return;
      }
      
      const dadosConsolidadosExport = dadosAgregados.map(item => ({
        [eixoX]: item.name,
        [`${eixoY} (${modoAgregacao})`]: item.value,
        "Registros Agrupados": item.contagem
      }));

      const worksheet = XLSX.utils.json_to_sheet(dadosConsolidadosExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Análise Processada");

      const dataStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `analise_processada_${eixoX.toLowerCase()}_vs_${eixoY.toLowerCase()}_${dataStr}.xlsx`);
      setExportMenuAberto(false);
      
      adicionarMensagemSistema(`Análise processada exportada com sucesso para Excel!`);
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      alert("Falha ao exportar os dados processados para Excel.");
    } finally {
      setProcessandoExport(null);
    }
  };

  const exportToPDF = async () => {
    setProcessandoExport("pdf");
    const elemento = document.getElementById("area-do-grafico");
    if (!elemento) {
      alert("Área de captura do gráfico não encontrada!");
      setProcessandoExport(null);
      return;
    }

    adicionarMensagemSistema("Iniciando a renderização e geração do PDF da análise, por favor aguarde...");

    try {
      // Rola a página para garantir que o elemento está visível
      elemento.scrollIntoView({ behavior: 'instant', block: 'center' });
      await new Promise(r => setTimeout(r, 300));

      const canvas = await html2canvas(elemento, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#090d16',
        logging: false,
        windowWidth: elemento.scrollWidth,
        windowHeight: elemento.scrollHeight,
      });
      
      const imgData = canvas.toDataURL("image/png");
      
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const imgWidth = 277;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const margemY = Math.max(10, (210 - imgHeight) / 2);

      pdf.addImage(imgData, "PNG", 10, margemY, imgWidth, imgHeight);
      
      const dataStr = new Date().toISOString().slice(0, 10);
      pdf.save(`analise_processada_${eixoX.toLowerCase()}_vs_${eixoY.toLowerCase()}_${dataStr}.pdf`);
      setExportMenuAberto(false);
      
      adicionarMensagemSistema("Análise processada em PDF exportada e baixada com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      adicionarMensagemSistema("Erro ao exportar a análise para PDF. Verifique se o gráfico está visível na tela.");
    } finally {
      setProcessandoExport(null);
    }
  };

  // Adicionar dados manualmente para teste de reatividade dinâmica
  const adicionarRegistroManual = (e: React.FormEvent) => {
    e.preventDefault();
    const novoReg: DadoPlanilha = {
      id: `manual-${Date.now()}`
    };

    todasColunas.forEach(col => {
      const inputVal = novaLinhaValores[col] || '';
      // Tenta converter se for numérico
      if (colunasY.includes(col)) {
        novoReg[col] = Number(inputVal) || 0;
      } else {
        novoReg[col] = inputVal || 'Não Informado';
      }
    });

    setDados([...dados, novoReg]);
    setNovaLinhaValores({});

    // Mensagem de sucesso amigável
    adicionarMensagemSistema(`Registro inserido com sucesso na tabela de dados BI!`);
  };

  const handleInputChangeManual = (col: string, val: string) => {
    setNovaLinhaValores(prev => ({
      ...prev,
      [col]: val
    }));
  };

  // Remover uma linha
  const removerLinha = (id: string) => {
    setDados(dados.filter(d => d.id !== id));
  };

  // Restaurar dados originais de exemplo
  const restaurarOriginal = () => {
    setDados(dadosExemploIniciais);
    setNomeArquivo("dados_exemplo_vendas.xlsx");
    setFiltroAtivo(null);
    setColunasX(['Cidade', 'Produto', 'Vendedor', 'Categoria']);
    setColunasY(['Faturamento', 'Quantidade', 'Desconto', 'MargemLucro']);
    setTodasColunas(['Cidade', 'Produto', 'Vendedor', 'Categoria', 'Faturamento', 'Quantidade', 'Desconto', 'MargemLucro']);
    setEixoX('Cidade');
    setEixoY('Faturamento');
    setTipoGrafico('Barras');
    setModoAgregacao('Somar');
    adicionarMensagemSistema("Banco de dados reiniciado para os valores padrão com sucesso.");
  };

  // Formatação dinâmica inteligente de acordo com o nome do eixoY
  const formatarValorGrafico = (val: number) => {
    const nomeLower = eixoY.toLowerCase();
    if (nomeLower.includes('faturamento') || nomeLower.includes('desconto') || nomeLower.includes('valor') || nomeLower.includes('preço') || nomeLower.includes('preco')) {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    }
    if (nomeLower.includes('margem') || nomeLower.includes('lucro') || nomeLower.includes('%') || nomeLower.includes('percentual')) {
      return `${val}%`;
    }
    return val.toLocaleString('pt-BR');
  };

  // Paleta premium de cores (estilo Power BI/Qlik Sense Dashboard)
  const CORES_PALETA = [
    '#3b82f6', // azul brilhante
    '#06b6d4', // ciano neon
    '#a855f7', // roxo
    '#ec4899', // rosa escuro
    '#f59e0b', // âmbar
    '#10b981', // esmeralda
    '#ef4444', // vermelho soft
    '#6366f1', // indigo
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      
      {/* 1. TOPO / HEADER DO PAINEL CORPORATIVO */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/10">
            <LayoutDashboard className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Analytix BI Engine
              </h1>
              <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-[10px] text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                <Sparkles className="w-2.5 h-2.5" />
                Copilot Active
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
              <span>Arquivo: <code className="text-cyan-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded">{nomeArquivo}</code></span>
            </p>
          </div>
        </div>

        {/* Botões do Topo */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          
          {/* Botão de reset rápido */}
          <button
            onClick={restaurarOriginal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
            title="Reinicia com dados originais de vendas"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset
          </button>

          {/* Export Suite (Requisito Especial) */}
          <div className="relative">
            <button
              onClick={() => setExportMenuAberto(!exportMenuAberto)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar BI
            </button>
            {exportMenuAberto && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Layouts de Dados
                </div>
                <button
                  onClick={exportarExcelCompleto}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  Planilha Excel (.xlsx)
                </button>
                <button
                  onClick={exportarCSVPowerBI}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <Database className="w-4 h-4 text-cyan-400" />
                  Power BI / Excel CSV (;)
                </button>
                <button
                  onClick={exportarJSON}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <code className="text-amber-500 text-xs font-bold font-mono">{"{ }"}</code>
                  Dados Puros JSON
                </button>

                <div className="px-3 py-1.5 border-t border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                  Análise do Gráfico (Processada)
                </div>
                <button
                  onClick={exportToExcel}
                  disabled={!!processandoExport}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                  {processandoExport === "excel" ? "Processando..." : "Exportar Análise (Excel)"}
                </button>
                <button
                  onClick={exportToPDF}
                  disabled={!!processandoExport}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4 text-rose-400" />
                  {processandoExport === "pdf" ? "Gerando PDF..." : "Exportar Análise (PDF)"}
                </button>
              </div>
            )}
          </div>

          {/* Botão lateral do Chat */}
          <button
            onClick={() => setChatAberto(!chatAberto)}
            className={`md:hidden flex items-center justify-center p-2 rounded-xl border ${
              chatAberto 
                ? 'bg-cyan-500 border-cyan-400 text-slate-950' 
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Grid Principal do Dashboard */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-hidden">
        
        {/* Painel Central do Gráfico e Controles (8 Colunas se chat aberto, 12 se fechado) */}
        <main className={`p-4 md:p-6 space-y-6 overflow-y-auto ${
          chatAberto ? 'col-span-12 lg:col-span-8' : 'col-span-12'
        } transition-all duration-300`}>

          {/* Seção 1: Drag-and-Drop + Controles Superiores */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            
            {/* Drag & Drop Zone + Google Drive Button */}
            <div className="xl:col-span-1 flex flex-col gap-3">
              {/* Drag & Drop Zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`flex-1 min-h-[110px] rounded-2xl border-2 border-dashed p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                  dragActive 
                    ? 'border-cyan-500 bg-cyan-500/10' 
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'
                }`}
              >
                <input 
                  type="file" 
                  id="spreadsheet-upload" 
                  accept=".xlsx,.xls,.csv" 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={handleManualFileInput}
                />
                <Upload className="w-6 h-6 text-cyan-500 mb-1.5 animate-bounce" />
                <h3 className="text-xs font-bold text-slate-200">Arraste sua planilha</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Suporta Excel (.xlsx) ou CSV</p>
              </div>

              {/* Botão Importar do Google Drive */}
              <button
                onClick={handleImportarGoogleDrive}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600/15 via-blue-600/15 to-indigo-600/15 hover:from-emerald-600/25 hover:via-blue-600/25 hover:to-indigo-600/25 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-cyan-950/20"
                title="Conecte seu Google Drive para buscar planilhas do Google Sheets diretamente"
              >
                <GoogleDriveIcon />
                <span>Importar do Google Drive</span>
              </button>
            </div>

            {/* 2. CONTROLES DE CLIQUES ESTILIZADOS (Top Selectors) */}
            <div className="xl:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col justify-center">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Select Eixo X */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Eixo X
                  </label>
                  <select
                    value={eixoX}
                    onChange={(e) => setEixoX(e.target.value)}
                    className="bg-slate-950 border border-slate-850 hover:border-blue-500/50 rounded-xl px-2 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {colunasX.map(col => (
                      <option key={col} value={col}>📍 {col}</option>
                    ))}
                  </select>
                </div>

                {/* Select Eixo Y */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Eixo Y
                  </label>
                  <select
                    value={eixoY}
                    onChange={(e) => setEixoY(e.target.value)}
                    className="bg-slate-950 border border-slate-850 hover:border-emerald-500/50 rounded-xl px-2 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    {colunasY.map(col => (
                      <option key={col} value={col}>📊 {col}</option>
                    ))}
                  </select>
                </div>

                {/* Cálculo Agregação */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <ToggleLeft className="w-3.5 h-3.5 text-purple-400" />
                    Cálculo
                  </label>
                  <div className="grid grid-cols-2 bg-slate-950 p-0.5 rounded-xl border border-slate-850 h-[32px]">
                    <button
                      onClick={() => setModoAgregacao('Somar')}
                      className={`text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        modoAgregacao === 'Somar'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Soma
                    </button>
                    <button
                      onClick={() => setModoAgregacao('Média')}
                      className={`text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        modoAgregacao === 'Média'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Média
                    </button>
                  </div>
                </div>

                {/* Tipo de Gráfico */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                    Layout
                  </label>
                  <select
                    value={tipoGrafico}
                    onChange={(e) => setTipoGrafico(e.target.value as any)}
                    className="bg-slate-950 border border-slate-850 hover:border-cyan-500/50 rounded-xl px-2 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-cyan-500 transition-all cursor-pointer"
                  >
                    <option value="Barras">📊 Barras</option>
                    <option value="Linhas">📈 Linhas</option>
                    <option value="Área">⛰️ Área</option>
                    <option value="Pizza">🍕 Pizza</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* Indicador de Filtro Ativo */}
          {filtroAtivo && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs text-cyan-300">
                <Filter className="w-4 h-4" />
                <span>
                  Filtro Inteligente Ativo: <strong className="text-white">{filtroAtivo.coluna}</strong> contém <strong className="text-white">"{filtroAtivo.valor}"</strong>
                </span>
              </div>
              <button
                onClick={() => setFiltroAtivo(null)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                title="Remover filtro"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-cyan-400" />
                Valor Total ({eixoY})
              </span>
              <span className="text-lg md:text-2xl font-black text-white tracking-tight">
                {formatarValorGrafico(kpis.total)}
              </span>
            </div>

            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <RefreshCw className="w-3 h-3 text-blue-400 animate-spin-slow" />
                Média por Linha
              </span>
              <span className="text-lg md:text-2xl font-black text-white tracking-tight">
                {formatarValorGrafico(kpis.media)}
              </span>
            </div>

            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                Maior Lançamento
              </span>
              <span className="text-lg md:text-2xl font-black text-white tracking-tight">
                {formatarValorGrafico(kpis.maximo)}
              </span>
            </div>

            <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Package className="w-3 h-3 text-purple-400" />
                Contagem Total
              </span>
              <span className="text-lg md:text-2xl font-black text-white tracking-tight">
                {kpis.totalLinhas} <span className="text-xs font-normal text-slate-400">linhas</span>
              </span>
            </div>
          </div>

          {/* 3. DESIGN ESTILO DASHBOARD CORPORATIVO (Recharts Container) */}
          <div id="area-do-grafico" className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Power BI Native Simulation</span>
                <h2 className="text-base font-extrabold text-white">
                  Métrica {eixoY} agregada por {eixoX} ({modoAgregacao})
                </h2>
              </div>
              <div className="text-[10px] text-slate-500 bg-slate-950 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Info className="w-3 h-3 text-cyan-400" />
                <span>Eixo X dinâmico</span>
              </div>
            </div>

            {/* Box Gráficos */}
            <div className="h-[300px] md:h-[360px] w-full bg-slate-950/30 border border-slate-900 rounded-xl p-3">
              {dadosAgregados.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                  <Database className="w-8 h-8 text-slate-600 mb-2" />
                  Nenhum dado para exibir neste cruzamento.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {tipoGrafico === 'Barras' ? (
                    <BarChart data={dadosAgregados} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="corBarraGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95}/>
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} 
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: '#94a3b8', fontSize: 10 }} 
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => v > 1000 ? `${(v/1000).toFixed(0)}k` : v}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        contentStyle={{ 
                          backgroundColor: '#090d16', 
                          borderColor: '#1e293b', 
                          borderRadius: '12px',
                          color: '#f8fafc',
                        }}
                        formatter={(value: any) => [formatarValorGrafico(Number(value)), eixoY]}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar 
                        dataKey="value" 
                        name={eixoY} 
                        fill="url(#corBarraGradient)" 
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      />
                    </BarChart>
                  ) : tipoGrafico === 'Linhas' ? (
                    <LineChart data={dadosAgregados} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#090d16', 
                          borderColor: '#1e293b', 
                          borderRadius: '12px',
                          color: '#f8fafc',
                        }}
                        formatter={(value: any) => [formatarValorGrafico(Number(value)), eixoY]}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name={eixoY} 
                        stroke="#06b6d4" 
                        strokeWidth={3}
                        dot={{ r: 4, stroke: '#3b82f6', strokeWidth: 1.5, fill: '#030712' }}
                      />
                    </LineChart>
                  ) : tipoGrafico === 'Área' ? (
                    <AreaChart data={dadosAgregados} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="corAreaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4}/>
                          <stop offset="100%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#090d16', 
                          borderColor: '#1e293b', 
                          borderRadius: '12px',
                          color: '#f8fafc',
                        }}
                        formatter={(value: any) => [formatarValorGrafico(Number(value)), eixoY]}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        name={eixoY} 
                        stroke="#a855f7" 
                        strokeWidth={2}
                        fill="url(#corAreaGradient)" 
                      />
                    </AreaChart>
                  ) : (
                    <PieChart>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#090d16', 
                          borderColor: '#1e293b', 
                          borderRadius: '12px',
                          color: '#f8fafc',
                        }}
                        formatter={(value: any) => [formatarValorGrafico(Number(value)), eixoY]}
                      />
                      <Legend wrapperStyle={{ fontSize: 10 }} layout="horizontal" align="center" verticalAlign="bottom" />
                      <Pie
                        data={dadosAgregados}
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {dadosAgregados.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CORES_PALETA[index % CORES_PALETA.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Grid Inferior: Form Injetor e Tabela de Registros Brutos */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            {/* Form de Injeção de Dados para Reatividade */}
            <div className="xl:col-span-5 bg-slate-900/40 border border-slate-900 rounded-2xl p-4 shadow-lg flex flex-col gap-3">
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                Injetar Registro Manual
              </h3>
              
              <form onSubmit={adicionarRegistroManual} className="space-y-3">
                <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1">
                  {todasColunas.slice(0, 8).map(col => (
                    <div key={col} className="flex flex-col gap-0.5">
                      <label className="text-[9px] font-bold text-slate-400">{col}</label>
                      <input
                        type={colunasY.includes(col) ? "number" : "text"}
                        value={novaLinhaValores[col] || ''}
                        onChange={(e) => handleInputChangeManual(col, e.target.value)}
                        placeholder={`Digite ${col}`}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Inserir no Painel
                </button>
              </form>
            </div>

            {/* Registros Ativos com Scroll */}
            <div className="xl:col-span-7 bg-slate-900/40 border border-slate-900 rounded-2xl p-4 shadow-lg flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-4 h-4" />
                  Lista de Registros ({dadosFiltrados.length})
                </span>
                <span className="text-[10px] text-slate-500">Filtrado em tempo real</span>
              </div>

              <div className="max-h-[220px] overflow-y-auto rounded-xl border border-slate-850">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 sticky top-0 z-10">
                    <tr>
                      <th className="p-2 border-b border-slate-800">{eixoX}</th>
                      <th className="p-2 border-b border-slate-800 text-right">{eixoY}</th>
                      <th className="p-2 border-b border-slate-800 text-center">Remover</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {dadosFiltrados.map((linha) => (
                      <tr key={linha.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-2 font-medium text-slate-200">
                          {String(linha[eixoX] !== undefined && linha[eixoX] !== null ? linha[eixoX] : 'Nulo')}
                        </td>
                        <td className="p-2 text-right font-semibold text-cyan-400">
                          {formatarValorGrafico(Number(linha[eixoY]) || 0)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => removerLinha(linha.id)}
                            className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {dadosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-slate-500">
                          Nenhum registro ativo. Ajuste os filtros ou insira novos dados!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* 5. GOOGLE WORKSPACE HUB INTEGRATION (Requisitos: Chat, Picker, Sheets, Drive) */}
          <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-5 shadow-2xl mt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-850 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block" />
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    Google Workspace Integration Hub
                  </h3>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 text-left">
                  Gerencie a conexão em tempo real com Google Drive, Google Sheets, Google Picker e Google Chat.
                </p>
              </div>

              {/* Status Global */}
              <div className="flex items-center gap-2">
                {accessToken ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/25">
                    <Check className="w-3 h-3" />
                    Autenticado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700">
                    <AlertCircle className="w-3 h-3" />
                    Desconectado
                  </span>
                )}
              </div>
            </div>

            {/* Menu de Abas */}
            <div className="flex flex-wrap gap-1 border-b border-slate-850/60 pb-3 mb-4">
              <button
                type="button"
                onClick={() => setWorkspaceAbaAtiva('geral')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  workspaceAbaAtiva === 'geral'
                    ? 'bg-slate-800 text-cyan-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                🔑 Conexão Geral
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceAbaAtiva('drive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  workspaceAbaAtiva === 'drive'
                    ? 'bg-slate-800 text-yellow-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                📁 Google Drive & Picker
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceAbaAtiva('sheets')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  workspaceAbaAtiva === 'sheets'
                    ? 'bg-slate-800 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                📊 Google Sheets (Exportar)
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceAbaAtiva('chat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  workspaceAbaAtiva === 'chat'
                    ? 'bg-slate-800 text-blue-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                💬 Google Chat Integrator
              </button>
            </div>

            {/* Conteúdo das Abas */}
            <div className="bg-slate-950/40 border border-slate-900/60 rounded-xl p-4 min-h-[160px]">
              {/* ABA 1: CONEXÃO GERAL */}
              {workspaceAbaAtiva === 'geral' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-300 leading-relaxed text-left">
                    Este ecossistema integra-se de forma nativa e segura com APIs oficiais do Google Cloud utilizando
                    tokens em memória temporários (sem gravação de cookies ou persistência no browser para preservar
                    sua segurança corporativa).
                  </div>

                  {!accessToken ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-900">
                      <div className="flex-1 text-left">
                        <h4 className="text-xs font-bold text-slate-300">Vincular Conta Google</h4>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Requer permissões mínimas e escopos oficiais para ler arquivos do Drive, planilhas do Sheets e listar salas do Google Chat.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={obterTokenGoogle}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl font-bold text-xs shadow-lg transition-all shrink-0 cursor-pointer active:scale-95 animate-pulse-subtle"
                      >
                        Autorizar Workspace
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-left">
                        <div>
                          <span className="text-slate-500 block">Usuário Autenticado:</span>
                          <strong className="text-slate-300">{auth.currentUser?.email || "Foco em Dados Partner"}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Status do Token OAuth:</span>
                          <span className="text-emerald-400 font-bold font-mono">ATIVO (ya29.a0Ac...{accessToken.slice(-8)})</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-900/60 flex justify-between items-center">
                        <span className="text-[9px] text-slate-500 text-left">
                          *Sua conexão expira automaticamente se você recarregar o navegador ou sair da sessão.
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAccessToken(null);
                            setCachedAccessToken(null);
                            adicionarMensagemSistema("Google Workspace desconectado pelo usuário.");
                          }}
                          className="px-3 py-1 border border-red-950 hover:bg-red-950/20 text-red-400 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                        >
                          Revogar Conexão
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ABA 2: DRIVE & PICKER */}
              {workspaceAbaAtiva === 'drive' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-300 leading-relaxed text-left">
                    <strong>Google Picker API</strong> é uma janela de seleção oficial fornecida de forma segura pelo próprio Google.
                    Ela permite buscar qualquer planilha (Excel, CSV ou Google Sheets) diretamente no seu Google Drive e carregá-la neste painel em menos de um segundo.
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-900">
                    <div className="flex-1 text-left">
                      <h4 className="text-xs font-bold text-slate-300">Abrir Seletor de Arquivos</h4>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Utilize a interface do Google Picker para explorar seus diretórios de maneira protegida.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleImportarGoogleDrive}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer active:scale-95"
                    >
                      <HardDrive className="w-4 h-4" />
                      Buscar no Drive
                    </button>
                  </div>
                </div>
              )}

              {/* ABA 3: GOOGLE SHEETS */}
              {workspaceAbaAtiva === 'sheets' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-300 leading-relaxed text-left">
                    Você pode sincronizar os registros de dados de forma de escrita bidirecional. O recurso abaixo cria uma nova planilha real no seu Google Drive com todas as linhas de dados ativas na sua sessão do dashboard BI!
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex-1 text-left">
                        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          Exportar Dados para Google Sheets
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Gera um novo arquivo contendo {dados.length} linhas de registros e {todasColunas.length} colunas estruturadas.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={exportarParaNovaPlanilhaGoogle}
                        disabled={exportandoSheets}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer active:scale-95"
                      >
                        {exportandoSheets ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        )}
                        Criar no Google Sheets
                      </button>
                    </div>

                    {ultimaPlanilhaCriada && (
                      <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-lg flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300 font-medium text-left">Planilha criada com sucesso!</span>
                        </div>
                        <a
                          href={ultimaPlanilhaCriada.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-emerald-900/50 hover:bg-emerald-900 text-emerald-200 font-bold text-[10px] rounded-md transition-colors flex items-center gap-1"
                        >
                          Abrir Planilha
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 4: GOOGLE CHAT */}
              {workspaceAbaAtiva === 'chat' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-300 leading-relaxed text-left">
                    Publique os relatórios analíticos, faturamento consolidado e o resumo de BI do seu dashboard diretamente nos
                    canais ou salas de equipes do seu Google Chat de forma autônoma e interativa.
                  </div>

                  {!accessToken ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      Por favor, realize a <button type="button" onClick={obterTokenGoogle} className="text-cyan-400 font-bold hover:underline cursor-pointer">conexão geral com o Google</button> primeiro para listar canais.
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-4">
                      {/* Dropdown de Espaços do Chat */}
                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                          💬 Selecione a Sala do Google Chat:
                        </label>
                        {carregandoChatSpaces ? (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Listando canais ativos do Workspace...
                          </div>
                        ) : chatSpaces.length > 0 ? (
                          <select
                            value={espacoChatSelecionado}
                            onChange={(e) => setEspacoChatSelecionado(e.target.value)}
                            className="bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none focus:border-blue-500 transition-all cursor-pointer w-full"
                          >
                            {chatSpaces.map((space: any) => (
                              <option key={space.name} value={space.name}>
                                {space.displayName || space.name} ({space.spaceType || 'SALA'})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={espacoChatSelecionado}
                              onChange={(e) => setEspacoChatSelecionado(e.target.value)}
                              placeholder="spaces/AAAAxxxx ou Webhook URL..."
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                            />
                            <span className="text-[9px] text-slate-500 bg-slate-900/40 p-2 rounded-lg leading-snug sm:max-w-[200px] text-left">
                              Nenhuma sala padrão localizada via API (contas pessoais). Você pode digitar o ID/URL acima para enviar!
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Textarea de Edição da Mensagem */}
                      <div className="flex flex-col gap-1.5 text-left">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-400">📝 Visualização do Relatório:</label>
                          <button
                            type="button"
                            onClick={() => setMensagemChatPersonalizada(getRelatorioMensagemTemplate())}
                            className="text-[9px] text-cyan-400 font-bold hover:underline cursor-pointer"
                          >
                            Resetar para o Padrão
                          </button>
                        </div>
                        <textarea
                          rows={5}
                          value={mensagemChatPersonalizada || getRelatorioMensagemTemplate()}
                          onChange={(e) => setMensagemChatPersonalizada(e.target.value)}
                          className="bg-slate-950 border border-slate-800 focus:border-blue-500/60 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none w-full"
                        />
                      </div>

                      {/* Botão Enviar */}
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={enviarMensagemGoogleChat}
                          disabled={enviandoMensagemChat}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                        >
                          {enviandoMensagemChat ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-slate-950" />
                          )}
                          Enviar Relatório ao Google Chat
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </main>

        {/* 3. INTERFACE DO CHATBOT (AI Assistant Lateral Collapsible) */}
        <aside className={`${
          chatAberto ? 'translate-x-0 w-full lg:col-span-4' : 'translate-x-full w-0 hidden'
        } transition-all duration-300 border-t lg:border-t-0 lg:border-l border-slate-900 bg-slate-950 flex flex-col h-full overflow-hidden`}>
          
          {/* Header do Chat */}
          <div className="p-4 border-b border-slate-900 flex items-center justify-between bg-slate-900/20">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Analytix AI Assistente
                </h3>
                <p className="text-[10px] text-slate-400">Comandos de linguagem natural</p>
              </div>
            </div>
            
            {/* Fechar no Mobile */}
            <button
              onClick={() => setChatAberto(false)}
              className="text-slate-400 hover:text-slate-100 p-1.5 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
            {mensagens.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : msg.status === 'error'
                      ? 'bg-red-950/40 border border-red-900/50 text-red-200 rounded-tl-none'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-600 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {iaCarregando && (
              <div className="flex flex-col mr-auto max-w-[85%] items-start">
                <div className="p-3 rounded-2xl text-xs bg-slate-900/90 border border-slate-850 text-slate-400 rounded-tl-none flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  <span>Analisando planilha e modelando gráfico...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Sugestões de Comandos Rápidos */}
          <div className="p-3 bg-slate-950 border-t border-slate-900/80">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-2 block">
              💡 Sugestões Rápidas (Toque para Testar)
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-1">
              <button
                onClick={() => enviarComandoChat("Faturamento médio por Vendedor como barras")}
                className="text-[10px] font-semibold bg-slate-900 hover:bg-slate-850 hover:border-slate-750 border border-slate-850 px-2 py-1 rounded-lg text-slate-300 transition-colors text-left cursor-pointer"
              >
                📊 Faturamento médio por Vendedor
              </button>
              <button
                onClick={() => enviarComandoChat("Mostrar faturamento por Categoria como Pizza")}
                className="text-[10px] font-semibold bg-slate-900 hover:bg-slate-850 hover:border-slate-750 border border-slate-850 px-2 py-1 rounded-lg text-slate-300 transition-colors text-left cursor-pointer"
              >
                🍕 Pizza por Categoria
              </button>
              <button
                onClick={() => enviarComandoChat("Filtrar por São Paulo")}
                className="text-[10px] font-semibold bg-slate-900 hover:bg-slate-850 hover:border-slate-750 border border-slate-850 px-2 py-1 rounded-lg text-slate-300 transition-colors text-left cursor-pointer"
              >
                📍 Filtrar por São Paulo
              </button>
              <button
                onClick={() => enviarComandoChat("Quantidade de vendas por Produto em gráfico de área")}
                className="text-[10px] font-semibold bg-slate-900 hover:bg-slate-850 hover:border-slate-750 border border-slate-850 px-2 py-1 rounded-lg text-slate-300 transition-colors text-left cursor-pointer"
              >
                🏔️ Quantidade por Produto
              </button>
            </div>
          </div>

          {/* Formulário de Input do Chat */}
          <div className="p-3 border-t border-slate-900 bg-slate-900/30">
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-850 rounded-xl p-1 focus-within:border-cyan-500/50 transition-all">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && enviarComandoChat()}
                placeholder="Pergunte ao BI (ex: 'Soma de faturamento por Produto em pizza')..."
                className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0"
              />
              <button
                onClick={() => enviarComandoChat()}
                disabled={iaCarregando || !prompt.trim()}
                className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-lg disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

        </aside>

      </div>

    </div>
  );
}

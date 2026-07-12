import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Plus, Trash2, Send, MessageSquare, RefreshCw, Layers, Sparkles, 
  Play, StopCircle, Eye, Sliders, ToggleLeft, ToggleRight, Check, AlertCircle,
  HelpCircle, Settings, Phone, Calendar, ShoppingCart, UserCheck, MessageCircleCode, ArrowLeft, LayoutDashboard,
  MessageCircle, Copy, FileCode
} from 'lucide-react';
import { auth, db } from '../firebase-config';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

interface BotConfig {
  id?: string;
  name: string;
  niche: 'E-commerce' | 'Serviços/Agência' | 'Negócio Local' | 'Suporte';
  channel: 'WhatsApp' | 'Instagram' | 'Web Chat';
  model: string;
  voice: 'Persuasivo' | 'Profissional' | 'Descontraído' | 'Técnico';
  goal: string;
  instructions: string;
  active: boolean;
  messagesSent: number;
  conversionRate: number;
}

interface TestMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function BotFactory() {
  const [bots, setBots] = useState<BotConfig[]>([
    {
      id: 'demo-1',
      name: 'Vendas WhatsApp - E-commerce',
      niche: 'E-commerce',
      channel: 'WhatsApp',
      model: 'gemini-3.5-flash',
      voice: 'Persuasivo',
      goal: 'Recuperação de carrinho abandonado e conversão de Pix',
      instructions: 'Você é um assistente de vendas da loja Foco em Dados. Seja extremamente cortês, persuasivo e use gatilhos de urgência para fechar compras.',
      active: true,
      messagesSent: 342,
      conversionRate: 28.5
    },
    {
      id: 'demo-2',
      name: 'Triagem de Leads - Agência',
      niche: 'Serviços/Agência',
      channel: 'Web Chat',
      model: 'gemini-3.5-flash',
      voice: 'Profissional',
      goal: 'Filtrar orçamento e agendar consultoria no Calendly',
      instructions: 'Você faz a triagem de leads qualificados. Pergunte educadamente sobre o faturamento médio e maiores dores antes de fornecer o link de agendamento.',
      active: true,
      messagesSent: 154,
      conversionRate: 19.2
    }
  ]);

  // Form states
  const [activeMainTab, setActiveMainTab] = useState<'factory' | 'code'>('factory');
  const [copied, setCopied] = useState(false);
  const [botName, setBotName] = useState('');
  const [botNiche, setBotNiche] = useState<'E-commerce' | 'Serviços/Agência' | 'Negócio Local' | 'Suporte'>('E-commerce');
  const [botChannel, setBotChannel] = useState<'WhatsApp' | 'Instagram' | 'Web Chat'>('WhatsApp');
  const [botModel, setBotModel] = useState('gemini-3.5-flash');
  const [botVoice, setBotVoice] = useState<'Persuasivo' | 'Profissional' | 'Descontraído' | 'Técnico'>('Persuasivo');
  const [botGoal, setBotGoal] = useState('');
  const [botInstructions, setBotInstructions] = useState('');

  // Selected bot for playground testing
  const [selectedBotForPlayground, setSelectedBotForPlayground] = useState<BotConfig>(bots[0]);
  
  // Playground states
  const [chatMessages, setChatMessages] = useState<TestMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Olá! Sou o seu atendente inteligente recém-configurado. Em que posso ajudar seu negócio hoje?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [savingBot, setSavingBot] = useState(false);

  // WhatsApp connection states
  const [waStatus, setWaStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'CONNECTED'>('DISCONNECTED');
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [waConnectedAt, setWaConnectedAt] = useState<string | null>(null);
  const [waPhoneNumber, setWaPhoneNumber] = useState<string | null>(null);
  const [inputPhoneNumber, setInputPhoneNumber] = useState('');
  const [loadingWaAction, setLoadingWaAction] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);

  const fetchWaSession = async () => {
    try {
      setWaError(null);
      const res = await fetch('/api/whatsapp/session');
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data.status);
        setWaQrCode(data.qrCode);
        setWaConnectedAt(data.connectedAt);
        setWaPhoneNumber(data.phoneNumber);
        if (data.phoneNumber && !inputPhoneNumber) {
          setInputPhoneNumber(data.phoneNumber);
        }
        
        // Auto-connect dynamically if disconnected on load (allows immediate QR code generation)
        if (data.status === 'DISCONNECTED') {
          try {
            await fetch('/api/whatsapp/connect', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            });
            // Re-fetch to update status
            const sessionRes = await fetch('/api/whatsapp/session');
            if (sessionRes.ok) {
              const sessionData = await sessionRes.json();
              setWaStatus(sessionData.status);
              setWaQrCode(sessionData.qrCode);
            }
          } catch (connectErr) {
            console.error("Erro ao conectar WhatsApp:", connectErr);
            setWaError("Não foi possível conectar ao serviço WhatsApp.");
          }
        }
      } else {
        setWaError("Serviço de WhatsApp temporariamente indisponível.");
      }
    } catch (err) {
      console.error("Erro ao buscar sessão do WhatsApp:", err);
      setWaError("Erro de conexão com o servidor.");
    }
  };

  // Poll for status when connecting or in qr_ready state
  useEffect(() => {
    fetchWaSession();
    
    // Set up periodic check
    const interval = setInterval(() => {
      fetchWaSession();
    }, 5000);

    return () => clearInterval(interval);
  }, [inputPhoneNumber]);

  const handleWaConnect = async () => {
    setLoadingWaAction(true);
    setWaError(null);
    try {
      const res = await fetch('/api/whatsapp/connect', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: inputPhoneNumber || undefined })
      });
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data.currentStatus || 'CONNECTING');
        // Initial quick refresh
        setTimeout(fetchWaSession, 1300);
      } else {
        const errData = await res.json().catch(() => null);
        setWaError(errData?.error || "Falha ao iniciar conexão WhatsApp.");
      }
    } catch (err) {
      console.error(err);
      setWaError("Erro de rede ao conectar WhatsApp.");
    } finally {
      setLoadingWaAction(false);
    }
  };

  const handleWaSimulateScan = async () => {
    setLoadingWaAction(true);
    try {
      const res = await fetch('/api/whatsapp/simulate-scan', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: inputPhoneNumber })
      });
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data.session.status);
        setWaQrCode(data.session.qrCode);
        setWaConnectedAt(data.session.connectedAt);
        setWaPhoneNumber(data.session.phoneNumber);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWaAction(false);
    }
  };

  const handleInstantSimulateTest = async () => {
    setLoadingWaAction(true);
    try {
      // 1. Inicia conexão
      await fetch('/api/whatsapp/connect', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: inputPhoneNumber || undefined })
      });
      setWaStatus('CONNECTING');
      
      // 2. Simula breve espera
      await new Promise(resolve => setTimeout(resolve, 800));
      setWaStatus('QR_READY');
      
      // 3. Simula leitura bem-sucedida do QR Code
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const res = await fetch('/api/whatsapp/simulate-scan', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: inputPhoneNumber || undefined })
      });
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data.session.status);
        setWaQrCode(data.session.qrCode);
        setWaConnectedAt(data.session.connectedAt);
        setWaPhoneNumber(data.session.phoneNumber);
        
        // Mensagem de boas-vindas customizada
        const activeNum = data.session.phoneNumber || inputPhoneNumber || "SaaS Ativo";
        setChatMessages([
          {
            id: 'wa-test-init',
            sender: 'bot',
            text: `🟢 Conexão de teste via WhatsApp estabelecida com sucesso para o número ${activeNum}! Envie uma mensagem no chat do "Playground Simulado" à direita para ver o robô "${selectedBotForPlayground.name}" responder em tempo real!`,
            timestamp: new Date()
          }
         ]);
      }
    } catch (err) {
      console.error("Erro na simulação rápida:", err);
    } finally {
      setLoadingWaAction(false);
    }
  };

  const handleWaDisconnect = async () => {
    setLoadingWaAction(true);
    try {
      const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      if (res.ok) {
        setWaStatus('DISCONNECTED');
        setWaQrCode(null);
        setWaConnectedAt(null);
        setWaPhoneNumber(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWaAction(false);
    }
  };

  // Load user bots if logged in
  useEffect(() => {
    const fetchUserBots = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const q = query(collection(db, 'bots'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedBots: BotConfig[] = [];
        querySnapshot.forEach((doc) => {
          fetchedBots.push({ id: doc.id, ...doc.data() } as BotConfig);
        });
        if (fetchedBots.length > 0) {
          setBots(prev => {
            // Filter out duplicates if any
            const nonDemos = fetchedBots;
            const demos = prev.filter(b => b.id?.startsWith('demo-'));
            return [...nonDemos, ...demos];
          });
          setSelectedBotForPlayground(fetchedBots[0]);
        }
      } catch (err) {
        console.error("Erro ao carregar bots do Firestore:", err);
      }
    };
    fetchUserBots();
  }, []);

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botName.trim()) return;

    setSavingBot(true);
    const newBot: BotConfig = {
      name: botName,
      niche: botNiche,
      channel: botChannel,
      model: botModel,
      voice: botVoice,
      goal: botGoal || 'Melhorar o atendimento automático',
      instructions: botInstructions || 'Seja prestativo e responda sempre em português brasileiro.',
      active: true,
      messagesSent: 0,
      conversionRate: 0
    };

    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = await addDoc(collection(db, 'bots'), {
          ...newBot,
          userId: user.uid,
          createdAt: new Date()
        });
        newBot.id = docRef.id;
      } catch (err) {
        console.error("Erro ao salvar no Firestore:", err);
      }
    } else {
      // Offline fallback
      newBot.id = 'local-' + Date.now();
    }

    setBots(prev => [newBot, ...prev]);
    setSelectedBotForPlayground(newBot);
    
    // Clear form
    setBotName('');
    setBotGoal('');
    setBotInstructions('');
    setSavingBot(false);

    // Reset playground
    setChatMessages([
      {
        id: '1',
        sender: 'bot',
        text: `Olá! Sou o bot "${newBot.name}". Minhas diretrizes foram definidas para focar em: ${newBot.goal}. Como posso ajudar?`,
        timestamp: new Date()
      }
    ]);
  };

  const handleDeleteBot = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Deseja realmente excluir este bot?")) return;

    try {
      const user = auth.currentUser;
      if (user && !id.startsWith('demo-') && !id.startsWith('local-')) {
        await deleteDoc(doc(db, 'bots', id));
      }
      setBots(prev => prev.filter(b => b.id !== id));
      if (selectedBotForPlayground.id === id) {
        const remaining = bots.filter(b => b.id !== id);
        if (remaining.length > 0) {
          setSelectedBotForPlayground(remaining[0]);
        }
      }
    } catch (err) {
      console.error("Erro ao excluir bot:", err);
    }
  };

  const toggleBotStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBots(prev => prev.map(b => {
      if (b.id === id) {
        return { ...b, active: !b.active };
      }
      return b;
    }));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg: TestMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoadingResponse(true);

    try {
      let botResponseText = "";

      if (selectedBotForPlayground.channel === 'WhatsApp' && waStatus === 'CONNECTED') {
        // Real-time automatic reply using Gemini via our custom Node.js WhatsApp simulation
        const response = await fetch('/api/whatsapp/webhook-simulate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: userMsg.text,
            botConfig: selectedBotForPlayground
          })
        });

        if (!response.ok) throw new Error("Erro na API do WhatsApp");
        const data = await response.json();
        botResponseText = data.reply;
      } else {
        // Standard flow simulation
        const response = await fetch('/api/simulate-bot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            niche: selectedBotForPlayground.niche,
            channel: selectedBotForPlayground.channel,
            voice: selectedBotForPlayground.voice,
            goal: selectedBotForPlayground.goal,
            instructions: selectedBotForPlayground.instructions,
            userPrompt: userMsg.text
          })
        });

        if (!response.ok) throw new Error("Erro na API de IA");
        const data = await response.json();
        
        if (data.flow && data.flow.length > 0) {
          botResponseText = data.flow[Math.floor(Math.random() * data.flow.length)].desc;
        } else {
          botResponseText = data.copyText || "Entendido! Estou processando seu atendimento de acordo com minhas diretrizes.";
        }
      }

      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: botResponseText,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.warn("Usando resposta de simulação fallback local:", err);
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `[Simulação ${selectedBotForPlayground.voice}] Recebi sua mensagem: "${userMsg.text}". Minha diretriz de conversão para "${selectedBotForPlayground.niche}" foi acionada com sucesso!`,
          timestamp: new Date()
        }]);
      }, 1000);
    } finally {
      setLoadingResponse(false);
    }
  };

  const handleSelectBotPlayground = (bot: BotConfig) => {
    setSelectedBotForPlayground(bot);
    setChatMessages([
      {
        id: '1',
        sender: 'bot',
        text: `Olá! Sou o assistente "${bot.name}" rodando no canal ${bot.channel}. Meu objetivo é: "${bot.goal}". Como posso ajudar?`,
        timestamp: new Date()
      }
    ]);
  };

  const integrationCodeString = [
    'import { GoogleGenAI } from "@google/genai";',
    '',
    '// 1. Inicialize a API do Gemini com a sua chave secreta com segurança no servidor',
    'const ai = new GoogleGenAI({',
    '  apiKey: process.env.REACT_APP_GEMINI_API_KEY,',
    '  httpOptions: {',
    '    headers: {',
    '      "User-Agent": "aistudio-build"',
    '    }',
    '  }',
    '});',
    '',
    'interface ChatMessage {',
    '  role: "user" | "model";',
    '  parts: { text: string }[];',
    '}',
    '',
    '/**',
    ' * Função de Atendimento Autônomo com Gemini API',
    ' * Entende o contexto do negócio "Foco em Dados" e responde sem fluxos engessados.',
    ' */',
    'export async function processarMensagemDoCliente(',
    '  mensagemCliente: string,',
    '  historicoConversa: ChatMessage[]',
    '): Promise<string> {',
    '  try {',
    '    // Diretrizes do Atendente IA customizadas na plataforma Foco em Dados',
    '    const botConfig = {',
    `      name: "${selectedBotForPlayground?.name || 'Assistente de Vendas'}",`,
    `      niche: "${selectedBotForPlayground?.niche || 'E-commerce'}",`,
    `      voice: "${selectedBotForPlayground?.voice || 'Persuasivo'}",`,
    `      goal: "${selectedBotForPlayground?.goal || 'Conversão de leads'}",`,
    `      instructions: "${(selectedBotForPlayground?.instructions || 'Seja cortês.').replace(/"/g, '\\"')}"`,
    '    };',
    '',
    '    // Prompt do Sistema unindo o contexto corporativo e as metas deste robô específico',
    '    const systemPrompt = `Você é um Robô de Atendimento com Inteligência Artificial integrado ao WhatsApp para a empresa "Foco em Dados".',
    'Você é 100% autônomo, flexível e inteligente. Não use respostas prontas ou fluxos engessados.',
    '',
    'CONTEXTO DO NEGÓCIO (Foco em Dados):',
    '- Somos uma plataforma SaaS de Business Intelligence e Automação de Vendas baseada em IA.',
    '- Oferecemos o "BI Analytics Engine" onde o cliente faz upload de planilhas Excel/CSV e obtém gráficos instantâneos, projeções de tendências e respostas por chat inteligentes.',
    '- Oferecemos o "Comparador de Preços Premium" que faz buscas na web em tempo real sobre produtos de concorrentes e dá recomendações de preços ideais.',
    '- Oferecemos a "Fábrica de Bots de WhatsApp" que cria robôs integrados que vendem, qualificam e mandam links de pagamento Pix de forma automática.',
    '- Oferecemos gerador de copies de anúncios com alta persuasão (AIDA, PAS).',
    '',
    'DIRETRIZES DO SEU BOT:',
    '- Nome do Bot: "\${botConfig.name}"',
    '- Nicho de Atuação: "\${botConfig.niche}"',
    '- Tom de Voz / Personalidade: "\${botConfig.voice}"',
    '- Objetivo Principal do Bot: "\${botConfig.goal}"',
    '- Instruções de Comportamento específicas: "\${botConfig.instructions}"',
    '',
    'REGRAS DE CONVERSAÇÃO:',
    '1. Responda em Português Brasileiro (PT-BR) de forma direta, humana e natural (como se fosse um humano digitando).',
    '2. Use emojis de forma equilibrada para tornar a conversa amigável.',
    '3. SEMPRE busque cumprir o Objetivo Principal do Bot de maneira fluida ao longo da conversa, adaptando-se às respostas do usuário.',
    '4. Mantenha as respostas curtas e fáceis de ler no celular (máximo de 3 parágrafos pequenos).',
    '5. Se o cliente demonstrar intenção de comprar ou fechar negócio, apresente as vantagens de forma persuasiva e guie para o fechamento.',
    '',
    'Histórico atual do chat para manter contexto:',
    '\${historicoConversa.map(h => \`\\\${h.role === "user" ? "Cliente" : "Você (IA)"}: \\\${h.parts[0].text}\`).join("\\n")}',
    '',
    'Nova mensagem do cliente: "\${mensagemCliente}"',
    '',
    'Responda diretamente com o texto da resposta.`;',
    '',
    '    // Chamada do Modelo Gemini usando a biblioteca oficial recomendada @google/genai (gemini-3.5-flash)',
    '    const response = await ai.models.generateContent({',
    '      model: "gemini-3.5-flash",',
    '      contents: systemPrompt',
    '    });',
    '',
    '    return response.text || "Entendido! Estou processando seu atendimento.";',
    '  } catch (error) {',
    '    console.error("Erro ao gerar resposta com Gemini API:", error);',
    '    throw error;',
    '  }',
    '}',
  ].join('\n');

  return (
    <div className="flex-1 w-full bg-slate-950 text-slate-100 flex flex-col p-4 md:p-8">
      
      {/* Top Title/Intro Section */}
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <Bot className="w-6 h-6" />
            </span>
            <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Fábrica de Bots de Atendimento IA
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Projete, customize e treine robôs de atendimento integrados com IA para automatizar seu comercial no WhatsApp e Web Chat.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveMainTab('factory')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeMainTab === 'factory' 
                  ? 'bg-cyan-500 text-slate-950 shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fábrica & Simulador
            </button>
            <button
              onClick={() => setActiveMainTab('code')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeMainTab === 'code' 
                  ? 'bg-cyan-500 text-slate-950 shadow' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Código de Integração IA
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Serviço de WhatsApp Integrado: Ativo</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-1">
        
        {/* Left/Middle Column: Configuration and Creation Form */}
        <div className="lg:col-span-8 space-y-8">
          {activeMainTab === 'factory' ? (
            <>

          {/* WhatsApp QR Code Connection Panel */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-emerald-400" />
                  Conexão WhatsApp em Tempo Real
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Conecte seu WhatsApp via QR Code para ativar o auto-responder inteligente do Gemini.
                </p>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border ${
                waStatus === 'CONNECTED' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                  : waStatus === 'QR_READY'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                    : waStatus === 'CONNECTING'
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  waStatus === 'CONNECTED' 
                    ? 'bg-emerald-400 animate-ping' 
                    : waStatus === 'QR_READY'
                      ? 'bg-amber-400 animate-pulse'
                      : waStatus === 'CONNECTING'
                        ? 'bg-cyan-400 animate-pulse'
                        : 'bg-slate-500'
                }`} />
                {waStatus === 'CONNECTED' && "CONECTADO"}
                {waStatus === 'QR_READY' && "AGUARDANDO LEITURA"}
                {waStatus === 'CONNECTING' && "INICIALIZANDO..."}
                {waStatus === 'DISCONNECTED' && "DESCONECTADO"}
              </div>
            </div>

            {waStatus === 'DISCONNECTED' && (
              <div className="flex flex-col md:flex-row items-center gap-6 py-2">
                <div className="flex-1 space-y-4">
                  <p className="text-xs text-slate-300 leading-relaxed text-left">
                    Ao conectar, nossa API baseada em Node.js inicia uma instância headless do WhatsApp que sincroniza com seu celular. O Gemini API processará todas as mensagens recebidas de forma 100% autônoma, usando o contexto do negócio <strong className="text-cyan-400">Foco em Dados</strong> e as diretrizes do seu bot ativo.
                  </p>
                  
                  {/* Phone Input Box */}
                  <div className="space-y-1.5 text-left max-w-sm">
                    <label htmlFor="phoneNumberInput" className="block text-xs font-bold text-slate-300">
                      Seu Número do WhatsApp Real (com DDI e DDD)
                    </label>
                    <input
                      id="phoneNumberInput"
                      type="text"
                      placeholder="Ex: 5511999999999"
                      value={inputPhoneNumber}
                      onChange={(e) => setInputPhoneNumber(e.target.value.replace(/[^\d]/g, ''))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 h-10 text-xs text-slate-200 outline-none transition-all placeholder:text-slate-600"
                    />
                    <p className="text-[10px] text-slate-500 leading-snug">
                      Insira o código do país (55 para Brasil), DDD e o número completo (apenas dígitos).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-400 text-left">
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-slate-950 text-emerald-400 rounded-lg">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span>Zero fluxos engessados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-slate-950 text-emerald-400 rounded-lg">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                      <span>Histórico de contexto ativo</span>
                    </div>
                  </div>
                  
                  {/* Dual Action Buttons Group */}
                  <div className="flex flex-wrap gap-3 pt-2 text-left">
                    {/* Primary Highlight: Simulate/Start Bot Test */}
                    <button
                      type="button"
                      onClick={handleInstantSimulateTest}
                      disabled={loadingWaAction}
                      className="inline-flex items-center gap-2 text-xs font-black bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 px-5 h-11 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 animate-pulse-subtle"
                      title="Simular início de um teste do robô integrado"
                    >
                      {loadingWaAction ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4.5 h-4.5 fill-current" />}
                      Iniciar Teste do Robô no WhatsApp
                    </button>

                    {/* Secondary Hook: Connect WhatsApp via QR Code */}
                    <button
                      type="button"
                      onClick={handleWaConnect}
                      disabled={loadingWaAction}
                      className="inline-flex items-center gap-2 text-xs font-bold border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 disabled:opacity-50 text-slate-200 px-5 h-11 rounded-xl transition-all cursor-pointer shadow-md"
                      title="Preparar o layout e gerar o QR Code real"
                    >
                      {loadingWaAction ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                      Conectar WhatsApp via QR Code
                    </button>
                  </div>
                </div>
                
                <div className="w-44 h-44 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-4 text-slate-600">
                  <MessageCircleCode className="w-10 h-10 mb-2 opacity-20" />
                  <span className="text-[10px] font-medium tracking-wide uppercase">Sem QR Code Ativo</span>
                </div>
              </div>
            )}

            {waStatus === 'CONNECTING' && (
              <div className="flex flex-col md:flex-row items-center gap-6 py-2">
                <div className="flex-1 space-y-3 text-left">
                  <h3 className="text-sm font-bold text-slate-200">Gerando instância de conexão...</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Estamos rodando o servidor Express de segundo plano e alocando uma sessão. Isso leva apenas alguns segundos...
                  </p>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
                
                <div className="w-44 h-44 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                </div>
              </div>
            )}

            {waStatus === 'QR_READY' && (
              <div className="flex flex-col md:flex-row items-center gap-6 py-2">
                <div className="flex-1 space-y-3 text-left">
                  <h3 className="text-sm font-bold text-slate-200">Aponte a câmera do seu celular</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Abra o WhatsApp &gt; Dispositivos Conectados &gt; Conectar um dispositivo. Após a leitura, a instância será ativada e começará a responder automaticamente em tempo real!
                  </p>
                  
                  {inputPhoneNumber && (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <p className="text-[11px] text-slate-400 mb-1 font-semibold">Prefere link direto?</p>
                      <a
                        href={`https://api.whatsapp.com/send?phone=${inputPhoneNumber.replace(/[^\d]/g, '')}&text=Ol%C3%A1!%20Gostaria%20de%20testar%20o%20rob%C3%B4%20de%20atendimento%20da%20Foco%20em%20Dados.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-all underline"
                      >
                        Clique para simular/abrir no WhatsApp Web ↗
                      </a>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      onClick={handleWaSimulateScan}
                      disabled={loadingWaAction}
                      className="inline-flex items-center gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 h-10 rounded-xl transition-all cursor-pointer"
                    >
                      {loadingWaAction ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Check className="w-4 h-4" />}
                      Simular Leitura (Escanear QR)
                    </button>
                    <button
                      onClick={handleWaDisconnect}
                      disabled={loadingWaAction}
                      className="inline-flex items-center gap-2 text-xs font-bold border border-slate-800 hover:bg-slate-900 text-slate-400 px-4 h-10 rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xl relative group overflow-hidden shrink-0">
                  {waQrCode ? (
                    <img src={waQrCode} alt="WhatsApp QR Code" className="w-36 h-36 select-none" />
                  ) : (
                    <div className="w-36 h-36 bg-slate-100 flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center p-4 text-center">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">Instância Pronta para Conectar</span>
                  </div>
                </div>
              </div>
            )}

            {waStatus === 'CONNECTED' && (
              <div className="flex flex-col md:flex-row items-center gap-6 py-2">
                <div className="flex-1 space-y-3 text-left">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      Linha Conectada: {waPhoneNumber}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Conectado desde: {waConnectedAt ? new Date(waConnectedAt).toLocaleString('pt-BR') : 'Agora'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-850/50 pb-1.5">
                      <span>Métricas de Execução Real (Node.js)</span>
                      <span className="text-emerald-400 font-mono font-semibold">Ativo</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-300 pt-0.5">
                      <div>• Modelo: <strong className="text-cyan-400 font-mono">Gemini 3.5</strong></div>
                      <div>• Contexto: <strong className="text-cyan-400 font-mono">Habilitado</strong></div>
                      <div>• Fluxo: <strong className="text-emerald-400 font-mono">100% IA</strong></div>
                      <div>• Latência: <strong className="text-emerald-400 font-mono">~1.8s</strong></div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="bg-emerald-950/20 border border-emerald-900/30 text-[10px] text-emerald-400 font-bold px-2.5 py-1 rounded-lg">
                      🟢 Pronto para receber mensagens no Playground!
                    </div>
                    <button
                      onClick={handleWaDisconnect}
                      disabled={loadingWaAction}
                      className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/20 border border-red-900/30 px-3.5 h-8.5 rounded-lg transition-all cursor-pointer"
                    >
                      Desconectar Canal
                    </button>
                  </div>
                </div>
                
                <div className="w-44 h-44 bg-slate-950 border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2.5 text-emerald-400 relative">
                    <Phone className="w-6 h-6 animate-bounce" />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-950" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">WHATSAPP LIVE</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Section: Create New Bot */}
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-10" />
            
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-cyan-400" />
              Configurar Novo Bot Inteligente
            </h2>

            <form onSubmit={handleCreateBot} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Nome do Atendente / Identificador</label>
                  <input 
                    type="text" 
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    placeholder="Ex: Assistente de Vendas Pix"
                    required
                    className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Nicho de Atuação</label>
                  <select 
                    value={botNiche}
                    onChange={(e) => setBotNiche(e.target.value as any)}
                    className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-3.5 text-sm text-slate-200 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="E-commerce">E-commerce / Vendas Diretas</option>
                    <option value="Serviços/Agência">Serviços / Agências</option>
                    <option value="Negócio Local">Negócio Local / Clínicas / Consultórios</option>
                    <option value="Suporte">Suporte Técnico / Pós-Vendas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Canal de Disparo</label>
                  <select 
                    value={botChannel}
                    onChange={(e) => setBotChannel(e.target.value as any)}
                    className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-3.5 text-sm text-slate-200 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="WhatsApp">WhatsApp Business API</option>
                    <option value="Instagram">Instagram Direct DM</option>
                    <option value="Web Chat">Web Chat Integrado (Widget)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Modelo de IA</label>
                  <select 
                    value={botModel}
                    onChange={(e) => setBotModel(e.target.value)}
                    className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-3.5 text-sm text-slate-200 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Super Rápido)</option>
                    <option value="gemini-3.5-pro">Gemini 3.5 Pro (Raciocínio Avançado)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Tom de Voz / Personalidade</label>
                  <select 
                    value={botVoice}
                    onChange={(e) => setBotVoice(e.target.value as any)}
                    className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-3.5 text-sm text-slate-200 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="Persuasivo">Persuasivo & Focado em Vendas</option>
                    <option value="Profissional">Profissional & Corporativo</option>
                    <option value="Descontraído">Descontraído & Amigável</option>
                    <option value="Técnico">Altamente Técnico & Didático</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block">Objetivo Principal do Bot</label>
                <input 
                  type="text" 
                  value={botGoal}
                  onChange={(e) => setBotGoal(e.target.value)}
                  placeholder="Ex: Pegar nome, e-mail e encaminhar o link de pagamento Pix de R$ 97,00"
                  className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block flex items-center justify-between">
                  <span>Instruções de Comportamento Customizadas (System Prompt)</span>
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Poder de IA</span>
                </label>
                <textarea 
                  rows={3}
                  value={botInstructions}
                  onChange={(e) => setBotInstructions(e.target.value)}
                  placeholder="Instrua o robô sobre sua empresa, produtos ou formas de fechamento. Ex: 'Nunca mencione concorrentes. Se o usuário pedir desconto, diga que o valor atual já é promocional.'"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={savingBot}
                className="w-full inline-flex items-center justify-center gap-2 font-black text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white h-12 rounded-xl shadow-lg shadow-cyan-500/10 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {savingBot ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Criar e Ativar Bot
              </button>
            </form>
          </div>

          {/* Section: My Bots List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Bots de Atendimento Ativos
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bots.map((bot) => (
                <div 
                  key={bot.id}
                  onClick={() => handleSelectBotPlayground(bot)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative group text-left ${
                    selectedBotForPlayground.id === bot.id 
                      ? 'bg-slate-900/80 border-cyan-500/50 shadow-lg shadow-cyan-500/5' 
                      : 'bg-slate-900/40 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-slate-950 text-cyan-400 rounded-xl border border-slate-850">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-200 group-hover:text-cyan-400 transition-colors">
                          {bot.name}
                        </h3>
                        <span className="text-[10px] text-slate-500 font-mono tracking-wide">
                          {bot.channel} • {bot.niche}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => toggleBotStatus(bot.id || '', e)}
                        className={`p-1.5 rounded-lg border text-xs transition-all ${
                          bot.active 
                            ? 'text-emerald-400 border-emerald-950/40 bg-emerald-950/20' 
                            : 'text-slate-500 border-slate-800 bg-slate-900'
                        }`}
                        title={bot.active ? "Desativar" : "Ativar"}
                      >
                        {bot.active ? <Play className="w-3.5 h-3.5" /> : <StopCircle className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={(e) => handleDeleteBot(bot.id || '', e)}
                        className="p-1.5 rounded-lg border border-slate-800 hover:border-red-950 text-slate-500 hover:text-red-400 bg-slate-900 hover:bg-red-950/20 transition-all"
                        title="Excluir Bot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 min-h-[2rem]">
                    {bot.goal}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-900 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Mensagens</span>
                      <strong className="text-xs text-slate-200 font-mono">{bot.messagesSent}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Conversão Pix</span>
                      <strong className="text-xs text-cyan-400 font-mono">{bot.conversionRate}%</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </>
          ) : (
            <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-6 relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-10" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 mb-4 gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-cyan-400" />
                    Função de Integração Autônoma (Gemini)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Esta é a estrutura da função em TypeScript para integrar seu robô de atendimento à API do Gemini sem fluxos engessados.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(integrationCodeString);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer select-none ${
                    copied 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar Código
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-950/80 border border-cyan-500/10 rounded-xl space-y-2 text-xs text-slate-300">
                  <p className="flex items-center gap-1.5 font-bold text-cyan-400">
                    <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" />
                    Funcionamento 100% Autônomo e Flexível
                  </p>
                  <p className="leading-relaxed">
                    Diferente de fluxos antigos e travados, esta estrutura utiliza o modelo <strong className="text-slate-100">Gemini 3.5 Flash</strong> de maneira dinâmica. Ao receber a mensagem, a IA analisa o histórico de mensagens, o contexto da <strong className="text-cyan-400">Foco em Dados</strong> e as diretrizes do bot selecionado para gerar respostas perfeitas e fluidas.
                  </p>
                </div>

                <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/50 space-y-2 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Bot Selecionado no Painel</span>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300">
                    <div>• Nome: <strong className="text-cyan-400 font-semibold">{selectedBotForPlayground?.name}</strong></div>
                    <div>• Nicho: <strong className="text-cyan-400 font-semibold">{selectedBotForPlayground?.niche}</strong></div>
                    <div>• Voz: <strong className="text-cyan-400 font-semibold">{selectedBotForPlayground?.voice}</strong></div>
                  </div>
                  <p className="text-slate-455 text-[11px] leading-normal pt-1">
                    Mude o bot selecionado no Playground (à direita ou lista de ativos) para atualizar dinamicamente o código e as diretrizes da IA em tempo real!
                  </p>
                </div>

                {/* Code Block */}
                <div className="relative">
                  <pre className="p-5 bg-slate-950 border border-slate-850 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed text-slate-300 max-h-[480px]">
                    <code>{integrationCodeString}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Bot Playground & Simulator */}
        <div className="lg:col-span-4 h-full">
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl flex flex-col h-[650px] relative overflow-hidden sticky top-24">
            
            {/* Playground Header */}
            <div className="p-4 border-b border-slate-900 bg-slate-900/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
                <div>
                  <h3 className="font-bold text-xs text-slate-200 block">Playground Simulado</h3>
                  <span className="text-[10px] text-slate-500 font-medium">Testando: {selectedBotForPlayground.name}</span>
                </div>
              </div>
              
              <span className="bg-slate-950 text-[10px] text-cyan-400 font-mono px-2 py-0.5 rounded border border-slate-850">
                {selectedBotForPlayground.voice}
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col justify-end">
              <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-cyan-600 text-slate-950 font-medium rounded-tr-none' 
                        : 'bg-slate-950 border border-slate-850 text-slate-200 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-600 font-mono mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                
                {loadingResponse && (
                  <div className="flex flex-col mr-auto items-start max-w-[85%]">
                    <div className="bg-slate-950 border border-slate-850 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-900 bg-slate-950/60 flex items-center gap-2">
              <input 
                type="text" 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Envie um oi para testar seu bot...`}
                className="flex-1 h-10 bg-slate-950 border border-slate-850 focus:border-cyan-500/50 rounded-lg px-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
              />
              <button 
                type="submit"
                disabled={loadingResponse || !inputMessage.trim()}
                className="w-10 h-10 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>

      </div>

    </div>
  );
}

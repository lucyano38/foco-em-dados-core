import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, MessageCircle, RefreshCw, Send, Sliders, Zap, CheckCircle2, AlertCircle, 
  Sparkles, ShieldCheck, Play, Pause, Database, Settings, HelpCircle, ArrowRight
} from 'lucide-react';
import QRCodeModal from './QRCodeModal';

export default function ClientDashboard() {
  // AI Training states
  const [nicho, setNicho] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  
  // WhatsApp connection states
  const [isWaConnected, setIsWaConnected] = useState(false);
  const [showWaModal, setShowWaModal] = useState(false);
  const [waQrLoading, setWaQrLoading] = useState(false);
  const [waQrImage, setWaQrImage] = useState<string | null>(null);
  const [waQrError, setWaQrError] = useState<string | null>(null);

  // Bot general status
  const [isBotActive, setIsBotActive] = useState(false);

  // Mock pre-written high-converting prompts based on niche
  const getMockPromptForNiche = (nicheName: string) => {
    const cleanNiche = nicheName.toLowerCase().trim();
    if (cleanNiche.includes('odonto') || cleanNiche.includes('dentista') || cleanNiche.includes('dente')) {
      return `Você é a Sofia, assistente virtual humanizada e ultra-persuasiva da Foco Odontologia. Sua especialidade é converter contatos frios em agendamentos de consultas de avaliação de implantes e estética dental.

DIRETRIZES DE COMPORTAMENTO:
1. Tom de voz: Empático, acolhedor, profissional e focado em bem-estar.
2. Seja direta e use parágrafos curtos (máximo 2 linhas por mensagem) para manter o ritmo de conversa humana no WhatsApp.
3. Jamais passe preços de procedimentos de forma direta. Explique que o diagnóstico depende de uma avaliação clínica presencial de alta tecnologia.
4. Escute ativamente as dores do paciente (medo de dor, vergonha do sorriso, custo) e apresente os benefícios do tratamento (autoestima, saúde, facilidade de pagamento).
5. Gatilho de Urgência: Sempre ofereça apenas 2 horários disponíveis para esta semana para a consulta de cortesia.

FLUXO DA CONVERSA:
Passo 1: Cumprimente com simpatia e pergunte o primeiro nome do paciente.
Passo 2: Entenda se o foco dele é estética, implante ou tratamento geral.
Passo 3: Explique resumidamente como a clínica transforma vidas sem dor.
Passo 4: Agende o horário de avaliação de forma assertiva.`;
    }

    if (cleanNiche.includes('estetica') || cleanNiche.includes('beleza') || cleanNiche.includes('salao') || cleanNiche.includes('clinica')) {
      return `Você é a Melina, assessora de beleza e assistente virtual inteligente da Bella Estética Avançada. Sua especialidade é encantar clientes no WhatsApp e fechar pacotes de tratamentos estéticos (emagrecimento, rejuvenescimento, depilação a laser).

DIRETRIZES DE COMPORTAMENTO:
1. Tom de voz: Extremamente sofisticado, alegre, entusiasmado e focado em resultados reais de beleza.
2. Use emojis de forma moderada e elegante (Ex: ✨, 🌸, 💧) para tornar as mensagens convidativas.
3. Enfatize a tecnologia de ponta dos nossos equipamentos e a segurança dos procedimentos.
4. Foco na transformação: Fale sobre recuperar a autoestima, se sentir livre na praia, e economizar tempo.
5. Fechamento assertivo: Estimule a vinda ao espaço para uma análise de bioimpedância computadorizada exclusiva.

FLUXO DA CONVERSA:
Passo 1: Receba o lead com entusiasmo e agradeça o interesse.
Passo 2: Pergunte qual região ou queixa mais incomoda (gordura localizada, flacidez, marcas).
Passo 3: Explique que temos protocolos personalizados exclusivos com garantia de satisfação.
Passo 4: Proponha uma sessão de consultoria estética sem custo para desenhar o plano de tratamento ideal.`;
    }

    // Default persuasive prompt
    return `Você é o Alex, consultor comercial sênior e assistente inteligente da ${nicheName || 'nossa empresa parceira'}. Sua missão de ouro é qualificar contatos e fechar agendamentos/vendas de alta conversão.

DIRETRIZES DE COMPORTAMENTO:
1. Seja direto, didático e focado na dor que o cliente quer resolver.
2. Use um formato fluido e nativo do WhatsApp: mensagens dinâmicas, sem textões, sempre finalizando com uma pergunta simples que estimula a resposta.
3. Demonstre autoridade inabalável no nicho de ${nicheName || 'atuação corporativo'}.
4. Domine as principais objeções com dados reais e benefícios imbatíveis.
5. Crie um senso de escassez e exclusividade nos bônus ou vagas disponíveis.

FLUXO DA CONVERSA:
Passo 1: Conecte calorosamente com o lead.
Passo 2: Identifique o maior gargalo operacional ou dor comercial dele.
Passo 3: Apresente nossa solução customizada como a única ponte para o sucesso.
Passo 4: Conduza para uma chamada estratégica rápida de 15 minutos ou fechamento imediato.`;
  };

  // Simulating the prompt generation with realistic progressive updates
  const handleGeneratePrompt = () => {
    if (!nicho.trim()) return;

    setIsGenerating(true);
    setSystemPrompt('');
    
    const steps = [
      'Analisando concorrência e público-alvo...',
      'Estruturando funil de vendas via WhatsApp...',
      'Injetando gatilhos mentais de urgência e reciprocidade...',
      'Modelando tom de voz da persona corporativa...',
      'Formatando roteiro dinâmico e otimizando para conversão...'
    ];

    let stepIndex = 0;
    setGenerationStep(steps[0]);

    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setGenerationStep(steps[stepIndex]);
      } else {
        clearInterval(interval);
        // Completed - generate the content and type it in
        const finalPrompt = getMockPromptForNiche(nicho);
        let textTyped = '';
        let charIndex = 0;
        
        setIsGenerating(false);
        setGenerationStep('');

        // Fast typing simulator
        const typingInterval = setInterval(() => {
          if (charIndex < finalPrompt.length) {
            textTyped += finalPrompt[charIndex];
            setSystemPrompt(textTyped);
            charIndex += 15; // Type 15 characters at a time for quick response
          } else {
            setSystemPrompt(finalPrompt); // Ensure exact final prompt is loaded
            clearInterval(typingInterval);
          }
        }, 15);
      }
    }, 900);
  };

  // Fetch real QR Code from Foco em Dados API
  const fetchWaQrCode = async () => {
    setWaQrLoading(true);
    setWaQrError(null);
    try {
      const response = await fetch('/get-qr');
      if (!response.ok) {
        throw new Error('Falha ao obter o QR Code. Verifique se o servidor de integração está online.');
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        const qr = data.qr || data.image || data.qrCode || data.url;
        if (qr) {
          if (qr.startsWith('data:image') || qr.startsWith('http')) {
            setWaQrImage(qr);
          } else {
            setWaQrImage(`data:image/png;base64,${qr}`);
          }
        } else {
          throw new Error('Nenhum QR Code retornado no JSON da API.');
        }
      } else {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setWaQrImage(imageUrl);
      }
    } catch (error: any) {
      console.warn("[WhatsApp QR] Erro ao carregar da API de QR Code:", error.message || error);
      setWaQrError(error.message || 'Erro ao conectar com a API de QR Code. Por favor, tente novamente.');
      setWaQrImage(null);
    } finally {
      setWaQrLoading(false);
    }
  };

  const handleConnectWhatsAppClick = () => {
    setShowWaModal(true);
    fetchWaQrCode();
  };

  const toggleBotActivation = () => {
    if (!systemPrompt.trim()) {
      alert("Por favor, gere ou digite um roteiro / System Prompt antes de ativar o robô.");
      return;
    }
    setIsBotActive(!isBotActive);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Dashboard Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-gray-900 border border-white/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase">Fábrica de Bots v2.4</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl">Painel Inteligente UniBot</h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Configure seu assistente autônomo com IA generativa, treine-o em segundos e conecte-o diretamente ao seu WhatsApp real.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={toggleBotActivation}
            className={`h-11 px-5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
              isBotActive
                ? 'bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
            }`}
          >
            {isBotActive ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                Pausar Instância
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Ativar Robô Comercial
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Stats and Canal Connection status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Connection Widget Card */}
        <div className="lg:col-span-1 rounded-3xl bg-slate-900/60 border border-white/5 p-6 space-y-6 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status da Conexão</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                Desconectado
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-200">Integração WhatsApp Real</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Conecte sua conta do WhatsApp Business para começar a automatizar o suporte e as vendas com IA diretamente nos chats reais.
              </p>
            </div>

            {/* Connection features */}
            <div className="space-y-2 pt-2 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>API Local Nativa estável</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Websockets ativos (whatsapp-web.js)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Respostas instantâneas (&lt; 2s)</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleConnectWhatsAppClick}
            className="w-full mt-6 h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950/20" />
            Conectar WhatsApp Real
          </button>
        </div>

        {/* Live Metrics Widget - Fábrica de Bots Concept */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-900/60 border border-white/5 p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Conversas Hoje</span>
              <Sliders className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">1.482</span>
              <span className="block text-[10px] text-emerald-400 mt-1 font-semibold">↑ 18.4% vs ontem</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Tempo de Resposta</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">1.2s</span>
              <span className="block text-[10px] text-emerald-400 mt-1 font-semibold">Tempo ideal de IA</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Assertividade IA</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-black text-white">99.2%</span>
              <span className="block text-[10px] text-slate-500 mt-1 font-semibold">Taxa de sucesso comercial</span>
            </div>
          </div>

          {/* Factory Console */}
          <div className="col-span-1 sm:col-span-3 p-4 rounded-2xl bg-slate-950 border border-white/5 font-mono text-[11px] text-slate-400 space-y-2">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-xs font-bold text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>Console de Automação de IA</span>
            </div>
            <div className="space-y-1 h-24 overflow-y-auto scrollbar-thin text-xs text-slate-500">
              <p className="text-slate-400">[SYSTEM] Instância de bot inicializada com sucesso.</p>
              <p>[CONFIG] Lógica de resposta conectada ao motor Gemini-2.5-Flash.</p>
              <p>[SUCESSO] Webhook cadastrado: focoemdados.com.br/webhook/whatsapp</p>
              <p className={isBotActive ? "text-emerald-400 animate-pulse" : ""}>
                {isBotActive 
                  ? "[ONLINE] Robô comercial operando ativamente. Escutando eventos..." 
                  : "[SLEEP] Aguardando acionamento ou ativação comercial."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feature: IA Training & Script Generation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Niche training form */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-900/60 border border-white/5 p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-400">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-lg font-extrabold text-white">Treinamento Inteligente da IA</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Diga o nicho comercial do seu negócio ou de seu cliente. Nossa IA generativa gerará um roteiro completo de alto impacto e o injetará instantaneamente no prompt de sistema do robô.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nicho-input" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Nicho da Empresa</label>
              <input
                id="nicho-input"
                type="text"
                placeholder="Ex: Clínica Odontológica, Salão de Estética..."
                value={nicho}
                onChange={(e) => setNicho(e.target.value)}
                disabled={isGenerating}
                className="w-full h-11 px-4 rounded-xl bg-slate-950 border border-white/5 focus:border-cyan-400/50 focus:outline-none text-slate-200 text-xs transition-all placeholder:text-slate-600"
              />
            </div>

            <button
              onClick={handleGeneratePrompt}
              disabled={isGenerating || !nicho.trim()}
              className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Gerando Roteiro...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-slate-950/20" />
                  Gerar Roteiro Profissional com IA
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl bg-slate-950 border border-white/5 space-y-2 text-[11px] font-mono text-slate-400"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span className="text-cyan-400 font-bold">Mapeando funil de inteligência:</span>
                </div>
                <p className="animate-pulse text-slate-300">{generationStep}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-4 rounded-xl bg-slate-950 border border-white/5 text-[11px] text-slate-500 space-y-2">
            <span className="font-bold text-slate-400 uppercase tracking-wide block">💡 Dica comercial:</span>
            <p className="leading-relaxed">
              Experimente digitar <span className="text-cyan-400">"Clínica Odontológica"</span> ou <span className="text-cyan-400">"Salão de Beleza"</span> para testar o gerador de roteiro ultra persuasivo integrado.
            </p>
          </div>
        </div>

        {/* System Prompt Code editor */}
        <div className="lg:col-span-7 rounded-3xl bg-slate-900/60 border border-white/5 p-6 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-extrabold text-white">System Prompt (Instruções de Personalidade)</h2>
            </div>
            <span className="text-[10px] font-mono text-slate-500">ReadOnly / AI Synchronized</span>
          </div>

          <div className="flex-1 min-h-[300px] flex flex-col relative">
            <textarea
              aria-label="Instruções de personalidade do robô (System Prompt)"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Aguardando treinamento inteligente da IA... Insira o nicho da sua empresa no formulário ao lado e clique em 'Gerar Roteiro Profissional com IA' para assistir à mágica acontecer em tempo real."
              className="w-full flex-1 p-5 rounded-2xl bg-slate-950 border border-white/5 focus:border-cyan-400/30 focus:outline-none text-slate-300 font-mono text-xs leading-relaxed resize-none h-full placeholder:text-slate-600"
            />
            
            {/* Status floating label */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-[10px] text-slate-400 font-mono shadow-md">
              <span className={`h-2 w-2 rounded-full ${systemPrompt ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              <span>{systemPrompt ? 'Roteiro Pronto para Uso' : 'Aguardando Roteiro'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reusable QR Code Modal integration */}
      <QRCodeModal
        isOpen={showWaModal}
        onClose={() => setShowWaModal(false)}
        qrData={waQrImage}
        isLoading={waQrLoading}
        error={waQrError}
        onRefresh={fetchWaQrCode}
        title="Conectar WhatsApp Real"
        description="Escaneie o QR Code abaixo com seu WhatsApp para ler a nossa API real e sincronizar a sua Fábrica de Bots com o seu celular corporativo!"
      />
    </div>
  );
}

import { useState } from 'react';
import { ArrowLeft, FileText, Lock, Scale, AlertOctagon, Mail, ShieldCheck } from 'lucide-react';

export default function TermsOfService({ onBack }: { onBack: () => void }) {
  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 contract-dark-container">
      {/* Decorative gradient blur background */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer select-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Página Inicial
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 font-bold">focoemdados.com.br</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-4 py-12 md:py-16 text-left">
        {/* Banner Title */}
        <div className="mb-12 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold mb-4">
            <Scale className="w-3.5 h-3.5" />
            Termos de Serviço
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-100">
            Termos e Condições de Uso da Plataforma
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-3">
            Última atualização: 3 de Julho de 2026
          </p>
        </div>

        {/* Highlight Alert Box for Liability / Automations */}
        <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-6 mb-10 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0" />
            Responsabilidade e Controle das Automações por Inteligência Artificial
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Ao ativar e conectar seus robôs de atendimento e inteligência artificial integrados ao WhatsApp ou ao motor de análises (BI Analytics), você compreende que as respostas geradas baseiam-se em modelos generativos avançados (Gemini API). 
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            O usuário assume integral responsabilidade pelas configurações de comportamentos, objetivos e dados de instruções inseridos no painel da Fábrica de Bots. Recomendamos testar exaustivamente o robô no Playground de Simulação antes de colocá-lo em ambiente real de produção com seus clientes finais.
          </p>
        </div>

        {/* Full terms sections */}
        <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <span className="text-cyan-400 font-mono">1.</span> Aceitação dos Termos
            </h2>
            <p>
              Ao se cadastrar e utilizar os serviços da plataforma <span className="text-slate-200 font-semibold">Foco em Dados</span>, você concorda em cumprir e estar legalmente vinculado a estes Termos de Serviço e à nossa Política de Privacidade. Caso discorde de qualquer cláusula ou condição estabelecida, recomendamos que interrompa imediatamente o uso dos nossos serviços.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <span className="text-cyan-400 font-mono">2.</span> Descrição do Serviço SaaS
            </h2>
            <p>
              A <span className="text-slate-200">Foco em Dados</span> é uma plataforma de Business Intelligence, análise de planilhas e automação de atendimento em WhatsApp via IA. O serviço inclui:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Upload de arquivos CSV/Excel (inclusive via integração com o Google Drive) para processamento, geração de gráficos interativos e consultas por chat.</li>
              <li>Fábrica de Bots para a configuração de robôs de conversação inteligentes, gerados de forma autônoma pela API do Gemini.</li>
              <li>Acesso a dashboards analíticos de performance de negócios em tempo real.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <span className="text-cyan-400 font-mono">3.</span> Regras de Uso Aceitável e Conformidade
            </h2>
            <p>
              Você concorda em usar os serviços apenas para fins lícitos e autorizados, em estrito cumprimento de todas as leis nacionais e internacionais aplicáveis. É expressamente proibido:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Utilizar a Fábrica de Bots ou automação de WhatsApp para disparo em massa de spam, golpes, mensagens fraudulentas ou material ofensivo de qualquer natureza.</li>
              <li>Fazer upload de dados protegidos por direitos autorais de terceiros, ou arquivos contendo malwares, vírus ou códigos destrutivos no BI Analytics.</li>
              <li>Tentar engenharia reversa, violação das barreiras de segurança ou exploração de brechas na arquitetura do sistema hospedado.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <span className="text-cyan-400 font-mono">4.</span> Isenção e Limitação de Responsabilidade
            </h2>
            <p>
              O serviço é fornecido "no estado em que se encontra" (as is). A <span className="text-slate-200">Foco em Dados</span> não garante o funcionamento ininterrupto ou livre de falhas de terceiros (como falhas de redes do WhatsApp, instabilidades temporárias das APIs do Google ou indisponibilidade global dos servidores de IA).
            </p>
            <p>
              Em nenhuma circunstância seremos responsáveis por lucros cessantes, perdas financeiras ou danos acidentais decorrentes de decisões empresariais baseadas nas projeções dos gráficos de BI, ou de interações imprecisas que o robô IA possa ter fornecido ao seu cliente final. O controle, parametrização e monitoramento periódico dos robôs configurados são de dever exclusivo do contratante.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <span className="text-cyan-400 font-mono">5.</span> Propriedade Intelectual e Proteção de Dados
            </h2>
            <p>
              Todo o código-fonte, marca, identidade visual, material instrucional e infraestrutura proprietária da plataforma pertencem exclusivamente à <span className="text-slate-200 font-semibold">Foco em Dados</span>. 
            </p>
            <p>
              Os dados e relatórios que você envia ou constrói no sistema pertencem inteiramente a você. Nós não reivindicamos qualquer propriedade intelectual sobre os seus dados operacionais, informações financeiras de planilhas ou conversas dos seus clientes finais.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <span className="text-cyan-400 font-mono">6.</span> Alterações nestes Termos
            </h2>
            <p>
              Reservamo-nos o direito de alterar, atualizar ou revisar estes Termos de Serviço a qualquer momento para refletir melhorias técnicas, mudanças legislativas ou novos recursos na plataforma. Notificações de mudanças importantes serão enviadas por e-mail ou publicadas em destaque no nosso painel. A continuação da utilização do sistema após as modificações constitui sua aceitação plena dos novos termos.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <span className="text-cyan-400 font-mono">7.</span> Contato e Suporte Comercial
            </h2>
            <p>
              Para esclarecer qualquer cláusula destes Termos ou formalizar acordos de níveis de serviço (SLA) específicos para a sua empresa, entre em contato diretamente através do e-mail oficial:
            </p>
            <div className="bg-slate-900/60 p-5 border border-slate-800 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Suporte Legal</span>
                <a href="mailto:atendimento@focoemdados.com.br" className="text-sm font-mono font-bold text-cyan-400 hover:underline">
                  atendimento@focoemdados.com.br
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Page Footer inside content */}
        <div className="mt-16 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© 2026 Foco em Dados. Todos os direitos reservados.</div>
          <div className="flex gap-4">
            <a href="/politica-de-privacidade" className="hover:text-slate-300 transition-colors">Política de Privacidade</a>
            <span>•</span>
            <span className="text-cyan-500/80 font-bold">focoemdados.com.br</span>
          </div>
        </div>
      </main>
    </div>
  );
}

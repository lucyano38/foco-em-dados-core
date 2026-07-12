import { useState } from 'react';
import { ArrowLeft, Shield, Lock, FileText, Eye, Mail, Info } from 'lucide-react';

export default function PrivacyPolicy({ onBack }: { onBack: () => void }) {
  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Decorative gradient blur background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10" />

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
            <Shield className="w-3.5 h-3.5" />
            Política de Privacidade
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-100">
            Política de Privacidade e Proteção de Dados
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-3">
            Última atualização: 3 de Julho de 2026
          </p>
        </div>

        {/* Focus Highlight Card for Google Verification */}
        <div className="bg-gradient-to-r from-cyan-505/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6 mb-10 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Info className="w-5 h-5 text-cyan-400 shrink-0" />
            Aviso de Transparência da API do Google (Google Drive)
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Nossa plataforma utiliza a integração com as APIs do Google (como a permissão <code className="text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono text-[11px]">https://www.googleapis.com/auth/drive.file</code>) para permitir que você selecione e analise planilhas diretamente do seu Google Drive. 
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-5">
            <li>
              <strong className="text-slate-200">Acesso Estritamente Restrito:</strong> O acesso serve única e exclusivamente para a leitura e análise automatizada pelo próprio usuário utilizando nosso motor de BI Analytics.
            </li>
            <li>
              <strong className="text-slate-200">Zero Armazenamento Permanente:</strong> O conteúdo dos seus arquivos lidos não é armazenado permanentemente nos nossos servidores. Todo o processamento ocorre de forma transient em memória para geração dos relatórios solicitados.
            </li>
            <li>
              <strong className="text-slate-200">Não Compartilhamento:</strong> Nenhum dado pessoal, corporativo ou sensível extraído dos arquivos do Google Drive é partilhado com terceiros.
            </li>
          </ul>
        </div>

        {/* Full policy sections */}
        <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <span className="text-cyan-400 font-mono">1.</span> Coleta de Informações
            </h2>
            <p>
              Nós coletamos apenas as informações estritamente necessárias para a prestação dos nossos serviços de inteligência artificial e processamento de planilhas de dados.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong>Informações de Cadastro:</strong> Nome, e-mail e foto do perfil obtidos através do login social com o Google de forma a identificar a sua conta.</li>
              <li><strong>Dados de Integração:</strong> Acesso temporário a arquivos autorizados por você via Google Drive e WhatsApp para possibilitar as análises automatizadas e operação dos robôs criados na Fábrica de Bots.</li>
              <li><strong>Dados de Utilização:</strong> Logs de uso do painel e interações com o chat da Inteligência Artificial.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <span className="text-cyan-400 font-mono">2.</span> Uso das Informações e Dados do Google Drive
            </h2>
            <p>
              Os dados coletados e os arquivos lidos do seu Google Drive são utilizados de forma automatizada com os seguintes objetivos:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Permitir que o usuário carregue planilhas em formatos CSV/Excel direto do Drive para construir gráficos e obter projeções financeiras.</li>
              <li>Alimentar o modelo de linguagem natural (como a API do Gemini) com dados estruturados para responder perguntas em tempo real de forma precisa sobre a sua empresa.</li>
              <li>Gerenciar as configurações do robô de atendimento do WhatsApp da sua empresa de acordo com as instruções fornecidas no painel da Fábrica de Bots.</li>
            </ul>
            <p className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl text-xs text-slate-400">
              O uso de informações recebidas de APIs do Google por parte da <span className="text-slate-200 font-semibold">Foco em Dados</span> estará em total conformidade com a <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Política de Dados do Usuário de Serviços de API do Google</a>, incluindo os requisitos de Uso Limitado (Limited Use).
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <span className="text-cyan-400 font-mono">3.</span> Segurança e Armazenamento dos Dados
            </h2>
            <p>
              A segurança das suas informações e da sua empresa é nossa prioridade máxima. Adotamos as seguintes medidas protetivas:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Criptografia de dados em trânsito (HTTPS/TLS) e criptografia de ponta-a-ponta em todas as comunicações essenciais.</li>
              <li>Isolamento de banco de dados robusto no Firebase Firestore sob regras rígidas de segurança corporativa de forma que nenhum usuário tenha acesso aos dados de outro.</li>
              <li>Mecanismo de desautenticação e revogação de tokens de acesso que permite ao usuário desconectar suas credenciais do Google Drive ou WhatsApp a qualquer momento a partir do painel.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <span className="text-cyan-400 font-mono">4.</span> Retenção e Exclusão de Dados
            </h2>
            <p>
              Você detém total controle sobre os seus dados. Os dados coletados para cadastro são mantidos enquanto a sua conta estiver ativa. Se desejar solicitar a exclusão definitiva dos seus dados de cadastro, configurações de robôs criados, históricos e revogar todas as credenciais de APIs conectadas, você pode entrar em contato diretamente pelo nosso e-mail oficial.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <span className="text-cyan-400 font-mono">5.</span> Compartilhamento de Informações
            </h2>
            <p>
              A <span className="text-slate-200">Foco em Dados</span> <strong className="text-cyan-400">não vende, não aluga e não compartilha</strong> as suas informações pessoais ou dados operacionais com terceiros ou com redes de anúncios de publicidade. Transferências de dados só ocorrem quando expressamente necessário para o funcionamento técnico contratado (por exemplo, envio do texto para a API do Gemini processar a inteligência do bot ou envio para servidores seguros do WhatsApp para transmitir a resposta de atendimento), sob termos rígidos de confidencialidade de dados.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
              <span className="text-cyan-400 font-mono">6.</span> Contato e Suporte
            </h2>
            <p>
              Se houver qualquer dúvida sobre esta Política de Privacidade ou sobre o tratamento das suas informações integradas, entre em contato imediatamente com o nosso encarregado de proteção de dados:
            </p>
            <div className="bg-slate-900/60 p-5 border border-slate-800 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail Oficial</span>
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
            <a href="/termos" onClick={(e) => { e.preventDefault(); window.history.pushState(null, '', '/termos'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="hover:text-slate-300 transition-colors">Termos de Serviço</a>
            <span>•</span>
            <span className="text-cyan-500/80 font-bold">focoemdados.com.br</span>
          </div>
        </div>
      </main>
    </div>
  );
}

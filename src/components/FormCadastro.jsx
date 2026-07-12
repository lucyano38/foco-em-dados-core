import React, { useState } from 'react';
import { auth, db } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';

/**
 * COMPONENTE FORMULARIO DE CADASTRO & LOGIN
 * 
 * Implementa uma interface premium de autenticação com tema Dark/Slate.
 * 
 * REGRA DE OURO IMPLEMENTADA:
 * No momento de cadastro, se o e-mail for "lucyano.pci@gmail.com", 
 * a permissão (role) é automaticamente definida como "Master".
 * Os demais usuários são salvos com a permissão "Gratuito".
 */
export default function FormCadastro({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    try {
      if (isLogin) {
        // Fluxo de Login Comercial
        const userCredential = await signInWithEmailAndPassword(auth, email, senha);
        setSucesso('Conexão realizada com sucesso! Redirecionando...');
        if (onAuthSuccess) {
          onAuthSuccess(userCredential.user);
        }
      } else {
        // Validações básicas de cadastro
        if (!nome.trim()) {
          throw new Error('Por favor, digite seu nome.');
        }

        // Criar usuário no Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        const user = userCredential.user;

        // Atualiza perfil básico do usuário
        await updateProfile(user, { displayName: nome });

        // REGRA DE OURO OBRIGATÓRIA: Identificar usuário especial de teste
        const userRole = email.trim().toLowerCase() === 'lucyano.pci@gmail.com' ? 'Master' : 'Gratuito';

        // Salvar as permissões no Firestore Database com segurança
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          name: nome,
          email: email.trim().toLowerCase(),
          role: userRole,
          createdAt: new Date().toISOString(),
          stripeCustomerId: null
        });

        setSucesso(`Conta criada! Nível de acesso: ${userRole}. Iniciando sessão...`);
        if (onAuthSuccess) {
          onAuthSuccess(user);
        }
      }
    } catch (error) {
      console.error("Erro na autenticação:", error);
      // Traduzir erros comuns do Firebase para Português de forma amigável
      let msgErro = error.message;
      if (error.code === 'auth/email-already-in-use') {
        msgErro = 'Este e-mail já está sendo utilizado por outra conta.';
      } else if (error.code === 'auth/weak-password') {
        msgErro = 'A senha deve possuir pelo menos 6 caracteres.';
      } else if (error.code === 'auth/invalid-email') {
        msgErro = 'Por favor, insira um endereço de e-mail válido.';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msgErro = 'Credenciais incorretas ou usuário não cadastrado.';
      }
      setErro(msgErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-left">
      {/* Detalhes de Background Glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cabeçalho */}
      <div className="mb-6 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded-full">
            Plataforma BI
          </span>
        </div>
        <h2 className="text-2xl font-black text-slate-100 tracking-tight">
          {isLogin ? 'Bem-vindo ao Foco em Dados' : 'Crie sua Conta Pro'}
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          {isLogin 
            ? 'Monitore suas vendas e integre seus dashboards inteligentes em tempo real.' 
            : 'Tenha acesso imediato a ferramentas de inteligência artificial de resposta direta.'}
        </p>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        
        {/* Campo Nome (Apenas em Cadastro) */}
        {!isLogin && (
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Nome Completo
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Lucyano de Souza"
                className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Campo E-mail */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            E-mail Corporativo
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@empresa.com"
              className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
            />
          </div>
          {/* Alerta de Role Master automática */}
          {email.trim().toLowerCase() === 'lucyano.pci@gmail.com' && !isLogin && (
            <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              Regra de Ouro Ativa: Ativação automática de privilégios "Master"!
            </div>
          )}
        </div>

        {/* Campo Senha */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Sua Senha Segura
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </span>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
            />
          </div>
        </div>

        {/* Mensagens de Feedback */}
        {erro && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3 rounded-xl flex items-start gap-2 animate-in fade-in duration-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{sucesso}</span>
          </div>
        )}

        {/* Botão de Envio */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Autenticando...
            </>
          ) : (
            <>
              <span>{isLogin ? 'Entrar na Plataforma' : 'Criar minha Conta'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </>
          )}
        </button>
      </form>

      {/* Alternador de Modo */}
      <div className="mt-5 pt-4 border-t border-slate-800 text-center relative z-10">
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setErro('');
            setSucesso('');
          }}
          className="text-xs text-slate-400 hover:text-cyan-400 transition-colors font-medium"
        >
          {isLogin 
            ? 'Ainda não possui conta? Cadastre-se' 
            : 'Já possui uma conta ativa? Faça login'}
        </button>
      </div>
    </div>
  );
}

import { useState, useMemo, useRef, useEffect } from 'react';
import { Upload, FileUp, Sparkles, BarChart3, Database, ShieldCheck, CreditCard, LayoutDashboard, AlertCircle, ArrowRight, GitCompare, MessageSquare, X, Send, Bot, User, LogOut, Lock, Printer, FileSpreadsheet, Trash2, HelpCircle, CheckCircle2, Cloud, Globe, Search, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Joyride, STATUS, Step } from 'react-joyride';
import { DashboardData, AdminMetrics, CompareWebResult } from './types';
import clsx from 'clsx';
import { auth, signInWithGoogle, logOut, db } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SpreadsheetGrid } from './components/SpreadsheetGrid';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'pro'>('free');
  const [userRole, setUserRole] = useState<'Master' | 'User'>('User');
  const [quotaUsed, setQuotaUsed] = useState(0);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const FREE_QUOTA_LIMIT = 3;

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzingTrend, setIsAnalyzingTrend] = useState(false);
  const [projectedData, setProjectedData] = useState<any[]>([]);
  
  // State for Comparison File
  const [secondData, setSecondData] = useState<DashboardData | null>(null);
  const [isUploadingSecond, setIsUploadingSecond] = useState(false);

  // State for Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // State for Tour
  const [runTour, setRunTour] = useState(false);

  // Web Search Compare (Premium Feature)
  const [selectedProduct, setSelectedProduct] = useState("");
  const [customProductName, setCustomProductName] = useState("");
  const [productPriceValue, setProductPriceValue] = useState("");
  const [additionalCtxValue, setAdditionalCtxValue] = useState("");
  const [isComparingWeb, setIsComparingWeb] = useState(false);
  const [compareWebResult, setCompareWebResult] = useState<CompareWebResult | null>(null);
  const [compareWebError, setCompareWebError] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isSpreadsheetView, setIsSpreadsheetView] = useState(false);

  // Excel-style column comparator states
  const [selectedXKey, setSelectedXKey] = useState<string>("");
  const [selectedYKey, setSelectedYKey] = useState<string>("");
  // Chat filtering states
  const [chatFilteredData, setChatFilteredData] = useState<Record<string, string | number | boolean>[] | null>(null);
  const [chatFilterExplanation, setChatFilterExplanation] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create user document
        const userRef = doc(db, 'users', currentUser.uid);
        let userSnap;
        try {
          userSnap = await getDoc(userRef);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
          return;
        }

        const email = currentUser.email || "";
        const isLucyano = email.toLowerCase() === 'lucyano.pci@gmail.com';
        
        if (userSnap && userSnap.exists()) {
          const data = userSnap.data();
          let plan = data.plan || 'free';
          let role = data.role || 'User';

          if (isLucyano && (plan !== 'pro' || role !== 'Master')) {
            plan = 'pro';
            role = 'Master';
            try {
              await setDoc(userRef, { plan: 'pro', role: 'Master' }, { merge: true });
            } catch (err) {
              console.error("Erro ao atualizar Master/Premium no Firestore:", err);
            }
          }

          setUserPlan(plan);
          setQuotaUsed(data.quotaUsed || 0);
          setUserRole(role);
        } else {
          const plan = isLucyano ? 'pro' : 'free';
          const role = isLucyano ? 'Master' : 'User';
          try {
            await setDoc(userRef, {
              email: currentUser.email,
              plan,
              quotaUsed: 0,
              role,
              createdAt: new Date().toISOString()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, `users/${currentUser.uid}`);
            return;
          }
          setUserPlan(plan);
          setQuotaUsed(0);
          setUserRole(role);
        }
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const preDataSteps: Step[] = [
    {
      target: '.tour-upload',
      content: 'Bem-vindo(a) ao DataFlow AI! Comece fazendo o upload da sua planilha (CSV) aqui para transformá-la em um painel interativo.',
      placement: 'bottom',
    }
  ];

  const postDataSteps: Step[] = [
    {
      target: '.tour-insight',
      content: 'A Inteligência Artificial analisa automaticamente seus dados e gera insights em segundos.',
      placement: 'bottom',
    },
    {
      target: '.tour-trend',
      content: 'Clique aqui para prever resultados futuros! A IA avalia os dados e projeta tendências.',
      placement: 'bottom',
    },
    {
      target: '.tour-chat',
      content: 'Precisa de algo mais específico? Converse com o nosso Assistente de IA sobre os seus dados aqui!',
      placement: 'left',
    }
  ];

  const tourSteps = data ? postDataSteps : preDataSteps;

  useEffect(() => {
    // Start initial tour after mount if first visit
    if (!data && localStorage.getItem('tourSeen') === null) {
      setRunTour(true);
    }
  }, []);

  useEffect(() => {
    // Start dashboard tour after data is loaded if first visit
    if (data && localStorage.getItem('tourSeen') === null) {
      const timer = setTimeout(() => {
        setRunTour(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [data]);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('tourSeen', 'true');
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !data) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage,
          contextData: data.sampleData // Sending all available rows (max 50) for rich analysis
        })
      });

      if (!response.ok) throw new Error("Failed to get chat response");
      const result = await response.json();
      
      setChatMessages(prev => [...prev, { role: 'ai', content: result.answer }]);
      
      if (result.isFiltered && result.filteredData && Array.isArray(result.filteredData)) {
        setChatFilteredData(result.filteredData);
        if (result.chartXKey && data.headers.includes(result.chartXKey)) {
          setSelectedXKey(result.chartXKey);
        }
        if (result.chartYKey && data.headers.includes(result.chartYKey)) {
          setSelectedYKey(result.chartYKey);
        }
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'ai', content: "Desculpe, tive um problema ao responder sua pergunta. Tente novamente." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const fetchAdminMetrics = async () => {
    setIsAdminLoading(true);
    setAdminError(null);
    setAdminMetrics(null);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        setAdminError("Nenhum usuário autenticado encontrado. Faça login para testar.");
        setIsAdminLoading(false);
        return;
      }

      const res = await fetch("/api/admin/metrics", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Erro de rede" }));
        throw new Error(errData.error || `Erro HTTP ${res.status}`);
      }

      const metrics = await res.json();
      setAdminMetrics(metrics);
    } catch (err: any) {
      console.error(err);
      setAdminError(err.message || "Falha ao carregar métricas de administração.");
    } finally {
      setIsAdminLoading(false);
    }
  };

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
      const droppedFile = e.dataTransfer.files[0];
      
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError("O tamanho do arquivo excede o limite máximo permitido de 10MB.");
        return;
      }

      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];
      const fileExtension = droppedFile.name.split('.').pop()?.toLowerCase();
      
      if (validTypes.includes(droppedFile.type) || fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Tipo de arquivo inválido. Por favor, envie apenas planilhas nos formatos CSV ou Excel (.csv, .xlsx, .xls).");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("O tamanho do arquivo excede o limite máximo permitido de 10MB.");
        return;
      }

      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (validTypes.includes(selectedFile.type) || fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Tipo de arquivo inválido. Por favor, envie apenas planilhas nos formatos CSV ou Excel (.csv, .xlsx, .xls).");
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    if (!user) {
      setError("Você precisa fazer login para analisar arquivos.");
      return;
    }

    if (userPlan === 'free' && quotaUsed >= FREE_QUOTA_LIMIT) {
      setError(`Você atingiu o limite de ${FREE_QUOTA_LIMIT} relatórios do plano gratuito. Faça upgrade para o PRO.`);
      return;
    }

    setIsUploading(true);
    setError(null);
    setProjectedData([]);
    setSecondData(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Falha ao enviar e processar o arquivo.";
        try {
          const parsed = JSON.parse(errorText);
          errorMessage = parsed.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setData(result);
      
      if (result.quotaUsed !== undefined) {
        setQuotaUsed(result.quotaUsed);
      }

    } catch (err: any) {
      setError(err.message || "Failed to upload and process file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSecondFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 10 * 1024 * 1024) {
        setError("O tamanho do segundo arquivo excede o limite máximo permitido de 10MB.");
        return;
      }

      setIsUploadingSecond(true);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const idToken = user ? await user.getIdToken() : "";
        const response = await fetch("/api/upload", { 
          method: "POST", 
          headers: idToken ? { "Authorization": `Bearer ${idToken}` } : {},
          body: formData 
        });
        if (!response.ok) throw new Error(await response.text());
        const result = await response.json();
        setSecondData(result);
      } catch (err: any) {
        console.error("Erro no upload do segundo arquivo:", err);
      } finally {
        setIsUploadingSecond(false);
      }
    }
  };

  const handleUpdateSpreadsheetData = (newHeaders: string[], newData: Record<string, string | number | boolean>[]) => {
    if (!data) return;
    setData({
      ...data,
      headers: newHeaders,
      sampleData: newData,
      totalRows: newData.length
    });
  };

  // Find likely categorical and numerical columns for a default chart or respect selection
  const chartXKey = useMemo(() => {
    if (!data || data.headers.length === 0) return "";
    if (selectedXKey && data.headers.includes(selectedXKey)) return selectedXKey;
    return data.headers.find((h) => typeof data.sampleData[0]?.[h] === "string") || data.headers[0];
  }, [data, selectedXKey]);

  const chartYKey = useMemo(() => {
    if (!data || data.headers.length === 0) return "";
    if (selectedYKey && data.headers.includes(selectedYKey)) return selectedYKey;
    return data.headers.find((h) => typeof data.sampleData[0]?.[h] === "number") || data.headers[1] || "";
  }, [data, selectedYKey]);

  // Reset interactive comparator and chat filtering states when a new spreadsheet is loaded
  useEffect(() => {
    setChatFilteredData(null);
    setChatFilterExplanation(null);
    setSelectedXKey("");
    setSelectedYKey("");
    setProjectedData([]);
  }, [data?.insight]);

  const handleTrendAnalysis = async () => {
    if (!data || !chartXKey || !chartYKey) return;
    
    setIsAnalyzingTrend(true);
    try {
      const response = await fetch("/api/analyze-trend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chartData: data.sampleData.slice(0, 15),
          xKey: chartXKey,
          yKey: chartYKey
        })
      });

      if (!response.ok) throw new Error(await response.text());
      const result = await response.json();
      setProjectedData(result.projectedData);
    } catch (err: any) {
      console.error("Erro na análise de tendência:", err);
    } finally {
      setIsAnalyzingTrend(false);
    }
  };

  // Executa busca comparativa na web (Recurso Premium)
  const handleCompareWeb = async () => {
    if (!user) {
      setError("Por favor, faça login para usar o comparador de preços em tempo real.");
      return;
    }

    const nameToSearch = customProductName || selectedProduct;
    if (!nameToSearch) {
      setCompareWebError("Por favor, digite ou selecione um produto para comparar.");
      return;
    }

    setIsComparingWeb(true);
    setCompareWebResult(null);
    setCompareWebError(null);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Usuário não autenticado no Firebase.");
      }

      const res = await fetch("/api/premium/web-search-compare", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productName: nameToSearch,
          productPrice: productPriceValue,
          additionalContext: additionalCtxValue
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Erro de rede ao conectar ao servidor." }));
        throw new Error(errData.error || `Erro HTTP ${res.status}`);
      }

      const result = await res.json();
      setCompareWebResult(result);
    } catch (err: any) {
      console.error("Erro no comparador web:", err);
      setCompareWebError(err.message || "Erro inesperado ao consultar preços na web.");
    } finally {
      setIsComparingWeb(false);
    }
  };

  // Simula o Upgrade de plano na base de dados (Desabilitado)
  const handleUpgradeToPro = async () => {
    alert("Em breve — integração com pagamento");
  };

  // Simula o Downgrade de plano para testar bloqueio
  const handleDowngradeToFree = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { plan: 'free' }, { merge: true });
      setUserPlan('free');
    } catch (err) {
      console.error("Erro ao simular downgrade no Firestore:", err);
      setUserPlan('free');
    }
  };

  const chartDataCombined = useMemo(() => {
    if (!data) return [];
    
    const baseMap = new Map();
    
    // Use chat-filtered data if active, otherwise use standard sampleData
    const baseDataset = chatFilteredData || data.sampleData;
    
    // Base data from first file
    baseDataset.slice(0, 15).forEach((item) => {
      baseMap.set(item[chartXKey], {
        [chartXKey]: item[chartXKey],
        originalValue: item[chartYKey]
      });
    });

    // Merge projected data
    projectedData.forEach((item) => {
      if (baseMap.has(item[chartXKey])) {
        baseMap.get(item[chartXKey]).projectedValue = item[chartYKey];
      } else {
        baseMap.set(item[chartXKey], {
          [chartXKey]: item[chartXKey],
          projectedValue: item[chartYKey]
        });
      }
    });

    // Merge second file data
    if (secondData) {
      secondData.sampleData.slice(0, 15).forEach((item) => {
        if (baseMap.has(item[chartXKey])) {
          baseMap.get(item[chartXKey]).compareValue = item[chartYKey];
        } else {
          baseMap.set(item[chartXKey], {
            [chartXKey]: item[chartXKey],
            compareValue: item[chartYKey]
          });
        }
      });
    }

    return Array.from(baseMap.values());
  }, [data, chatFilteredData, projectedData, secondData, chartXKey, chartYKey]);

  return (
    <div className="min-h-screen font-sans text-slate-50">
      {/* @ts-ignore */}
      <Joyride
        steps={tourSteps}
        run={runTour}
        onEvent={handleJoyrideCallback}
        locale={{
          back: 'Voltar',
          close: 'Fechar',
          last: 'Concluir',
          next: 'Próximo',
          skip: 'Pular Tour'
        }}
      />
      <div className="mesh-bg" />
      {/* Header */}
      <header className="glass-panel sticky top-0 z-10 rounded-none border-x-0 border-t-0 border-b border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">DataFlow AI</span>
          </div>
          <nav className="hidden md:flex gap-6 items-center">
            <a href="#features" className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">Funcionalidades</a>
            <a href="#pricing" className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">Preços</a>
            {isAuthLoading ? (
              <div className="w-20 h-8 animate-pulse bg-white/5 rounded-lg" />
            ) : user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                <div className="flex flex-col items-end">
                  <span className="text-sm text-white font-medium">{user.displayName || user.email}</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    {userPlan === 'pro' ? (
                      <span className="text-amber-400 font-semibold flex items-center gap-0.5">PRO <Sparkles className="w-3 h-3 inline" /></span>
                    ) : (
                      <span>Free ({quotaUsed}/{FREE_QUOTA_LIMIT})</span>
                    )}
                    <span className="text-slate-500">•</span>
                    {userRole === 'Master' ? (
                      <span className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">Master</span>
                    ) : (
                      <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">User</span>
                    )}
                  </span>
                </div>
                <button onClick={logOut} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white" title="Sair">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="ml-4 px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Entrar com Google
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        {!data && (
          <div className="text-center max-w-4xl mx-auto mb-16 pt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8 animate-in fade-in slide-in-from-top-4">
              <Sparkles className="w-4 h-4" />
              O Fim do Caos nas Planilhas
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-white leading-[1.1]">
              Pare de Perder Dinheiro em Planilhas Confusas.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Transforme Dados em Lucro em 30 Segundos.</span>
            </h1>
            <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Você passa horas cruzando dados e tentando criar relatórios? Faça o upload do seu Excel ou CSV e deixe nossa Inteligência Artificial criar dashboards profissionais e revelar insights ocultos automaticamente.
            </p>
            
            {/* Upload Area */}
            <div className="glass-panel p-6 sm:p-8 shadow-2xl shadow-indigo-500/10 max-w-2xl mx-auto space-y-6">
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={clsx(
                  "border-2 border-dashed rounded-xl p-8 sm:p-10 transition-all duration-300 relative group flex flex-col items-center justify-center text-center",
                  dragActive 
                    ? "border-indigo-400 bg-indigo-500/10 scale-[1.02] shadow-indigo-500/20 shadow-lg" 
                    : "border-slate-700 hover:border-indigo-500/50 bg-slate-900/40 hover:bg-indigo-500/5"
                )}
              >
                <input 
                  type="file" 
                  accept=".csv, .xlsx, .xls" 
                  onChange={handleFileChange}
                  className="hidden" 
                  id="file-upload" 
                />
                
                <label 
                  htmlFor="file-upload" 
                  className="tour-upload cursor-pointer w-full flex flex-col items-center justify-center gap-4"
                >
                  <div className={clsx(
                    "p-4 rounded-full transition-all duration-300",
                    dragActive 
                      ? "bg-indigo-500/30 scale-110 text-white" 
                      : "bg-slate-800/80 group-hover:bg-indigo-500/20 text-indigo-400 group-hover:text-indigo-300 group-hover:scale-105"
                  )}>
                    <Cloud className="w-10 h-10" />
                  </div>
                  
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-200 block text-base sm:text-lg group-hover:text-indigo-300 transition-colors">
                      Arraste sua planilha aqui ou clique para buscar
                    </span>
                    <span className="text-slate-400 text-xs sm:text-sm block">
                      Formatos aceitos: <strong className="text-slate-300">.csv, .xlsx, .xls</strong> (Máx: 10MB)
                    </span>
                  </div>
                </label>
              </div>

              {/* Selected File Feedback */}
              {file && (
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between text-indigo-200 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-indigo-500/20 p-2.5 rounded-lg text-indigo-300">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-sm font-semibold text-white truncate max-w-[220px] sm:max-w-md">{file.name}</p>
                      <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setFile(null)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                    title="Remover planilha"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-left animate-in fade-in duration-300">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Google Drive Help Guide Card */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 text-left space-y-3">
                <div className="flex items-center gap-2 text-indigo-400">
                  <HelpCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-300">Sua planilha está no Google Drive?</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-slate-400">
                  <div className="space-y-1">
                    <span className="font-bold text-indigo-400 text-sm">1</span>
                    <p className="leading-relaxed">Abra sua planilha no Google Drive.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-indigo-400 text-sm">2</span>
                    <p className="leading-relaxed">Clique em <strong className="text-slate-300 font-medium">Arquivo</strong> &gt; <strong className="text-slate-300 font-medium">Fazer download</strong>.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-indigo-400 text-sm">3</span>
                    <p className="leading-relaxed">Escolha <strong className="text-slate-300 font-medium">CSV (.csv)</strong> ou <strong className="text-slate-300 font-medium">Excel (.xlsx)</strong>.</p>
                  </div>
                  <div className="space-y-1 col-span-1">
                    <span className="font-bold text-indigo-400 text-sm">4</span>
                    <p className="leading-relaxed">Suba o arquivo baixado diretamente aqui!</p>
                  </div>
                </div>
              </div>

              {/* CTA Action Button */}
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className={clsx(
                  "w-full py-4 px-6 rounded-xl text-base sm:text-lg font-extrabold flex items-center justify-center gap-2.5 transition-all duration-300",
                  (!file || isUploading) 
                    ? "bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed" 
                    : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                )}
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-indigo-200" />
                )}
                {isUploading ? "Analisando seus dados com Inteligência Artificial..." : "Gerar Dashboard com IA"}
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Results View */}
        <AnimatePresence mode="wait">
        {data && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Dashboard Gerado</h2>
                <p className="text-slate-400 text-sm">{data.totalRows.toLocaleString()} linhas analisadas</p>
              </div>
              <div className="flex items-center gap-3">
                {!secondData && (
                  <div className="relative">
                    <input 
                      type="file" 
                      id="compare-file-upload" 
                      accept=".csv"
                      className="hidden"
                      onChange={handleSecondFileChange}
                    />
                    <label 
                      htmlFor="compare-file-upload"
                      className={clsx(
                        "flex items-center gap-2 text-sm font-medium px-4 py-2 border rounded-lg transition-colors cursor-pointer",
                        isUploadingSecond
                          ? "border-slate-500 text-slate-400 bg-slate-800/50 cursor-wait"
                          : "border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-500/50"
                      )}
                    >
                      {isUploadingSecond ? (
                        <div className="w-4 h-4 border-2 border-indigo-300/30 border-t-indigo-300 rounded-full animate-spin" />
                      ) : (
                        <GitCompare className="w-4 h-4" />
                      )}
                      Comparar Arquivo
                    </label>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    if (userPlan === 'free') {
                      setIsUpgradeModalOpen(true);
                      return;
                    }
                    window.print();
                  }}
                  className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors bg-white/5 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Exportar PDF
                </button>

                <button 
                  onClick={() => {
                    setData(null);
                    setSecondData(null);
                    setFile(null);
                  }}
                  className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors bg-white/5"
                >
                  Analisar novo arquivo
                </button>
              </div>
            </div>

            {/* AI Insight Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="tour-insight bg-gradient-to-br from-indigo-600/40 to-purple-600/40 border border-indigo-500/20 rounded-2xl p-6 md:p-8 shadow-lg text-white backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-indigo-300" />
                <h3 className="text-xl font-bold">Insight da IA</h3>
              </div>
              <p className="text-lg text-indigo-50 leading-relaxed font-medium">
                {data.insight}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="lg:col-span-2 glass-panel p-6 shadow-sm border border-white/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-400" />
                    Visão Geral ({chartYKey || "Valor"} por {chartXKey || "Categoria"})
                  </h3>
                  <button
                    onClick={handleTrendAnalysis}
                    disabled={isAnalyzingTrend || !chartYKey || projectedData.length > 0}
                    className="tour-trend flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-medium rounded-lg border border-indigo-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isAnalyzingTrend ? "Analisando..." : projectedData.length > 0 ? "Tendência Gerada" : "Prever Tendência (IA)"}
                  </button>
                </div>

                {/* Chat Active Filter Banner */}
                {chatFilteredData && (
                  <div className="mb-4 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Gráfico Inteligente Ativo:</strong> Filtrado e reorganizado pelo assistente de IA via Chat com base na sua pergunta.
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setChatFilteredData(null);
                        setSelectedXKey("");
                        setSelectedYKey("");
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded transition-colors cursor-pointer self-end sm:self-auto"
                    >
                      Resetar Filtro
                    </button>
                  </div>
                )}

                {/* Comparador de Colunas Estilo Excel (Interface por Cliques) */}
                <div className="mb-6 p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <GitCompare className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Comparador de Colunas Estilo Excel (Interface por Cliques)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        Eixo X / Base de Comparação
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-2 bg-slate-950/40 rounded-lg scrollbar-thin">
                        {data.headers.map((h) => {
                          const isSelected = chartXKey === h;
                          return (
                            <button
                              key={`x-select-${h}`}
                              onClick={() => setSelectedXKey(h)}
                              className={clsx(
                                "px-2.5 py-1 text-xs font-medium rounded transition-all cursor-pointer border",
                                isSelected 
                                  ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                                  : "bg-slate-800/40 text-slate-300 border-white/5 hover:bg-slate-700/40 hover:text-white"
                              )}
                            >
                              {h}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        Eixo Y / Valor para Análise
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto p-2 bg-slate-950/40 rounded-lg scrollbar-thin">
                        {data.headers.map((h) => {
                          const isSelected = chartYKey === h;
                          return (
                            <button
                              key={`y-select-${h}`}
                              onClick={() => setSelectedYKey(h)}
                              className={clsx(
                                "px-2.5 py-1 text-xs font-medium rounded transition-all cursor-pointer border",
                                isSelected 
                                  ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                                  : "bg-slate-800/40 text-slate-300 border-white/5 hover:bg-slate-700/40 hover:text-white"
                              )}
                            >
                              {h}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  {chartYKey ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataCombined} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey={chartXKey} 
                          tick={{ fill: '#94a3b8', fontSize: 12 }} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          tick={{ fill: '#94a3b8', fontSize: 12 }} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="originalValue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Valor Atual" />
                        {projectedData.length > 0 && (
                          <Bar dataKey="projectedValue" fill="#a855f7" radius={[4, 4, 0, 0]} name="Projeção IA" />
                        )}
                        {secondData && (
                          <Bar dataKey="compareValue" fill="#10b981" radius={[4, 4, 0, 0]} name="Comparação (Arq. 2)" />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-500">
                      Não foi possível encontrar colunas numéricas para o gráfico.
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Data Table Preview */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className={clsx(
                  "glass-panel p-6 shadow-sm border border-white/10 flex flex-col transition-all duration-300",
                  isSpreadsheetView ? "lg:col-span-3" : ""
                )}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-400" />
                    {isSpreadsheetView ? "Planilha de Dados Interativa" : "Amostra dos Dados"}
                  </h3>
                  
                  {/* Toggle View Controller */}
                  <div className="flex bg-slate-900/80 p-0.5 rounded-lg border border-white/10 text-xs">
                    <button
                      onClick={() => setIsSpreadsheetView(false)}
                      className={clsx(
                        "px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer",
                        !isSpreadsheetView 
                          ? "bg-indigo-600 text-white shadow" 
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      Amostra Simples
                    </button>
                    <button
                      onClick={() => setIsSpreadsheetView(true)}
                      className={clsx(
                        "px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                        isSpreadsheetView 
                          ? "bg-indigo-600 text-white shadow" 
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Planilha Pro
                    </button>
                  </div>
                </div>

                {isSpreadsheetView ? (
                  <SpreadsheetGrid 
                    headers={data.headers} 
                    sampleData={data.sampleData} 
                    onUpdateData={handleUpdateSpreadsheetData} 
                  />
                ) : (
                  <>
                    <div className="flex-1 overflow-auto rounded-lg border border-white/10 bg-black/20">
                      <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <thead className="uppercase tracking-wider border-b border-white/10 bg-white/5 text-slate-400 text-xs font-semibold">
                          <tr>
                            {data.headers.slice(0, 4).map(h => (
                              <th key={h} className="px-4 py-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {data.sampleData.slice(0, 10).map((row, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                              {data.headers.slice(0, 4).map(h => (
                                <td key={h} className="px-4 py-2 text-slate-300 max-w-[120px] truncate">
                                  {String(row[h])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {data.headers.length > 4 && (
                      <p className="mt-2 text-xs text-slate-500 italic text-left">
                        + {data.headers.length - 4} colunas disponíveis na Planilha Pro
                      </p>
                    )}
                    <button 
                      onClick={() => setIsSpreadsheetView(true)}
                      className="mt-4 w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-indigo-400 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 transition-colors border border-indigo-500/20"
                    >
                      Abrir na Planilha Pro Completa <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </motion.div>
            </div>

            {/* Comparador de Preços na Internet (Tempo Real) - Recurso Premium */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="glass-panel p-6 sm:p-8 border border-white/10 mt-6 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 bg-indigo-500/20 text-indigo-400 text-xs font-bold px-3 py-1 rounded-bl-lg border-l border-b border-white/10 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                RECURSO PREMIUM
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-400" />
                    Comparador de Preços na Internet (Tempo Real)
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Selecione um produto da planilha ou digite para cruzar seus preços com a concorrência ativa na web usando IA de Busca do Google.
                  </p>
                </div>
                
                {/* Visualizador de status do recurso */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-slate-300">
                  <span className={`w-2 h-2 rounded-full ${userPlan === 'pro' || userRole === 'Master' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  Status do Recurso: <strong className="text-indigo-300 uppercase">{userPlan === 'pro' || userRole === 'Master' ? 'Desbloqueado' : 'Bloqueado (Plano Free)'}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form fields column */}
                <div className="lg:col-span-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Auto-preencher da Planilha:
                    </label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedProduct(val);
                        if (val) {
                          setCustomProductName(val);
                          // Encontrar a linha correspondente para auto-preencher preço
                          const matchedRow = data.sampleData.find(row => String(row[chartXKey]) === val);
                          if (matchedRow && chartYKey) {
                            setProductPriceValue(String(matchedRow[chartYKey] || ''));
                          }
                        }
                      }}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Selecione um produto da planilha --</option>
                      {data.sampleData.map((row, i) => {
                        const labelValue = String(row[chartXKey] || '');
                        if (!labelValue) return null;
                        return (
                          <option key={i} value={labelValue}>
                            {labelValue.length > 50 ? labelValue.substring(0, 50) + "..." : labelValue}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Nome do Produto:
                      </label>
                      <input
                        type="text"
                        value={customProductName}
                        onChange={(e) => setCustomProductName(e.target.value)}
                        placeholder="Ex: iPhone 15 Pro Max 256GB"
                        className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Seu Preço (R$):
                      </label>
                      <input
                        type="text"
                        value={productPriceValue}
                        onChange={(e) => setProductPriceValue(e.target.value)}
                        placeholder="Ex: 6499.00"
                        className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Contexto Adicional (Opcional):
                    </label>
                    <textarea
                      value={additionalCtxValue}
                      onChange={(e) => setAdditionalCtxValue(e.target.value)}
                      placeholder="Ex: Marca Apple, Distribuidor Autorizado, Garantia de 1 ano"
                      rows={2}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {userPlan !== 'pro' && userRole !== 'Master' ? (
                    <button
                      onClick={() => setIsUpgradeModalOpen(true)}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                    >
                      <Lock className="w-4 h-4" />
                      Análise de Preços Web (Premium)
                    </button>
                  ) : (
                    <button
                      onClick={handleCompareWeb}
                      disabled={isComparingWeb || (!customProductName && !selectedProduct)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                      {isComparingWeb ? (
                        <>
                          <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                          Buscando concorrentes na internet...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          Buscar na Web e Comparar (Tempo Real)
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Output results column */}
                <div className="lg:col-span-7 flex flex-col justify-between border-l border-white/5 lg:pl-8 min-h-[250px]">
                  {isComparingWeb && (
                    <div className="flex flex-col items-center justify-center flex-1 py-12 text-center text-slate-400">
                      <div className="relative mb-4">
                        <Globe className="w-12 h-12 text-indigo-400 animate-spin" />
                        <Sparkles className="w-6 h-6 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
                      </div>
                      <h4 className="font-semibold text-white mb-2">Consultando o Google Search...</h4>
                      <p className="text-xs max-w-sm text-slate-400 leading-relaxed">
                        O motor inteligente está buscando os preços de mercado mais recentes em tempo real, calculando médias do Google Shopping e estruturando estratégias.
                      </p>
                    </div>
                  )}

                  {!isComparingWeb && !compareWebResult && !compareWebError && (
                    <div className="flex flex-col items-center justify-center flex-1 py-12 text-center text-slate-500">
                      <Globe className="w-12 h-12 text-slate-700 mb-3" />
                      <h4 className="font-medium text-slate-400 mb-1">Aguardando Execução</h4>
                      <p className="text-xs max-w-sm leading-relaxed">
                        Selecione um produto e execute a pesquisa em tempo real para gerar insights de competitividade e pricing bruto baseados em dados reais da internet.
                      </p>
                    </div>
                  )}

                  {compareWebError && (
                    <div className="flex flex-col items-center justify-center flex-1 py-12 text-center text-red-400 bg-red-500/5 rounded-xl border border-red-500/10 px-4">
                      <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                      <h4 className="font-semibold mb-1 text-red-200">Ops! Ocorreu um erro</h4>
                      <p className="text-xs max-w-sm leading-relaxed">{compareWebError}</p>
                    </div>
                  )}

                  {compareWebResult && !isComparingWeb && (
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Insight Gerado com Sucesso
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          Busca realizada em: {new Date(compareWebResult.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {/* Markdown content rendering area */}
                      <div className="text-slate-300 text-sm leading-relaxed max-h-[300px] overflow-y-auto pr-2 space-y-3 whitespace-pre-wrap">
                        {compareWebResult.insight}
                      </div>

                      {/* Sources area */}
                      {compareWebResult.sources && compareWebResult.sources.length > 0 && (
                        <div className="border-t border-white/5 pt-4">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                            Fontes Verificadas:
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {compareWebResult.sources.slice(0, 4).map((src: any, idx: number) => (
                              <a
                                key={idx}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer referrer"
                                className="text-xs bg-slate-900/80 hover:bg-slate-800 border border-white/10 rounded-full px-3 py-1 text-indigo-300 flex items-center gap-1 transition-colors"
                              >
                                {src.title.length > 25 ? src.title.substring(0, 25) + '...' : src.title}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Feature/Architecture Information Section */}
        {!data && (
          <div className="mt-24 mb-32" id="features">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Por que você precisa do DataFlow AI?</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">Não perca mais horas configurando gráficos no Excel ou tentando aprender Power BI. Nós democratizamos a ciência de dados.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-panel p-8 border border-white/10 hover:border-indigo-500/30 transition-colors">
                <div className="bg-indigo-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Zero Curva de Aprendizado</h3>
                <p className="text-slate-400 leading-relaxed">
                  Não sabe programar? Sem problemas. O sistema entende seus dados automaticamente, categoriza as colunas e desenha os gráficos perfeitos sem você clicar em nada.
                </p>
              </div>
              
              <div className="glass-panel p-8 border border-white/10 hover:border-purple-500/30 transition-colors">
                <div className="bg-purple-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <Sparkles className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Insights de IA Preditiva</h3>
                <p className="text-slate-400 leading-relaxed">
                  Enquanto ferramentas normais só mostram o passado, nossa IA lê seu histórico, identifica padrões de vendas e cria projeções futuras para te ajudar a faturar mais.
                </p>
              </div>
              
              <div className="glass-panel p-8 border border-white/10 hover:border-emerald-500/30 transition-colors">
                <div className="bg-emerald-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Segurança Total dos Dados</h3>
                <p className="text-slate-400 leading-relaxed">
                  "Meus dados estão seguros?" Sim. Utilizamos arquitetura isolada Enterprise-grade. Seus arquivos não treinam a IA pública e permanecem 100% sob seu controle.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Section */}
        {!data && (
          <div className="mt-24" id="pricing">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Planos Simples e Transparentes</h2>
              <p className="text-slate-400">Escolha o plano ideal para suas necessidades de análise de dados.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <div className="glass-panel p-8 border border-white/10 flex flex-col">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Básico</h3>
                  <div className="flex items-baseline gap-1 text-slate-300">
                    <span className="text-4xl font-extrabold text-white">Grátis</span>
                  </div>
                  <p className="text-slate-400 mt-2 text-sm">Perfeito para testar a ferramenta.</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><ShieldCheck className="w-3 h-3" /></div>
                    Até {FREE_QUOTA_LIMIT} relatórios por mês
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><ShieldCheck className="w-3 h-3" /></div>
                    Gráficos básicos
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400"><ShieldCheck className="w-3 h-3" /></div>
                    Análise com IA básica
                  </li>
                </ul>
                <button 
                  disabled
                  className="w-full py-3 rounded-lg font-semibold bg-white/5 text-slate-400 border border-white/10 cursor-not-allowed"
                >
                  Plano Atual
                </button>
              </div>

              {/* Pro Plan */}
              <div className="glass-panel p-8 border border-indigo-500/50 relative flex flex-col bg-indigo-900/10 shadow-2xl shadow-indigo-500/10">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  MAIS POPULAR
                </div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-indigo-400 mb-2 flex items-center gap-2">
                    Pro <Sparkles className="w-5 h-5" />
                  </h3>
                  <div className="flex items-baseline gap-1 text-slate-300">
                    <span className="text-4xl font-extrabold text-white">R$ 49</span>
                    <span>/mês</span>
                  </div>
                  <p className="text-slate-400 mt-2 text-sm">Para analistas e empresas que precisam de mais poder.</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400"><ShieldCheck className="w-3 h-3" /></div>
                    Relatórios Ilimitados
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400"><ShieldCheck className="w-3 h-3" /></div>
                    Exportação em PDF
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400"><ShieldCheck className="w-3 h-3" /></div>
                    Comparação de múltiplos arquivos
                  </li>
                  <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400"><ShieldCheck className="w-3 h-3" /></div>
                    Análise Preditiva de IA Avançada
                  </li>
                </ul>
                <button 
                  onClick={() => alert("Integração com Stripe em desenvolvimento!")}
                  className="w-full py-3 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Fazer Upgrade Agora
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simulador de Segurança (RBAC) */}
        {user && (
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="glass-panel p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 bg-indigo-500/20 text-indigo-400 text-xs font-bold px-3 py-1 rounded-bl-lg border-l border-b border-white/10 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                SISTEMA RBAC ATIVO
              </div>
              
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-indigo-400" />
                    Simulador de Segurança & Controle de Acesso (RBAC)
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Esta seção demonstra as regras de controle de acesso configuradas no back-end (Express/Node.js) e banco de dados (Firestore).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Sua Role:</span>
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1",
                      userRole === 'Master' 
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    )}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {userRole}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Seu Plano:</span>
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1",
                      userPlan === 'pro' 
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    )}>
                      {userPlan === 'pro' ? <Sparkles className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {userPlan === 'pro' ? 'Premium (Pro)' : 'Gratuito (Free)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/40 p-5 rounded-xl border border-white/5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Como funciona a regra:</span>
                    <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
                      <li>A role de administrador (<strong className="text-indigo-300">Master</strong>) é lida diretamente do banco de dados (Firestore) para máxima segurança.</li>
                      <li>Todos os outros usuários cadastrados entram com a role padrão <strong className="text-slate-400">User</strong>.</li>
                      <li>O recurso de <strong className="text-indigo-300">Busca e Pricing em Tempo Real</strong> requer o plano <strong className="text-indigo-300">Premium (Pro)</strong> ou role <strong className="text-indigo-300">Master</strong>.</li>
                      <li>A rota do servidor <code className="bg-slate-900 px-1.5 py-0.5 rounded text-indigo-400 font-mono text-[11px]">/api/admin/metrics</code> requer a role <strong className="text-indigo-300">Master</strong>.</li>
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Controle do Simulador (Planos):</span>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpgradeToPro}
                        disabled={userPlan === 'pro'}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 rounded text-xs font-medium text-emerald-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        🚀 Ativar PRO (Upgrade)
                      </button>
                      <button
                        onClick={handleDowngradeToFree}
                        disabled={userPlan === 'free'}
                        className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/30 rounded text-xs font-medium text-amber-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        🔒 Ativar FREE (Downgrade)
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={fetchAdminMetrics}
                    disabled={isAdminLoading}
                    className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isAdminLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Database className="w-4 h-4" />
                    )}
                    Testar Requisição à Rota Protegida
                  </button>
                </div>

                <div className="flex flex-col justify-between h-full min-h-[160px] bg-black/40 border border-white/5 rounded-lg p-4 font-mono text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 text-slate-400">
                      <span>STATUS DA RESPOSTA HTTP</span>
                      {adminMetrics && <span className="text-emerald-400 font-bold">200 OK</span>}
                      {adminError && <span className="text-red-400 font-bold">403 PROIBIDO</span>}
                      {!adminMetrics && !adminError && <span>PRONTO</span>}
                    </div>

                    {adminMetrics && (
                      <pre className="text-slate-200 overflow-x-auto whitespace-pre-wrap max-h-40 leading-relaxed">
                        {JSON.stringify(adminMetrics, null, 2)}
                      </pre>
                    )}

                    {adminError && (
                      <div className="text-red-400 space-y-1">
                        <p className="font-semibold">Erro: Acesso Negado pelo Servidor</p>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{adminError}</p>
                      </div>
                    )}

                    {!adminMetrics && !adminError && (
                      <p className="text-slate-500 italic text-center py-8">
                        Clique no botão ao lado para testar a rota protegida e verificar se sua role tem acesso.
                      </p>
                    )}
                  </div>
                  
                  {userRole !== 'Master' && (
                    <div className="mt-4 pt-2 border-t border-white/5 text-[11px] text-slate-400 flex items-center gap-1.5 leading-normal">
                      <AlertCircle className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>Para testar a liberação Master, altere o campo <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-400 font-mono text-[10px]">role</code> para "Master" no seu documento de usuário no Firestore.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Chat Interface */}
      {data && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          {/* Chat Window */}
          {isChatOpen && (
            <div className="glass-panel w-80 sm:w-96 h-[500px] mb-4 flex flex-col overflow-hidden shadow-2xl border border-white/20 animate-in slide-in-from-bottom-10 fade-in duration-300">
              <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-400" />
                  <span className="font-semibold text-white">Assistente de Dados</span>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-md transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
                {chatMessages.length === 0 && (
                  <div className="text-center text-sm text-slate-400 mt-10">
                    Faça perguntas sobre os dados carregados! O assistente utilizará a amostra dos seus dados para responder.
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={clsx(
                    "flex flex-col max-w-[85%] rounded-xl p-3 text-sm",
                    msg.role === 'user' 
                      ? "bg-indigo-600/80 text-white self-end ml-auto rounded-tr-sm" 
                      : "bg-white/10 text-slate-200 self-start border border-white/5 rounded-tl-sm"
                  )}>
                    <div className="flex items-center gap-1.5 mb-1 opacity-70 text-xs">
                      {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      <span>{msg.role === 'user' ? 'Você' : 'Assistente'}</span>
                    </div>
                    {msg.content}
                  </div>
                ))}
                {isChatLoading && (
                  <div className="bg-white/10 text-slate-200 self-start border border-white/5 rounded-xl rounded-tl-sm p-3 max-w-[85%] text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-white/5 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pergunte algo sobre os dados..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/50"
                  disabled={isChatLoading}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Floating Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={clsx(
              "tour-chat w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
              isChatOpen 
                ? "bg-white/10 text-white hover:bg-white/20 border border-white/20" 
                : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/30 hover:scale-105"
            )}
          >
            {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          </button>
        </div>
      )}

      {/* Modal de Upgrade Premium (Paywall) */}
      <AnimatePresence>
        {isUpgradeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-indigo-500/30 max-w-md w-full rounded-2xl overflow-hidden shadow-2xl relative"
            >
              {/* Decorative glowing gradient */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-600" />
              
              <div className="p-6 sm:p-8">
                <button
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center mt-2">
                  <div className="bg-amber-500/10 w-16 h-16 rounded-full flex items-center justify-center border border-amber-500/30 mb-4 animate-bounce">
                    <Lock className="w-8 h-8 text-amber-400" />
                  </div>

                  <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 justify-center">
                    🔥 Funcionalidade Exclusiva Premium
                  </h3>
                  
                  <p className="text-slate-300 text-sm mt-3 leading-relaxed">
                    Compare seus dados em tempo real com toda a internet. Descubra preços de concorrentes, médias do Google Shopping e receba estratégias de precificação acionáveis geradas por inteligência de busca em tempo real.
                  </p>

                  <div className="w-full bg-indigo-950/30 border border-indigo-500/10 rounded-xl p-4 mt-6 text-left space-y-3">
                    <div className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Busca automatizada em tempo real com Google Search</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Cálculo automático de diferença de preço vs. mercado</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Mapeamento de links e varejistas concorrentes</span>
                    </div>
                  </div>

                  <div className="w-full mt-6 space-y-3">
                    {/* Interactive Upgrade for Testing */}
                    <button
                      onClick={handleUpgradeToPro}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Fazer Upgrade para PRO
                    </button>
                    <p className="text-xs text-amber-400 font-semibold text-center mt-2">
                      ⏱️ Em breve — integração com pagamento
                    </p>

                    <button
                      onClick={() => setIsUpgradeModalOpen(false)}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      Talvez mais tarde
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-500 mt-4 leading-normal">
                    * A contratação do plano Premium em breve estará integrada com a API do Stripe para pagamentos seguros em produção.
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

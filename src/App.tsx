import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import NavigationGuard from './components/NavigationGuard';
import ScrollToTop from './components/ScrollToTop';
import AberturaCaixa from './components/AberturaCaixa';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Vendas from './pages/Vendas';
import Retiradas from './pages/Retiradas';
import Fechamento from './pages/Fechamento';
import Historico from './pages/Historico';
import RelatorioMensal from './pages/RelatorioMensal';
import { checkAndResetIfNewDay, hasCaixaAberto } from './lib/storage';
import { Lock, KeyRound } from 'lucide-react';

function UpdatePasswordModal() {
  const { updatePassword, setRecoveryMode } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        setError(error);
      } else {
        setSuccess(true);
        setTimeout(() => setRecoveryMode(false), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-blue-900/90 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-6">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="text-blue-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Criar nova senha</h2>
          <p className="text-gray-600 text-sm">
            Digite sua nova senha de acesso ao Livro Caixa
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-700 font-bold mb-2">Senha atualizada com sucesso!</p>
            <p className="text-sm text-gray-600">Redirecionando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Confirmar Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2 mt-6 ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'
                }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Atualizar Senha'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading: authLoading, recoveryMode } = useAuth();
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [loading, setLoading] = useState(true);

  // Função central para verificar estado no servidor
  // Garante que o Client nunca confie apenas no cache local
  const checkEstadoCaixa = async () => {
    if (!user) return;
    try {
      // hasCaixaAberto vai direto ao Supabase (verificado em storage.ts)
      const isOpen = await hasCaixaAberto();
      setCaixaAberto(isOpen);
    } catch (error) {
      console.error('Erro ao sincronizar estado do caixa:', error);
    }
  };

  useEffect(() => {
    // Sincronização inicial e por foco
    window.addEventListener('focus', checkEstadoCaixa);

    // Polling de segurança: verifica estado a cada 30 segundos
    // O evento de foco garante atualização imediata quando o usuário volta ao app
    const intervalId = setInterval(checkEstadoCaixa, 30000);

    return () => {
      window.removeEventListener('focus', checkEstadoCaixa);
      clearInterval(intervalId);
    };
  }, [user]);

  useEffect(() => {
    async function init() {
      if (authLoading) return;
      if (!user) {
        setCaixaAberto(false);
        setLoading(false);
        return;
      }

      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        await checkAndResetIfNewDay();

        // Verificação inicial rigorosa
        await checkEstadoCaixa();

      } catch (error) {
        console.error('Erro ao inicializar:', error);
        setCaixaAberto(false);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [user, authLoading]);

  const handleAberturaCompleta = async () => {
    // Não apenas setar true, mas revalidar com o servidor para garantir consistência
    await checkEstadoCaixa();
  };

  const handleFechamentoConcluido = async () => {
    // Revalidar para garantir que o fechamento foi processado
    await checkEstadoCaixa();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="*" element={<Auth />} />
        </Routes>
      </BrowserRouter>
    );
  }

  if (recoveryMode) {
    return <UpdatePasswordModal />;
  }

  if (!caixaAberto) {
    return (
      <NavigationGuard>
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen bg-gray-100">
            <Routes>
              <Route path="/" element={<AberturaCaixa onAberturaCompleta={handleAberturaCompleta} />} />
              <Route path="/historico" element={<Historico onReabertura={handleAberturaCompleta} />} />
              <Route path="/relatorio-mensal" element={<RelatorioMensal />} />
              <Route path="*" element={<AberturaCaixa onAberturaCompleta={handleAberturaCompleta} />} />
            </Routes>
          </div>
        </BrowserRouter>
      </NavigationGuard>
    );
  }

  return (
    <NavigationGuard>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-gray-100 flex">
          <Navigation />
          <main className="flex-1 lg:ml-64">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vendas" element={<Vendas />} />
              <Route path="/retiradas" element={<Retiradas />} />
              <Route path="/fechamento" element={<Fechamento onFechamentoConcluido={handleFechamentoConcluido} />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/relatorio-mensal" element={<RelatorioMensal />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </NavigationGuard>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

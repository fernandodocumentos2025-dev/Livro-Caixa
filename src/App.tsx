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

function AppContent() {
  const { user, loading: authLoading } = useAuth();
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
    // Listener para re-sincronizar quando a janela ganha foco (Multi-tab/Multi-device)
    window.addEventListener('focus', checkEstadoCaixa);
    return () => window.removeEventListener('focus', checkEstadoCaixa);
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

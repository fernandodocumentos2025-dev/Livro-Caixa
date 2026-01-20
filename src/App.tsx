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
import { checkAndResetIfNewDay } from './lib/storage';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (authLoading) return;
      if (!user) {
        setCaixaAberto(false); // Reset state when user logs out
        setLoading(false);
        return;
      }

      try {
        // Aguardar um pouco para garantir que o Supabase Auth está pronto
        await new Promise(resolve => setTimeout(resolve, 500));

        await checkAndResetIfNewDay();
        // hasCaixaAberto returns true if ANY box is open.
        // We need to fetch the specific box to check strict compliance with "Today"
        // import { getAberturaHoje } from './lib/storage'; // ensure this is imported or use existing hasCaixaAberto logic if modified

        // Wait, hasCaixaAberto calls getAberturaHoje inside. 
        // Let's rely on hasCaixaAberto BUT strictly verify the date here to decide redirect.
        // Actually, cleaner approach:

        const openBox = await import('./lib/storage').then(m => m.getAberturaHoje());
        // REMOVED STRICT DATE CHECK ("&& openBox.data === today")
        // Logic restored: If there is ANY open box (even from past dates), go to Dashboard.
        // This failsafe prevents "zombie" boxes that are open but inaccessible.
        if (openBox) {
          setCaixaAberto(true);
        } else {
          setCaixaAberto(false);
        }

      } catch (error) {
        console.error('Erro ao inicializar:', error);
        setCaixaAberto(false);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [user, authLoading]);

  const handleAberturaCompleta = () => {
    setCaixaAberto(true);
  };

  const handleFechamentoConcluido = () => {
    setCaixaAberto(false);
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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getVendasHoje, getRetiradasHoje, checkAndResetIfNewDay, getAberturaHoje } from '../lib/storage'; // Added getAberturaHoje
import { useAuth } from '../contexts/AuthContext';
import { Venda, Abertura } from '../types'; // Added Abertura
import MonetaryValue from '../components/MonetaryValue';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Plus, Calendar } from 'lucide-react'; // Added Calendar

export default function Dashboard() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [totalVendas, setTotalVendas] = useState(0);
  const [totalRetiradas, setTotalRetiradas] = useState(0);
  const [saldo, setSaldo] = useState(0);
  const [abertura, setAbertura] = useState<Abertura | null>(null); // Added state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const { user } = useAuth(); // Dependência do AuthContext

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(false);
      await checkAndResetIfNewDay();
      const vendasData = await getVendasHoje();
      const retiradasData = await getRetiradasHoje();
      const aberturaData = await getAberturaHoje(); // Fetch abertura

      const totalV = vendasData.reduce((sum, v) => sum + v.total, 0);
      const totalR = retiradasData.reduce((sum, r) => sum + r.valor, 0);

      setVendas(vendasData);
      setTotalVendas(totalV);
      setTotalRetiradas(totalR);
      setSaldo(totalV - totalR);
      setAbertura(aberturaData); // Set state
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError(true);
      // Não resetar para zero aqui; manter estado de erro/loading
    } finally {
      setLoading(false);
    }
  };

  const ultimasVendas = vendas.slice(-5).reverse();

  if (loading || error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Atualizando valores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Resumo do movimento</p>
        </div>

        {abertura && (
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2">
            <Calendar className="text-blue-600" size={20} />
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Caixa</p>
              <p className="text-lg font-bold text-gray-900 leading-none">{abertura.data}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase">Total de Vendas</h3>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <MonetaryValue value={totalVendas} size="xl" className="text-green-600" />
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase">Total de Retiradas</h3>
            <TrendingDown className="text-red-500" size={20} />
          </div>
          <MonetaryValue value={totalRetiradas} size="xl" className="text-red-600" />
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase">Saldo Atual</h3>
            <DollarSign className="text-blue-500" size={20} />
          </div>
          <MonetaryValue value={saldo} size="xl" className="text-blue-600" />
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase">Transações</h3>
            <ShoppingBag className="text-yellow-500" size={20} />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{vendas.length}</p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">vendas registradas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Últimas Vendas</h2>
            <Link
              to="/vendas"
              className="text-blue-600 hover:text-blue-700 font-semibold text-xs sm:text-sm flex items-center gap-1"
            >
              Ver todas
            </Link>
          </div>

          {ultimasVendas.length > 0 ? (
            <div className="space-y-3">
              {ultimasVendas.map((venda) => (
                <div key={venda.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{venda.produto}</p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {venda.quantidade}x - {venda.formaPagamento} - {venda.hora}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <MonetaryValue value={venda.total} size="md" className="text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm sm:text-base text-gray-500 mb-4">Nenhuma venda registrada hoje</p>
            </div>
          )}
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Ação Rápida</h2>
          <div className="space-y-3 sm:space-y-4">
            <Link
              to="/vendas"
              className="flex items-center justify-center gap-2 w-full px-6 py-3 sm:py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 active:bg-green-800 transition-colors text-sm sm:text-base touch-manipulation"
            >
              <Plus size={20} />
              Nova Venda
            </Link>
            <Link
              to="/retiradas"
              className="flex items-center justify-center gap-2 w-full px-6 py-3 sm:py-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 active:bg-red-800 transition-colors text-sm sm:text-base touch-manipulation"
            >
              <Plus size={20} />
              Nova Retirada
            </Link>
            <Link
              to="/fechamento"
              className="flex items-center justify-center gap-2 w-full px-6 py-3 sm:py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm sm:text-base touch-manipulation"
            >
              Fechar Caixa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFechamentos, deleteFechamento } from '../lib/storage';
import { Fechamento } from '../types';
import FechamentoCard from '../components/FechamentoCard';
import { History as HistoryIcon, ArrowLeft, Calendar } from 'lucide-react';

export default function Historico() {
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState<string>('todos');
  const navigate = useNavigate();

  useEffect(() => {
    loadFechamentos();
  }, []);

  const loadFechamentos = async () => {
    setFechamentos(await getFechamentos());
  };

  const handleDelete = async (id: string) => {
    await deleteFechamento(id);
    await loadFechamentos();
  };

  const handleVoltar = () => {
    navigate('/');
  };

  const mesesDisponiveis = useMemo(() => {
    const meses = new Set<string>();
    fechamentos.forEach(fechamento => {
      const [, mes, ano] = fechamento.data.split('/');
      if (mes && ano) {
        meses.add(`${mes}/${ano}`);
      }
    });
    return Array.from(meses).sort((a, b) => {
      const [mesA, anoA] = a.split('/').map(Number);
      const [mesB, anoB] = b.split('/').map(Number);
      if (anoA !== anoB) return anoB - anoA;
      return mesB - mesA;
    });
  }, [fechamentos]);

  const fechamentosFiltrados = useMemo(() => {
    if (mesSelecionado === 'todos') {
      return fechamentos;
    }
    return fechamentos.filter(fechamento => {
      const [, mes, ano] = fechamento.data.split('/');
      return `${mes}/${ano}` === mesSelecionado;
    });
  }, [fechamentos, mesSelecionado]);

  const getNomeMes = (mesAno: string) => {
    const [mes, ano] = mesAno.split('/');
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[parseInt(mes) - 1]}/${ano}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <button
          onClick={handleVoltar}
          className="flex items-center gap-2 mb-4 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-semibold"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Histórico de Fechamentos</h1>
        <p className="text-sm sm:text-base text-gray-600">Visualize os fechamentos anteriores</p>
      </div>

      {fechamentos.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar size={20} className="text-blue-600" />
            <label className="text-sm font-bold text-gray-700">Filtrar por Período</label>
          </div>
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos os Períodos ({fechamentos.length})</option>
            {mesesDisponiveis.map((mesAno) => {
              const count = fechamentos.filter(f => {
                const [, mes, ano] = f.data.split('/');
                return `${mes}/${ano}` === mesAno;
              }).length;
              return (
                <option key={mesAno} value={mesAno}>
                  {getNomeMes(mesAno)} ({count})
                </option>
              );
            })}
          </select>
          {mesSelecionado !== 'todos' && (
            <p className="mt-3 text-sm text-gray-600">
              Exibindo {fechamentosFiltrados.length} fechamento{fechamentosFiltrados.length !== 1 ? 's' : ''} de {getNomeMes(mesSelecionado)}
            </p>
          )}
        </div>
      )}

      {fechamentosFiltrados.length > 0 ? (
        <div className="space-y-6">
          {fechamentosFiltrados.map((fechamento) => (
            <FechamentoCard key={fechamento.id} fechamento={fechamento} onDelete={handleDelete} />
          ))}
        </div>
      ) : fechamentos.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
          <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Nenhum Fechamento neste Período</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Não há registros para o período selecionado. Selecione outro período para visualizar.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
          <HistoryIcon className="mx-auto mb-4 text-gray-400" size={48} />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Nenhum Fechamento Registrado</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Quando você fechar o caixa, os fechamentos aparecerão aqui.
          </p>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveAbertura } from '../lib/storage';
import { Abertura } from '../types';
import { getCurrentDate, getCurrentTime } from '../utils/formatters';
import { useMonetaryInput } from '../hooks/useMonetaryInput';
import { DollarSign, History, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AberturaCaixaProps {
  onAberturaCompleta: () => void;
}

export default function AberturaCaixa({ onAberturaCompleta }: AberturaCaixaProps) {
  const [erro, setErro] = useState('');
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const valorAberturaInput = useMonetaryInput(0);

  const isValorValido = () => {
    return valorAberturaInput.numericValue > 0;
  };

  const handleAbrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault();

    if (valorAberturaInput.numericValue <= 0) {
      setErro('O valor de abertura é obrigatório e deve ser maior que zero');
      return;
    }

    setErro('');

    const abertura: Abertura = {
      id: crypto.randomUUID(),
      data: getCurrentDate(),
      hora: getCurrentTime(),
      valorAbertura: valorAberturaInput.numericValue,
    };

    try {
      await saveAbertura(abertura);
      onAberturaCompleta();
    } catch (err) {
      if (err instanceof Error) {
        setErro(err.message);
      } else {
        setErro('Erro ao abrir caixa. Tente novamente.');
      }
    }
  };

  const handleAcessarHistorico = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/historico');
  };

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      await signOut();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
          title="Sair"
        >
          <LogOut size={24} />
        </button>

        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-blue-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="text-blue-600" size={40} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Abertura de Caixa</h1>
          <p className="text-sm sm:text-base text-gray-600">Informe o valor inicial para começar o dia</p>
        </div>

        <form onSubmit={handleAbrirCaixa} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Valor de Abertura (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={valorAberturaInput.displayValue}
              onChange={(e) => {
                valorAberturaInput.handleChange(e);
                if (erro) {
                  setErro('');
                }
              }}
              onFocus={valorAberturaInput.handleFocus}
              onBlur={valorAberturaInput.handleBlur}
              className={`w-full px-4 py-3 sm:py-4 text-base sm:text-lg border-2 rounded-lg focus:ring-2 focus:border-blue-500 transition-colors ${erro
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
                }`}
              placeholder="0,00"
              required
              autoFocus
            />
            {erro && (
              <p className="mt-2 text-sm text-red-600 font-semibold">{erro}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValorValido()}
            className={`w-full px-6 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-colors shadow-lg transition-transform ${isValorValido()
              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            Abrir Caixa
          </button>
        </form>

        <button
          type="button"
          onClick={handleAcessarHistorico}
          className="w-full mt-4 px-6 py-3 sm:py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-lg font-bold text-base sm:text-lg hover:bg-gray-50 transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <History size={20} />
          Acessar Histórico
        </button>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-500 text-center">
            Este valor será usado como base para o fechamento do caixa
          </p>
        </div>
      </div>
    </div>
  );
}

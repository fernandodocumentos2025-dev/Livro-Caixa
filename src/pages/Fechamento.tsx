import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVendasHoje, getRetiradasHoje, getAberturaHoje, saveFechamento } from '../lib/storage';
import { Venda, Retirada, Fechamento as FechamentoType } from '../types';
import MonetaryValue from '../components/MonetaryValue';
import { formatCurrency, getCurrentDate, getCurrentTime } from '../utils/formatters';
import { useMonetaryInput } from '../hooks/useMonetaryInput';
import { CheckCircle, TrendingUp, TrendingDown, DollarSign, X, Wallet, Coins } from 'lucide-react';

interface FechamentoProps {
  onFechamentoConcluido?: () => void;
}

export default function Fechamento({ onFechamentoConcluido }: FechamentoProps) {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [retiradas, setRetiradas] = useState<Retirada[]>([]);
  const [totalVendas, setTotalVendas] = useState(0);
  const [totalRetiradas, setTotalRetiradas] = useState(0);
  const [valorAbertura, setValorAbertura] = useState(0);
  const [saldoEsperado, setSaldoEsperado] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [abertura, setAbertura] = useState<any>(null);
  const navigate = useNavigate();

  const valorNotasInput = useMonetaryInput(0);
  const valorMoedasInput = useMonetaryInput(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const vendasData = await getVendasHoje();
    const retiradasData = await getRetiradasHoje();
    const aberturaData = await getAberturaHoje();

    const totalV = vendasData.reduce((sum, v) => sum + v.total, 0);
    const totalR = retiradasData.reduce((sum, r) => sum + r.valor, 0);
    const valorAb = aberturaData?.valorAbertura || 0;
    const saldoEsp = totalV - totalR + valorAb;

    setAbertura(aberturaData);
    setVendas(vendasData);
    setRetiradas(retiradasData);
    setTotalVendas(totalV);
    setTotalRetiradas(totalR);
    setValorAbertura(valorAb);
    setSaldoEsperado(saldoEsp);
  };

  const calcularTotaisPorFormaPagamento = () => {
    const totais = {
      PIX: 0,
      Dinheiro: 0,
      Débito: 0,
      Crédito: 0,
    };

    vendas.forEach((venda) => {
      if (totais.hasOwnProperty(venda.formaPagamento)) {
        totais[venda.formaPagamento as keyof typeof totais] += venda.total;
      }
    });

    return totais;
  };

  const totaisPorPagamento = calcularTotaisPorFormaPagamento();

  const handleAbrirModal = () => {
    setShowModal(true);
    valorNotasInput.reset();
    valorMoedasInput.reset();
  };

  const handleFecharModal = () => {
    setShowModal(false);
    valorNotasInput.reset();
    valorMoedasInput.reset();
  };

  const handleConfirmarFechamento = async () => {
    const valorNotas = valorNotasInput.numericValue;
    const valorMoedas = valorMoedasInput.numericValue;

    if (valorNotas < 0 || valorMoedas < 0) {
      alert('Por favor, informe valores válidos');
      return;
    }

    // Lógica de confirmação se moedas não informado
    if (valorMoedas === 0 && valorNotas > 0) {
      const confirmou = window.confirm('Você não informou valor em moedas.\n\nO valor informado em NOTAS representa o TOTAL do caixa (Notas + Moedas)?');
      if (!confirmou) {
        return; // Usuario cancelou para preencher moedas
      }
    }

    setIsProcessing(true);

    try {
      const totalDinheiro = valorNotas + valorMoedas;
      const totalDigital = totaisPorPagamento.PIX + totaisPorPagamento.Crédito + totaisPorPagamento.Débito;
      const valorTotalFechamento = totalDinheiro + totalDigital;
      const diferenca = valorTotalFechamento - saldoEsperado;

      const fechamentoId = abertura?.fechamentoOriginalId || crypto.randomUUID();

      const fechamento: FechamentoType = {
        id: fechamentoId,
        data: abertura?.data || getCurrentDate(),
        hora: getCurrentTime(),
        totalVendas,
        totalRetiradas,
        valorAbertura,
        valorContado: valorTotalFechamento,
        saldoEsperado,
        diferenca,
        vendas: [...vendas],
        retiradas: [...retiradas],
        status: 'fechado',
        detalheEspecie: {
          notas: valorNotas,
          moedas: valorMoedas
        }
      };

      await saveFechamento(fechamento);
      onFechamentoConcluido?.();
      navigate('/historico');
    } catch (error) {
      console.error('Erro ao fechar caixa:', error);
      setIsProcessing(false);
      alert('Erro ao salvar fechamento. Provavelmente a coluna "detalhe_especie" não existe no banco de dados.\n\nPor favor, peça ao suporte técnico para rodar o comando SQL de atualização.');
    }
  };

  const totalDinheiroAtual = valorNotasInput.numericValue + valorMoedasInput.numericValue;
  const totalGeralPrevisto = totalDinheiroAtual + totaisPorPagamento.PIX + totaisPorPagamento.Crédito + totaisPorPagamento.Débito;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Fechamento de Caixa</h1>
        <p className="text-sm sm:text-base text-gray-600">Revise o dia e feche o caixa</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase">Abertura</h3>
            <DollarSign className="text-blue-500" size={20} />
          </div>
          <MonetaryValue value={valorAbertura} size="xl" className="text-blue-600" />
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase">Vendas</h3>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <MonetaryValue value={totalVendas} size="xl" className="text-green-600" />
          <p className="text-xs sm:text-sm text-gray-600 mt-1">{vendas.length} transações</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase">Retiradas</h3>
            <TrendingDown className="text-red-500" size={20} />
          </div>
          <MonetaryValue value={totalRetiradas} size="xl" className="text-red-600" />
          <p className="text-xs sm:text-sm text-gray-600 mt-1">{retiradas.length} transações</p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-600 uppercase">Saldo Esperado</h3>
            <CheckCircle className="text-yellow-500" size={20} />
          </div>
          <MonetaryValue value={saldoEsperado} size="xl" className="text-yellow-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Totais por Tipo de Pagamento</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex flex-col gap-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <span className="text-sm font-semibold text-gray-700">PIX</span>
            <MonetaryValue value={totaisPorPagamento.PIX} size="md" className="text-blue-600" />
          </div>
          <div className="flex flex-col gap-2 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
            <span className="text-sm font-semibold text-gray-700">Dinheiro</span>
            <MonetaryValue value={totaisPorPagamento.Dinheiro} size="md" className="text-green-600" />
          </div>
          <div className="flex flex-col gap-2 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
            <span className="text-sm font-semibold text-gray-700">Débito</span>
            <MonetaryValue value={totaisPorPagamento.Débito} size="md" className="text-orange-600" />
          </div>
          <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-500">
            <span className="text-sm font-semibold text-gray-700">Crédito</span>
            <MonetaryValue value={totaisPorPagamento.Crédito} size="md" className="text-gray-700" />
          </div>
        </div>

        <div className="mt-6 p-4 bg-teal-50 rounded-lg border-l-4 border-teal-500">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Wallet className="text-teal-600" size={20} />
              <span className="text-sm font-semibold text-gray-700">Saldo em Caixa</span>
            </div>
            {/* Saldo = Abertura + Dinheiro - Retiradas */}
            <MonetaryValue value={valorAbertura + totaisPorPagamento.Dinheiro - totalRetiradas} size="md" className="text-teal-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Vendas do Dia ({vendas.length})</h2>
          {vendas.length > 0 ? (
            <div className="overflow-x-auto max-h-96 overflow-y-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-left whitespace-nowrap">Hora</th>
                      <th className="px-2 sm:px-3 py-2 text-left">Produto</th>
                      <th className="px-2 sm:px-3 py-2 text-center whitespace-nowrap">Qtd</th>
                      <th className="px-2 sm:px-3 py-2 text-right whitespace-nowrap">Total</th>
                      <th className="px-2 sm:px-3 py-2 text-left whitespace-nowrap">Pag.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendas.map((venda, index) => (
                      <tr key={venda.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{venda.hora}</td>
                        <td className="px-2 sm:px-3 py-2 max-w-[100px] sm:max-w-[150px] truncate">{venda.produto}</td>
                        <td className="px-2 sm:px-3 py-2 text-center">{venda.quantidade}</td>
                        <td className="px-2 sm:px-3 py-2 text-right font-semibold whitespace-nowrap">{formatCurrency(venda.total)}</td>
                        <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{venda.formaPagamento}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Nenhuma venda registrada</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Retiradas do Dia ({retiradas.length})</h2>
          {retiradas.length > 0 ? (
            <div className="overflow-x-auto max-h-96 overflow-y-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-left whitespace-nowrap">Hora</th>
                      <th className="px-2 sm:px-3 py-2 text-left">Descrição</th>
                      <th className="px-2 sm:px-3 py-2 text-right whitespace-nowrap">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retiradas.map((retirada, index) => (
                      <tr key={retirada.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{retirada.hora}</td>
                        <td className="px-2 sm:px-3 py-2 max-w-[120px] sm:max-w-[200px] truncate">{retirada.descricao}</td>
                        <td className="px-2 sm:px-3 py-2 text-right font-semibold text-red-600 whitespace-nowrap">
                          {formatCurrency(retirada.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Nenhuma retirada registrada</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
        <div className="text-center">
          <CheckCircle className="mx-auto mb-4 text-blue-600" size={48} />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Pronto para Fechar o Caixa?</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Ao fechar o caixa, as transações do dia serão salvas no histórico.
          </p>
          <button
            onClick={handleAbrirModal}
            className="w-full sm:w-auto px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            Fechar Caixa
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Confirmar Fechamento</h2>
              <button
                onClick={handleFecharModal}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 sm:p-6 space-y-6">

              {/* Passo 1: Conferência de Valores Digitais */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-sm font-bold text-blue-900 mb-3 uppercase tracking-wide flex items-center gap-2">
                  <CheckCircle size={16} className="text-blue-600" />
                  Valores Digitais (Já Contabilizados)
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex justify-between border-b border-blue-200 pb-1">
                    <span>PIX:</span>
                    <span className="font-semibold">{formatCurrency(totaisPorPagamento.PIX)}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-200 pb-1">
                    <span>Crédito:</span>
                    <span className="font-semibold">{formatCurrency(totaisPorPagamento.Crédito)}</span>
                  </div>
                  <div className="flex justify-between border-b border-blue-200 pb-1">
                    <span>Débito:</span>
                    <span className="font-semibold">{formatCurrency(totaisPorPagamento.Débito)}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-bold text-lg">
                    <span>Total Digital:</span>
                    <span>{formatCurrency(totaisPorPagamento.PIX + totaisPorPagamento.Crédito + totaisPorPagamento.Débito)}</span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2 bg-blue-100 p-2 rounded">
                  * Estes valores já estão no sistema e serão somados automaticamente.
                </p>
              </div>

              {/* Passo 2: Input de Dinheiro Separado */}
              <div className="space-y-4">

                {/* Moedas */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                      <Coins size={16} />
                    </div>
                    Moedas (Opcional)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valorMoedasInput.displayValue}
                    onChange={valorMoedasInput.handleChange}
                    onFocus={valorMoedasInput.handleFocus}
                    onBlur={valorMoedasInput.handleBlur}
                    className="w-full px-4 py-3 text-lg font-mono text-right border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-500 transition-all shadow-sm"
                    placeholder="0,00"
                  />
                  <p className="text-xs text-gray-400 mt-1 pl-1">Se não houver moedas, deixe zerado.</p>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      <DollarSign size={16} />
                    </div>
                    Notas
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valorNotasInput.displayValue}
                    onChange={valorNotasInput.handleChange}
                    onFocus={valorNotasInput.handleFocus}
                    onBlur={valorNotasInput.handleBlur}
                    className="w-full px-4 py-3 text-xl font-mono text-right border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all shadow-sm"
                    placeholder="0,00"
                    autoFocus
                  />
                </div>

                {(valorNotasInput.numericValue > 0 || valorMoedasInput.numericValue > 0) && (
                  <div className="text-right text-sm font-bold text-gray-700 bg-gray-100 p-2 rounded-lg">
                    Total Espécie: {formatCurrency(totalDinheiroAtual)}
                  </div>
                )}
              </div>

              {/* Passo 3: Resumo Final e Diferença */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                  <span>Total Digital:</span>
                  <span>{formatCurrency(totaisPorPagamento.PIX + totaisPorPagamento.Crédito + totaisPorPagamento.Débito)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                  <span>+ Dinheiro (Total):</span>
                  <span>{formatCurrency(totalDinheiroAtual)}</span>
                </div>
                <div className="border-t border-gray-300 my-2 pt-2 flex justify-between items-center font-bold text-gray-800">
                  <span>= Total Geral do Fechamento:</span>
                  <span>{formatCurrency(totalGeralPrevisto)}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-gray-500">Saldo Esperado pelo Sistema:</span>
                    <MonetaryValue value={saldoEsperado} size="sm" className="text-gray-500" />
                  </div>
                  <div className={`p-4 rounded-lg flex justify-between items-center border ${totalGeralPrevisto - saldoEsperado >= 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                    }`}>
                    <div>
                      <span className={`text-sm font-bold block ${totalGeralPrevisto - saldoEsperado >= 0
                        ? 'text-green-700'
                        : 'text-red-700'
                        }`}>Diferença Final:</span>
                      <span className="text-xs text-gray-500">
                        {totalGeralPrevisto - saldoEsperado >= 0 ? 'Sobra' : 'Falta'}
                      </span>
                    </div>
                    <MonetaryValue
                      value={totalGeralPrevisto - saldoEsperado}
                      size="lg"
                      className={totalGeralPrevisto - saldoEsperado >= 0 ? 'text-green-600' : 'text-red-600'}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleFecharModal}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarFechamento}
                  disabled={isProcessing}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold shadow-lg transition-all transform active:scale-95 ${isProcessing
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-200'
                    }`}
                >
                  {isProcessing ? 'Processando...' : 'Confirmar Fechamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

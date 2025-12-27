import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVendasHoje, getRetiradasHoje, getAberturaHoje, saveFechamento } from '../lib/storage';
import { Venda, Retirada, Fechamento as FechamentoType } from '../types';
import MonetaryValue from '../components/MonetaryValue';
import { formatCurrency, getCurrentDate, getCurrentTime } from '../utils/formatters';
import { useMonetaryInput } from '../hooks/useMonetaryInput';
import { CheckCircle, TrendingUp, TrendingDown, DollarSign, X, Wallet } from 'lucide-react';

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
  const valorContadoInput = useMonetaryInput(0);

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
    valorContadoInput.reset();
  };

  const handleFecharModal = () => {
    setShowModal(false);
    valorContadoInput.reset();
  };

  const handleConfirmarFechamento = async () => {
    const valor = valorContadoInput.numericValue;

    if (valor < 0) {
      alert('Por favor, informe um valor válido');
      return;
    }

    setIsProcessing(true);

    const diferenca = valor - saldoEsperado;

    const fechamentoId = abertura?.fechamentoOriginalId || crypto.randomUUID();

    const fechamento: FechamentoType = {
      id: fechamentoId,
      data: getCurrentDate(),
      hora: getCurrentTime(),
      totalVendas,
      totalRetiradas,
      valorAbertura,
      valorContado: valor,
      saldoEsperado,
      diferenca,
      vendas: [...vendas],
      retiradas: [...retiradas],
      status: 'fechado',
    };

    await saveFechamento(fechamento);
    // Dados mantidos no banco para histórico e auditoria

    onFechamentoConcluido?.();
    navigate('/historico');
  };

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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Confirmar Fechamento</h2>
              <button
                onClick={handleFecharModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Saldo Esperado:</span>
                    <MonetaryValue value={saldoEsperado} size="md" className="text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500">
                    (Abertura: {formatCurrency(valorAbertura)} + Vendas: {formatCurrency(totalVendas)} - Retiradas: {formatCurrency(totalRetiradas)})
                  </p>
                </div>

                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Valor Contado pela Operadora (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorContadoInput.displayValue}
                  onChange={valorContadoInput.handleChange}
                  onFocus={valorContadoInput.handleFocus}
                  onBlur={valorContadoInput.handleBlur}
                  className="w-full px-4 py-3 text-base sm:text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0,00"
                  required
                  autoFocus
                />

                {valorContadoInput.numericValue > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">Diferença:</span>
                      <MonetaryValue
                        value={valorContadoInput.numericValue - saldoEsperado}
                        size="lg"
                        className={valorContadoInput.numericValue - saldoEsperado >= 0 ? 'text-green-600' : 'text-red-600'}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {valorContadoInput.numericValue - saldoEsperado > 0 ? 'Sobra de caixa' : valorContadoInput.numericValue - saldoEsperado < 0 ? 'Falta no caixa' : 'Caixa fechado corretamente'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleFecharModal}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarFechamento}
                  disabled={isProcessing}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${isProcessing
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
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

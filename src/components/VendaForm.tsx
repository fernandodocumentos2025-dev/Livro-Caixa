import { useState, useEffect } from 'react';
import { Venda } from '../types';
import { getCurrentDate, getCurrentTime, formatCurrency } from '../utils/formatters';
import { useMonetaryInput } from '../hooks/useMonetaryInput';
import { X, DollarSign, CreditCard, Banknote, Smartphone } from 'lucide-react';

interface VendaFormProps {
  onSubmit: (venda: Omit<Venda, 'id'>) => void;
  initialData?: Venda;
  submitLabel?: string;
}

export default function VendaForm({ onSubmit, initialData, submitLabel = 'Adicionar Venda' }: VendaFormProps) {
  const [produto, setProduto] = useState(initialData?.produto || '');
  const [quantidade, setQuantidade] = useState(initialData?.quantidade.toString() || '1');

  // Default vazio se for nova venda, ou o valor existente se for edição
  const [formaPagamento, setFormaPagamento] = useState(initialData?.formaPagamento || '');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const precoInput = useMonetaryInput(initialData?.precoUnitario || 0);

  useEffect(() => {
    if (initialData?.precoUnitario) {
      precoInput.setValue(initialData.precoUnitario);
    }
  }, [initialData]);

  const total = parseFloat(quantidade || '0') * precoInput.numericValue;

  // Função auxiliar para criar o objeto venda e enviar
  const submitVenda = (pagamento: string) => {
    const venda: Omit<Venda, 'id'> = {
      produto: produto.trim(),
      quantidade: parseFloat(quantidade),
      precoUnitario: precoInput.numericValue,
      total: total,
      formaPagamento: pagamento,
      hora: getCurrentTime(),
      data: getCurrentDate(),
    };

    onSubmit(venda);

    // Reset apenas se não for edição
    if (!initialData) {
      setProduto('');
      setQuantidade('1');
      precoInput.reset();
      setFormaPagamento(''); // Volta para vazio para forçar escolha na próxima
    }

    setShowPaymentModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!produto.trim() || parseFloat(quantidade) <= 0 || precoInput.numericValue <= 0) {
      alert('Por favor, preencha todos os campos corretamente');
      return;
    }

    // Se já escolheu a forma de pagamento, envia direto
    if (formaPagamento && formaPagamento !== '') {
      submitVenda(formaPagamento);
    } else {
      // Se não escolheu, abre o modal de seleção rápida
      setShowPaymentModal(true);
    }
  };

  const handleQuickSelect = (pagamento: string) => {
    setFormaPagamento(pagamento);
    submitVenda(pagamento);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow-md relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-2">Produto</label>
            <input
              type="text"
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nome do produto"
              required
              autoFocus={!initialData}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Quantidade</label>
            <input
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              onFocus={(e) => {
                if (e.target.value === '1') {
                  setQuantidade('');
                }
              }}
              onBlur={(e) => {
                if (e.target.value === '') {
                  setQuantidade('1');
                }
              }}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Preço Unitário (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={precoInput.displayValue}
              onChange={precoInput.handleChange}
              onFocus={precoInput.handleFocus}
              onBlur={precoInput.handleBlur}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Forma de Pagamento <span className="text-gray-400 font-normal">(Opcional agora)</span>
            </label>
            <select
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">-- Selecionar depois --</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Débito">Débito</option>
              <option value="Crédito">Crédito</option>
              <option value="PIX">PIX</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Total</label>
            <div className="w-full px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg bg-gray-50 font-bold text-green-600 flex items-center overflow-hidden">
              <span className="truncate text-base">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button
              type="submit"
              className="w-full px-4 sm:px-6 py-2.5 sm:py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 active:bg-green-800 transition-colors text-base shadow-sm"
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </form>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full transform transition-all scale-100">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Selecione o Pagamento</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-center text-gray-600 mb-6 font-medium">
                Como o cliente pagou a venda de <span className="text-green-600 font-bold text-lg">{formatCurrency(total)}</span>?
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleQuickSelect('Dinheiro')}
                  className="flex flex-col items-center justify-center p-6 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-400 rounded-xl transition-all group"
                >
                  <div className="p-3 bg-white rounded-full text-green-600 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <Banknote size={32} />
                  </div>
                  <span className="font-bold text-green-800 text-lg">Dinheiro</span>
                </button>

                <button
                  onClick={() => handleQuickSelect('PIX')}
                  className="flex flex-col items-center justify-center p-6 bg-teal-50 hover:bg-teal-100 border-2 border-teal-200 hover:border-teal-400 rounded-xl transition-all group"
                >
                  <div className="p-3 bg-white rounded-full text-teal-600 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <Smartphone size={32} />
                  </div>
                  <span className="font-bold text-teal-800 text-lg">PIX</span>
                </button>

                <button
                  onClick={() => handleQuickSelect('Débito')}
                  className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400 rounded-xl transition-all group"
                >
                  <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <CreditCard size={32} />
                  </div>
                  <span className="font-bold text-blue-800 text-lg">Débito</span>
                </button>

                <button
                  onClick={() => handleQuickSelect('Crédito')}
                  className="flex flex-col items-center justify-center p-6 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 hover:border-purple-400 rounded-xl transition-all group"
                >
                  <div className="p-3 bg-white rounded-full text-purple-600 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <CreditCard size={32} />
                  </div>
                  <span className="font-bold text-purple-800 text-lg">Crédito</span>
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-6">
                Toque em uma opção para finalizar a venda imediatamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useState, useEffect } from 'react';
import { Venda } from '../types';
import { getCurrentDate, getCurrentTime, formatCurrency } from '../utils/formatters';
import { useMonetaryInput } from '../hooks/useMonetaryInput';

interface VendaFormProps {
  onSubmit: (venda: Omit<Venda, 'id'>) => void;
  initialData?: Venda;
  submitLabel?: string;
}

export default function VendaForm({ onSubmit, initialData, submitLabel = 'Adicionar Venda' }: VendaFormProps) {
  const [produto, setProduto] = useState(initialData?.produto || '');
  const [quantidade, setQuantidade] = useState(initialData?.quantidade.toString() || '1');
  const [formaPagamento, setFormaPagamento] = useState(initialData?.formaPagamento || 'Dinheiro');
  const [hasInteracted, setHasInteracted] = useState(!!initialData); // Se já tem dados (edição), não anima
  const precoInput = useMonetaryInput(initialData?.precoUnitario || 0);

  useEffect(() => {
    if (initialData?.precoUnitario) {
      precoInput.setValue(initialData.precoUnitario);
    }
  }, [initialData]);

  const total = parseFloat(quantidade || '0') * precoInput.numericValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!produto.trim() || parseFloat(quantidade) <= 0 || precoInput.numericValue <= 0) {
      alert('Por favor, preencha todos os campos corretamente');
      return;
    }

    const venda: Omit<Venda, 'id'> = {
      produto: produto.trim(),
      quantidade: parseFloat(quantidade),
      precoUnitario: precoInput.numericValue,
      total: total,
      formaPagamento,
      hora: getCurrentTime(),
      data: getCurrentDate(),
    };

    onSubmit(venda);

    if (!initialData) {
      setProduto('');
      setQuantidade('1');
      precoInput.reset();
      setFormaPagamento('Dinheiro');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
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
            onWheel={(e) => e.currentTarget.blur()}
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
            Forma de Pagamento
            {!hasInteracted && <span className="ml-2 text-xs font-normal text-blue-600 animate-pulse">(Verifique!)</span>}
          </label>
          <select
            value={formaPagamento}
            onChange={(e) => {
              setFormaPagamento(e.target.value);
              setHasInteracted(true);
            }}
            onFocus={() => setHasInteracted(true)}
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${!hasInteracted ? 'animate-attention' : ''}`}
          >
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
            className="w-full px-4 sm:px-6 py-2.5 sm:py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 active:bg-green-800 transition-colors text-base"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

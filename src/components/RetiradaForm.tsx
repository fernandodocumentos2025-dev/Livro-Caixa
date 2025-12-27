import { useState, useEffect } from 'react';
import { Retirada } from '../types';
import { getCurrentDate, getCurrentTime } from '../utils/formatters';
import { useMonetaryInput } from '../hooks/useMonetaryInput';

interface RetiradaFormProps {
  onSubmit: (retirada: Omit<Retirada, 'id'>) => void;
  initialData?: Retirada;
  submitLabel?: string;
}

export default function RetiradaForm({ onSubmit, initialData, submitLabel = 'Registrar Retirada' }: RetiradaFormProps) {
  const [descricao, setDescricao] = useState(initialData?.descricao || '');
  const valorInput = useMonetaryInput(initialData?.valor || 0);

  useEffect(() => {
    if (initialData?.valor) {
      valorInput.setValue(initialData.valor);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!descricao.trim() || valorInput.numericValue <= 0) {
      alert('Por favor, preencha todos os campos corretamente');
      return;
    }

    const retirada: Omit<Retirada, 'id'> = {
      descricao: descricao.trim(),
      valor: valorInput.numericValue,
      hora: getCurrentTime(),
      data: getCurrentDate(),
    };

    onSubmit(retirada);

    if (!initialData) {
      setDescricao('');
      valorInput.reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-2">Descrição</label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Ex: Compra de material"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Valor (R$)</label>
          <input
            type="text"
            inputMode="decimal"
            value={valorInput.displayValue}
            onChange={valorInput.handleChange}
            onFocus={valorInput.handleFocus}
            onBlur={valorInput.handleBlur}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="0,00"
            required
          />
        </div>

        <div className="sm:col-span-3 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 active:bg-red-800 transition-colors text-base"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

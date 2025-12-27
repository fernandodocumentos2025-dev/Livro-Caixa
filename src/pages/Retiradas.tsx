import { useEffect, useState } from 'react';
import { getRetiradasHoje, saveRetirada, updateRetirada, deleteRetirada } from '../lib/storage';
import { Retirada } from '../types';
import RetiradaForm from '../components/RetiradaForm';
import MonetaryValue from '../components/MonetaryValue';
import { formatCurrency } from '../utils/formatters';
import { Pencil, Trash2, X } from 'lucide-react';

export default function Retiradas() {
  const [retiradas, setRetiradas] = useState<Retirada[]>([]);
  const [editingRetirada, setEditingRetirada] = useState<Retirada | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadRetiradas();
  }, []);

  const loadRetiradas = async () => {
    setRetiradas(await getRetiradasHoje());
  };

  const handleAddRetirada = async (retiradaData: Omit<Retirada, 'id'>) => {
    const newRetirada: Retirada = {
      ...retiradaData,
      id: crypto.randomUUID(),
    };
    await saveRetirada(newRetirada);
    await loadRetiradas();
    showMessage('Retirada registrada com sucesso!', 'success');
  };

  const handleUpdateRetirada = async (retiradaData: Omit<Retirada, 'id'>) => {
    if (editingRetirada) {
      const updatedRetirada: Retirada = {
        ...retiradaData,
        id: editingRetirada.id,
      };
      await updateRetirada(editingRetirada.id, updatedRetirada);
      await loadRetiradas();
      setShowModal(false);
      setEditingRetirada(null);
      showMessage('Retirada atualizada com sucesso!', 'success');
    }
  };

  const handleDeleteRetirada = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta retirada?')) {
      await deleteRetirada(id);
      await loadRetiradas();
      showMessage('Retirada excluída com sucesso!', 'success');
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setTimeout(() => setMessage(''), type === 'success' ? 3000 : 5000);
  };

  const openEditModal = (retirada: Retirada) => {
    setEditingRetirada(retirada);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRetirada(null);
  };

  const totalRetiradas = retiradas.reduce((sum, r) => sum + r.valor, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Retiradas</h1>
        <p className="text-sm sm:text-base text-gray-600">Gerencie as retiradas do dia</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.includes('sucesso') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message}
        </div>
      )}

      <div className="mb-6">
        <RetiradaForm onSubmit={handleAddRetirada} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Retiradas do Dia ({retiradas.length})</h2>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-gray-600">Total</p>
            <MonetaryValue value={totalRetiradas} size="xl" className="text-red-600" />
          </div>
        </div>

        {retiradas.length > 0 ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Hora</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Descrição</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Valor</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {retiradas.map((retirada, index) => (
                    <tr
                      key={retirada.id}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-red-50 transition-colors`}
                    >
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">{retirada.hora}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium max-w-[150px] sm:max-w-[300px] truncate">{retirada.descricao}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-bold text-red-600 whitespace-nowrap">
                        {formatCurrency(retirada.valor)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                        <div className="flex justify-center gap-1 sm:gap-2">
                          <button
                            onClick={() => openEditModal(retirada)}
                            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                            title="Editar"
                          >
                            <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                          <button
                            onClick={() => handleDeleteRetirada(retirada.id)}
                            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                            title="Excluir"
                          >
                            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-base sm:text-lg">Nenhuma retirada registrada hoje</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-2">Registre a primeira retirada usando o formulário acima</p>
          </div>
        )}
      </div>

      {showModal && editingRetirada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Editar Retirada</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <RetiradaForm
                onSubmit={handleUpdateRetirada}
                initialData={editingRetirada}
                submitLabel="Salvar Alterações"
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base touch-manipulation"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

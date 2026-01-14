import { useEffect, useState } from 'react';
import { getVendasHoje, saveVenda, updateVenda, deleteVenda } from '../lib/storage';
import { Venda } from '../types';
import VendaForm from '../components/VendaForm';
import MonetaryValue from '../components/MonetaryValue';
import { formatCurrency } from '../utils/formatters';
import { Pencil, Trash2, X } from 'lucide-react';

export default function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [editingVenda, setEditingVenda] = useState<Venda | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadVendas();
  }, []);

  const loadVendas = async () => {
    try {
      setLoading(true);
      setError(false);
      setVendas(await getVendasHoje());
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVenda = async (vendaData: Omit<Venda, 'id'>) => {
    try {
      const newVenda: Venda = {
        ...vendaData,
        id: crypto.randomUUID(),
      };
      await saveVenda(newVenda);
      await loadVendas();
      showMessage('Venda adicionada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao adicionar venda:', error);
      showMessage(error instanceof Error ? error.message : 'Erro ao adicionar venda', 'error');
    }
  };

  const handleUpdateVenda = async (vendaData: Omit<Venda, 'id'>) => {
    if (editingVenda) {
      const updatedVenda: Venda = {
        ...vendaData,
        id: editingVenda.id,
      };
      await updateVenda(editingVenda.id, updatedVenda);
      await loadVendas();
      setShowModal(false);
      setEditingVenda(null);
      showMessage('Venda atualizada com sucesso!', 'success');
    }
  };

  const handleDeleteVenda = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda?')) {
      await deleteVenda(id);
      await loadVendas();
      showMessage('Venda excluída com sucesso!', 'success');
    }
  };

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setTimeout(() => setMessage(''), type === 'success' ? 3000 : 5000);
  };

  const openEditModal = (venda: Venda) => {
    setEditingVenda(venda);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVenda(null);
  };

  const totalVendas = vendas.reduce((sum, v) => sum + v.total, 0);



  if (loading || error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Vendas</h1>
        <p className="text-sm sm:text-base text-gray-600">Gerencie as vendas do dia</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${message.includes('sucesso') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
        >
          {message}
        </div>
      )}

      <div className="mb-6">
        <VendaForm onSubmit={handleAddVenda} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Vendas do Dia ({vendas.length})</h2>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-gray-600">Total</p>
            <MonetaryValue value={totalVendas} size="xl" className="text-green-600" />
          </div>
        </div>

        {vendas.length > 0 ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Hora</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Produto</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Qtd</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 hidden md:table-cell whitespace-nowrap">Preço Unit.</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Total</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell whitespace-nowrap">Pagamento</th>
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vendas.map((venda, index) => (
                    <tr
                      key={venda.id}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                    >
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">{venda.hora}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium max-w-[120px] sm:max-w-[200px] truncate">{venda.produto}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center">{venda.quantidade}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right hidden md:table-cell whitespace-nowrap">{formatCurrency(venda.precoUnitario)}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right font-bold text-green-600 whitespace-nowrap">
                        {formatCurrency(venda.total)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm hidden sm:table-cell whitespace-nowrap">{venda.formaPagamento}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-center whitespace-nowrap">
                        <div className="flex justify-center gap-1 sm:gap-2">
                          <button
                            onClick={() => openEditModal(venda)}
                            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                            title="Editar"
                          >
                            <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                          <button
                            onClick={() => handleDeleteVenda(venda.id)}
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
            <p className="text-gray-500 text-base sm:text-lg">Nenhuma venda registrada hoje</p>
            <p className="text-gray-400 text-xs sm:text-sm mt-2">Adicione a primeira venda usando o formulário acima</p>
          </div>
        )}
      </div>

      {showModal && editingVenda && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Editar Venda</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <VendaForm
                onSubmit={handleUpdateVenda}
                initialData={editingVenda}
                submitLabel="Salvar Alterações"
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
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

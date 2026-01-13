import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fechamento } from '../types';
import MonetaryValue from './MonetaryValue';
import { formatCurrency } from '../utils/formatters';
import { Download, Share2, Trash2, ChevronDown, ChevronUp, RotateCcw, Wallet, FileText, Code, X } from 'lucide-react';
import { generatePDFBlob, generateHTMLBlob, saveBlob, shareFile } from '../lib/export';
import { reabrirCaixa } from '../lib/storage';

interface FechamentoCardProps {
  fechamento: Fechamento;
  onDelete: (id: string) => void;
  empresaNome?: string;
  onReabrir?: () => void;
}

export default function FechamentoCard({ fechamento, onDelete, empresaNome = '', onReabrir }: FechamentoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const navigate = useNavigate();

  // ... (calcularTotaisPorFormaPagamento code remains same, omitted for brevity if using replace_file_content correctly, but I must match exact target content)
  // To avoid matching issues, I will target the header and the handleReabrir function separately if possible, or just the top part if I can match enough context.
  // Actually, I can allow multiple edits? No, tool says "SINGLE CONTIGUOUS block".
  // I will just update the Interface and the Function signature in one block if they are close.
  // Lines 10-16 are close.
  // And lines 47-56 for handleReabrir.
  // I will use multi_replace for this file since I need to change two separate places (Props definition and Usage).

  const [isExpanded, setIsExpanded] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const navigate = useNavigate();

  const calcularTotaisPorFormaPagamento = () => {
    const totais = {
      PIX: 0,
      Dinheiro: 0,
      Débito: 0,
      Crédito: 0,
    };

    fechamento.vendas.forEach((venda) => {
      if (totais.hasOwnProperty(venda.formaPagamento)) {
        totais[venda.formaPagamento as keyof typeof totais] += venda.total;
      }
    });

    return totais;
  };

  const totaisPorPagamento = calcularTotaisPorFormaPagamento();

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir este fechamento?')) {
      onDelete(fechamento.id);
    }
  };

  const handleReabrir = async () => {
    if (window.confirm('Tem certeza que deseja reabrir este caixa? O caixa atual será substituído.')) {
      const sucesso = await reabrirCaixa(fechamento.id);
      if (sucesso) {
        if (onReabrir) onReabrir();
        navigate('/');
      } else {
        alert('Erro ao reabrir o caixa');
      }
    }
  };

  const [modalMode, setModalMode] = useState<'share' | 'download'>('share');

  const handleAction = async (format: 'pdf' | 'html') => {
    setIsSharing(true);
    try {
      const filename = `fechamento-${fechamento.data.replace(/\//g, '-')}.${format}`;
      let blob: Blob;

      if (format === 'pdf') {
        blob = generatePDFBlob(fechamento, empresaNome);
      } else {
        blob = generateHTMLBlob(fechamento, empresaNome);
      }

      if (modalMode === 'download') {
        saveBlob(blob, filename);
      } else {
        const file = new File([blob], filename, { type: blob.type });
        const title = `Fechamento ${fechamento.data}`;
        const text = `Confira o fechamento de caixa do dia ${fechamento.data}`;

        const shared = await shareFile(file, title, text);
        if (!shared) {
          saveBlob(blob, filename);
        }
      }

      setShowShareModal(false);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Ocorreu um erro ao processar o arquivo.');
    } finally {
      setIsSharing(false);
    }
  };

  const openShareModal = () => {
    setModalMode('share');
    setShowShareModal(true);
  };

  const openDownloadModal = () => {
    setModalMode('download');
    setShowShareModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden relative">
      {/* Share Modal Overlay */}
      {showShareModal && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" style={{ position: 'fixed' }}>
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">
              {modalMode === 'share' ? 'Compartilhar Fechamento' : 'Baixar Fechamento'}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAction('pdf')}
                disabled={isSharing}
                className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-transparent bg-red-50 hover:bg-red-100 hover:border-red-200 transition-all group disabled:opacity-50"
              >
                <div className="p-3 bg-red-100 text-red-600 rounded-full group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
                <span className="font-semibold text-gray-700">PDF</span>
              </button>

              <button
                onClick={() => handleAction('html')}
                disabled={isSharing}
                className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-transparent bg-blue-50 hover:bg-blue-100 hover:border-blue-200 transition-all group disabled:opacity-50"
              >
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
                  <Code size={24} />
                </div>
                <span className="font-semibold text-gray-700">HTML</span>
              </button>
            </div>

            <p className="text-xs text-center text-gray-400 mt-6">
              Selecione o formato para {modalMode === 'share' ? 'compartilhar' : 'baixar'}
            </p>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">{fechamento.data}</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {fechamento.status === 'reaberto' ? 'Reaberto' : 'Fechado'} às {fechamento.hora}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(!fechamento.status || fechamento.status === 'fechado') && (
              <button
                onClick={handleReabrir}
                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors touch-manipulation"
                title="Reabrir Caixa"
                aria-label="Reabrir Caixa"
              >
                <RotateCcw size={18} className="sm:w-5 sm:h-5" />
              </button>
            )}

            <button
              onClick={openDownloadModal}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors touch-manipulation"
              title="Baixar Arquivo"
              aria-label="Baixar arquivo"
            >
              <Download size={18} className="sm:w-5 sm:h-5" />
              <span className="text-sm font-medium hidden sm:inline">Baixar</span>
            </button>

            <button
              onClick={openShareModal}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors touch-manipulation shadow-sm"
              title="Compartilhar"
              aria-label="Compartilhar fechamento"
            >
              <Share2 size={18} className="sm:w-5 sm:h-5" />
              <span className="text-sm font-medium hidden sm:inline">Compartilhar</span>
            </button>

            <button
              onClick={handleDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
              title="Excluir"
              aria-label="Excluir fechamento"
            >
              <Trash2 size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Abertura</p>
            <MonetaryValue value={fechamento.valorAbertura} size="sm" className="text-blue-600" />
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Vendas</p>
            <MonetaryValue value={fechamento.totalVendas} size="sm" className="text-green-600" />
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Retiradas</p>
            <MonetaryValue value={fechamento.totalRetiradas} size="sm" className="text-red-600" />
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Esperado</p>
            <MonetaryValue value={fechamento.saldoEsperado} size="sm" className="text-yellow-600" />
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-1">Total Apurado</p>
            <MonetaryValue value={fechamento.valorContado} size="sm" className="text-purple-600" />
          </div>
          <div className={`text-center p-3 rounded-lg ${fechamento.diferenca >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-xs text-gray-600 mb-1">Diferença</p>
            <MonetaryValue
              value={fechamento.diferenca}
              size="sm"
              className={fechamento.diferenca >= 0 ? 'text-green-600' : 'text-red-600'}
            />
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm sm:text-base text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
        >
          {isExpanded ? (
            <>
              <ChevronUp size={18} className="sm:w-5 sm:h-5" />
              <span>Ocultar Detalhes</span>
            </>
          ) : (
            <>
              <ChevronDown size={18} className="sm:w-5 sm:h-5" />
              <span>Ver Detalhes</span>
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
          <div className="mb-6">
            <h4 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">Totais por Tipo de Pagamento</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="flex flex-col gap-2 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">PIX</span>
                <MonetaryValue value={totaisPorPagamento.PIX} size="sm" className="text-blue-600" />
              </div>
              <div className="flex flex-col gap-2 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Dinheiro</span>
                <MonetaryValue value={totaisPorPagamento.Dinheiro} size="sm" className="text-green-600" />
              </div>
              <div className="flex flex-col gap-2 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Débito</span>
                <MonetaryValue value={totaisPorPagamento.Débito} size="sm" className="text-orange-600" />
              </div>
              <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border-l-4 border-gray-500">
                <span className="text-xs sm:text-sm font-semibold text-gray-700">Crédito</span>
                <MonetaryValue value={totaisPorPagamento.Crédito} size="sm" className="text-gray-700" />
              </div>
            </div>

            <div className="p-4 bg-teal-50 rounded-lg border-l-4 border-teal-500">
              <div className="flex flex-col gap-3">
                <div className="border-b border-teal-200 pb-2 mb-1">
                  <h5 className="text-teal-900 font-bold flex items-center gap-2 mb-2">
                    <Wallet size={18} />
                    Conferência do Fechamento
                  </h5>
                  <div className="flex justify-between text-sm text-teal-800 mb-1">
                    <span>Total Digital (Sistema):</span>
                    <span>{formatCurrency(totaisPorPagamento.PIX + totaisPorPagamento.Crédito + totaisPorPagamento.Débito)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-teal-800">
                    <span>Dinheiro (Informado):</span>
                    <span className="font-bold w-full flex justify-end">
                      {fechamento.detalheEspecie ? (
                        <div className="flex flex-col items-end gap-1 w-full max-w-[220px]">
                          <div className="flex justify-between w-full">
                            <span className="font-normal text-teal-700">Notas:</span>
                            <span>{formatCurrency(fechamento.detalheEspecie.notas)}</span>
                          </div>
                          {fechamento.detalheEspecie.moedas > 0 && (
                            <div className="flex justify-between w-full">
                              <span className="font-normal text-teal-700">Moedas:</span>
                              <span>{formatCurrency(fechamento.detalheEspecie.moedas)}</span>
                            </div>
                          )}
                          <div className="flex justify-between w-full border-t border-teal-200 mt-1 pt-1">
                            <span className="font-bold text-xs text-teal-600 uppercase self-center">Total Espécie:</span>
                            <span className="text-teal-900">{formatCurrency(fechamento.detalheEspecie.notas + fechamento.detalheEspecie.moedas)}</span>
                          </div>
                        </div>
                      ) : (
                        formatCurrency(fechamento.valorContado - (totaisPorPagamento.PIX + totaisPorPagamento.Crédito + totaisPorPagamento.Débito))
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">Total Geral Apurado:</span>
                  <MonetaryValue value={fechamento.valorContado} size="lg" className="text-teal-700" />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">Vendas ({fechamento.vendas.length})</h4>
            {fechamento.vendas.length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full text-xs sm:text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-2 sm:px-3 py-2 text-left whitespace-nowrap">Hora</th>
                          <th className="px-2 sm:px-3 py-2 text-left">Produto</th>
                          <th className="px-2 sm:px-3 py-2 text-center whitespace-nowrap">Qtd</th>
                          <th className="px-2 sm:px-3 py-2 text-right whitespace-nowrap hidden sm:table-cell">Preço Unit.</th>
                          <th className="px-2 sm:px-3 py-2 text-right whitespace-nowrap">Total</th>
                          <th className="px-2 sm:px-3 py-2 text-left whitespace-nowrap hidden md:table-cell">Pagamento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fechamento.vendas.map((venda) => (
                          <tr key={venda.id} className="border-b border-gray-200">
                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{venda.hora}</td>
                            <td className="px-2 sm:px-3 py-2 max-w-[120px] sm:max-w-none truncate">{venda.produto}</td>
                            <td className="px-2 sm:px-3 py-2 text-center">{venda.quantidade}</td>
                            <td className="px-2 sm:px-3 py-2 text-right whitespace-nowrap hidden sm:table-cell">{formatCurrency(venda.precoUnitario)}</td>
                            <td className="px-2 sm:px-3 py-2 text-right font-semibold whitespace-nowrap">{formatCurrency(venda.total)}</td>
                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap hidden md:table-cell">{venda.formaPagamento}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">Nenhuma venda registrada</p>
            )}
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">Retiradas ({fechamento.retiradas.length})</h4>
            {fechamento.retiradas.length > 0 ? (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full text-xs sm:text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-2 sm:px-3 py-2 text-left whitespace-nowrap">Hora</th>
                          <th className="px-2 sm:px-3 py-2 text-left">Descrição</th>
                          <th className="px-2 sm:px-3 py-2 text-right whitespace-nowrap">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fechamento.retiradas.map((retirada) => (
                          <tr key={retirada.id} className="border-b border-gray-200">
                            <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{retirada.hora}</td>
                            <td className="px-2 sm:px-3 py-2 max-w-[150px] sm:max-w-none truncate">{retirada.descricao}</td>
                            <td className="px-2 sm:px-3 py-2 text-right font-semibold text-red-600 whitespace-nowrap">
                              {formatCurrency(retirada.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">Nenhuma retirada registrada</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

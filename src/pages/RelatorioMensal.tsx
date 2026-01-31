import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFechamentosMensais } from '../lib/storage';
import { getUserSettings } from '../services/storageService';
import { saveMonthlyPDF, shareMonthlyPDF } from '../lib/exportMonthly';
import { getBrazilISODate } from '../utils/dateHelpers';
import { FileDown, Calendar, AlertCircle, CheckCircle, Share2, X } from 'lucide-react';

export default function RelatorioMensal() {
    const [mesAno, setMesAno] = useState('');
    const [empresaNome, setEmpresaNome] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        loadSettings();
        // Pré-selecionar mês atual (Fuso Brasil)
        const mesAtual = getBrazilISODate().slice(0, 7);
        setMesAno(mesAtual);
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await getUserSettings();
            if (settings?.companyName) {
                setEmpresaNome(settings.companyName);
            }
        } catch (err) {
            console.error('Erro ao carregar configurações:', err);
        }
    };

    const handleClose = () => {
        navigate('/historico');
    };

    const handleExport = async () => {
        if (!mesAno) {
            setError('Selecione um mês');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const [ano, mes] = mesAno.split('-').map(Number);
            const fechamentos = await getFechamentosMensais(ano, mes);

            if (fechamentos.length === 0) {
                setError('Nenhum fechamento encontrado para o mês selecionado. Certifique-se de que há caixas fechados neste período.');
                return;
            }

            saveMonthlyPDF(fechamentos, mes, ano, empresaNome);
            setSuccess(`PDF gerado com sucesso! ${fechamentos.length} fechamento(s) incluído(s).`);
        } catch (err) {
            console.error('Erro ao exportar PDF:', err);
            setError(err instanceof Error ? err.message : 'Erro ao gerar PDF. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!mesAno) {
            setError('Selecione um mês');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const [ano, mes] = mesAno.split('-').map(Number);
            const fechamentos = await getFechamentosMensais(ano, mes);

            if (fechamentos.length === 0) {
                setError('Nenhum fechamento encontrado para o mês selecionado. Certifique-se de que há caixas fechados neste período.');
                return;
            }

            const shared = await shareMonthlyPDF(fechamentos, mes, ano, empresaNome);
            if (shared) {
                setSuccess('PDF compartilhado com sucesso!');
            } else {
                setSuccess(`PDF gerado! ${fechamentos.length} fechamento(s) incluído(s).`);
            }
        } catch (err) {
            console.error('Erro ao compartilhar PDF:', err);
            setError(err instanceof Error ? err.message : 'Erro ao compartilhar PDF. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6 sm:mb-8 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                            Relatório Mensal
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600">
                            Exporte o resumo financeiro consolidado de um mês específico
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="Fechar"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <Calendar size={18} />
                            Selecione o Mês
                        </label>
                        <input
                            type="month"
                            value={mesAno}
                            onChange={(e) => setMesAno(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                            max={getBrazilISODate().slice(0, 7)}
                        />
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-green-800 text-sm">{success}</p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleExport}
                            disabled={loading || !mesAno}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <FileDown size={20} />
                                    Baixar PDF
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleShare}
                            disabled={loading || !mesAno}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <Share2 size={20} />
                            Compartilhar
                        </button>
                    </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <AlertCircle size={18} />
                        Informações Importantes
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>Apenas <strong>caixas fechados</strong> são incluídos no relatório</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>Dados consolidados da tabela de <strong>fechamentos</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>Registros deletados são <strong>automaticamente ignorados</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>O PDF inclui: resumo mensal, totais por forma de pagamento e lista de fechamentos diários</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

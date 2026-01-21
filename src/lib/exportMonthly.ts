import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Fechamento } from '../types';
import { formatCurrency } from '../utils/formatters';

interface MonthlyTotals {
    totalVendas: number;
    totalRetiradas: number;
    saldoMensal: number;
    diasOperados: number;
    totaisPorPagamento: {
        PIX: number;
        Dinheiro: number;
        Débito: number;
        Crédito: number;
    };
}

function calcularTotaisMensais(fechamentos: Fechamento[]): MonthlyTotals {
    const totalVendas = fechamentos.reduce((sum, f) => sum + f.totalVendas, 0);
    const totalRetiradas = fechamentos.reduce((sum, f) => sum + f.totalRetiradas, 0);

    const totaisPorPagamento = { PIX: 0, Dinheiro: 0, Débito: 0, Crédito: 0 };
    fechamentos.forEach(f => {
        f.vendas.forEach(v => {
            if (Object.prototype.hasOwnProperty.call(totaisPorPagamento, v.formaPagamento)) {
                totaisPorPagamento[v.formaPagamento as keyof typeof totaisPorPagamento] += v.total;
            }
        });
    });

    return {
        totalVendas,
        totalRetiradas,
        saldoMensal: totalVendas - totalRetiradas,
        diasOperados: fechamentos.length,
        totaisPorPagamento
    };
}

function getMesNome(mes: number): string {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return meses[mes - 1];
}

export function generateMonthlyPDFBlob(
    fechamentos: Fechamento[],
    mes: number,
    ano: number,
    empresaNome: string = ''
): Blob {
    if (fechamentos.length === 0) {
        throw new Error('Nenhum fechamento encontrado para o mês selecionado');
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const totais = calcularTotaisMensais(fechamentos);

    // Cabeçalho
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);

    let yPos = 15;
    if (empresaNome) {
        doc.setFontSize(14);
        doc.text(empresaNome, pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;
    }

    doc.setFontSize(20);
    doc.text('Relatório Mensal', pageWidth / 2, yPos, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`${getMesNome(mes)}/${ano}`, pageWidth / 2, yPos + 10, { align: 'center' });

    // Resumo Financeiro
    yPos = 50;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Resumo do Mês', 14, yPos);

    yPos += 10;
    const resumoData = [
        ['Métrica', 'Valor'],
        ['Total de Vendas', formatCurrency(totais.totalVendas)],
        ['Total de Retiradas', formatCurrency(totais.totalRetiradas)],
        ['Saldo Mensal', formatCurrency(totais.saldoMensal)],
        ['Dias Operados', totais.diasOperados.toString()]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [resumoData[0]],
        body: resumoData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: 14, right: 14 }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Totais por Forma de Pagamento
    doc.setFontSize(16);
    doc.text('Formas de Pagamento', 14, yPos);

    yPos += 5;
    const pagamentoData = [
        ['Forma', 'Total'],
        ['PIX', formatCurrency(totais.totaisPorPagamento.PIX)],
        ['Dinheiro', formatCurrency(totais.totaisPorPagamento.Dinheiro)],
        ['Débito', formatCurrency(totais.totaisPorPagamento.Débito)],
        ['Crédito', formatCurrency(totais.totaisPorPagamento.Crédito)]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [pagamentoData[0]],
        body: pagamentoData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: 14, right: 14 }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Tabela de Fechamentos Diários
    doc.setFontSize(16);
    doc.text('Fechamentos Diários', 14, yPos);

    yPos += 5;
    autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Vendas', 'Retiradas', 'Saldo']],
        body: fechamentos.map(f => [
            f.data,
            formatCurrency(f.totalVendas),
            formatCurrency(f.totalRetiradas),
            formatCurrency(f.saldoEsperado)
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
        doc.text(`Gerado em ${timestamp}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    return doc.output('blob');
}

export function saveMonthlyPDF(
    fechamentos: Fechamento[],
    mes: number,
    ano: number,
    empresaNome: string = ''
): void {
    const blob = generateMonthlyPDFBlob(fechamentos, mes, ano, empresaNome);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-mensal-${ano}-${mes.toString().padStart(2, '0')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function shareMonthlyPDF(
    fechamentos: Fechamento[],
    mes: number,
    ano: number,
    empresaNome: string = ''
): Promise<boolean> {
    try {
        const blob = generateMonthlyPDFBlob(fechamentos, mes, ano, empresaNome);
        const filename = `relatorio-mensal-${ano}-${mes.toString().padStart(2, '0')}.pdf`;
        const file = new File([blob], filename, { type: 'application/pdf' });

        const mesNome = getMesNome(mes);

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: `Relatório Mensal - ${mesNome}/${ano}`,
                text: `Relatório financeiro de ${mesNome}/${ano}${empresaNome ? ` - ${empresaNome}` : ''}`,
            });
            return true;
        } else {
            // Fallback: download if share not supported
            saveMonthlyPDF(fechamentos, mes, ano, empresaNome);
            return false;
        }
    } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
            console.error('Erro ao compartilhar PDF:', error);
        }
        return false;
    }
}

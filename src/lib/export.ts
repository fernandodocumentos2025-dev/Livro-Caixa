import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Fechamento } from '../types';
import { formatCurrency } from '../utils/formatters';

function calcularTotaisPorFormaPagamento(fechamento: Fechamento) {
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
}

export function generateFechamentoHTML(fechamento: Fechamento): string {
  const totaisPorPagamento = calcularTotaisPorFormaPagamento(fechamento);

  const vendasRows = fechamento.vendas
    .map(
      (v) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${v.hora}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${v.produto}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${v.quantidade}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(v.precoUnitario)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${formatCurrency(v.total)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${v.formaPagamento}</td>
      </tr>
    `
    )
    .join('');

  const retiradasRows = fechamento.retiradas
    .map(
      (r) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${r.hora}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${r.descricao}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #ef4444;">${formatCurrency(r.valor)}</td>
      </tr>
    `
    )
    .join('');

  return `<!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fechamento de Caixa - ${fechamento.data}</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: #f9fafb;
        color: #1f2937;
        padding: 20px;
        line-height: 1.6;
      }
      .container {
        max-width: 1000px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }
      .header {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        padding: 40px 30px;
        text-align: center;
      }
      .header h1 {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 10px;
      }
      .header p {
        font-size: 18px;
        opacity: 0.95;
      }
      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        padding: 30px;
        background: #f9fafb;
      }
      .summary-card {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }
      .summary-card h3 {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 8px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .summary-card p {
        font-size: 28px;
        font-weight: 700;
      }
      .summary-card.vendas p {
        color: #10b981;
      }
      .summary-card.retiradas p {
        color: #ef4444;
      }
      .summary-card.saldo p {
        color: #3b82f6;
      }
      .content {
        padding: 30px;
      }
      .section {
        margin-bottom: 40px;
      }
      .section h2 {
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 20px;
        color: #1f2937;
        padding-bottom: 10px;
        border-bottom: 3px solid #3b82f6;
      }
      .table-container {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      table {
        width: 100%;
        min-width: 600px;
        border-collapse: collapse;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      thead {
        background: #f3f4f6;
      }
      th {
        padding: 12px;
        text-align: left;
        font-weight: 600;
        font-size: 14px;
        color: #4b5563;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      th.center {
        text-align: center;
      }
      th.right {
        text-align: right;
      }
      td {
        font-size: 14px;
        color: #374151;
        word-wrap: break-word;
        max-width: 200px;
      }
      .footer {
        background: #f9fafb;
        padding: 20px 30px;
        text-align: center;
        color: #6b7280;
        font-size: 14px;
        border-top: 1px solid #e5e7eb;
      }
      .empty-message {
        text-align: center;
        padding: 40px;
        color: #9ca3af;
        font-style: italic;
      }
      @media print {
        body {
          background: white;
          padding: 0;
        }
        .container {
          box-shadow: none;
        }
      }
      @media (max-width: 768px) {
        body {
          padding: 10px;
        }
        .header h1 {
          font-size: 20px;
        }
        .header p {
          font-size: 14px;
        }
        .header {
          padding: 20px 15px;
        }
        .summary {
          grid-template-columns: 1fr;
          padding: 15px;
          gap: 12px;
        }
        .summary-card {
          padding: 15px;
        }
        .summary-card h3 {
          font-size: 12px;
        }
        .summary-card p {
          font-size: 20px;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .content {
          padding: 15px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h2 {
          font-size: 18px;
          margin-bottom: 15px;
        }
        .table-container {
          margin: 0 -15px;
          padding: 0 15px;
        }
        table {
          font-size: 11px;
          min-width: 500px;
        }
        th, td {
          padding: 6px;
          font-size: 10px;
        }
        td {
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .footer {
          padding: 15px;
          font-size: 12px;
        }
      }
      @media (max-width: 480px) {
        body {
          padding: 5px;
        }
        .container {
          border-radius: 8px;
        }
        .header h1 {
          font-size: 18px;
        }
        .header p {
          font-size: 13px;
        }
        .summary {
          padding: 10px;
          gap: 10px;
        }
        .summary-card {
          padding: 12px;
        }
        .summary-card p {
          font-size: 18px;
        }
        .content {
          padding: 10px;
        }
        table {
          font-size: 10px;
          min-width: 450px;
        }
        th, td {
          padding: 4px;
          font-size: 9px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        ${localStorage.getItem('empresa_nome') ? `<h2 style="font-size: 24px; font-weight: 500; margin-bottom: 5px; opacity: 0.9;">${localStorage.getItem('empresa_nome')}</h2>` : ''}
        <h1>Fechamento de Caixa</h1>
        <p>${fechamento.data} às ${fechamento.hora}</p>
      </div>
  
      <div class="summary">
        <div class="summary-card" style="border-left: 4px solid #3b82f6;">
          <h3>Abertura</h3>
          <p style="color: #3b82f6;">${formatCurrency(fechamento.valorAbertura)}</p>
        </div>
        <div class="summary-card vendas">
          <h3>Total de Vendas</h3>
          <p>${formatCurrency(fechamento.totalVendas)}</p>
        </div>
        <div class="summary-card retiradas">
          <h3>Total de Retiradas</h3>
          <p>${formatCurrency(fechamento.totalRetiradas)}</p>
        </div>
        <div class="summary-card" style="border-left: 4px solid #f59e0b;">
          <h3>Valor Esperado</h3>
          <p style="color: #f59e0b;">${formatCurrency(fechamento.saldoEsperado)}</p>
        </div>
        <div class="summary-card" style="border-left: 4px solid #8b5cf6;">
          <h3>Valor Contado</h3>
          <p style="color: #8b5cf6;">${formatCurrency(fechamento.valorContado)}</p>
        </div>
        <div class="summary-card" style="border-left: 4px solid ${fechamento.diferenca >= 0 ? '#10b981' : '#ef4444'};">
          <h3>Diferença</h3>
          <p style="color: ${fechamento.diferenca >= 0 ? '#10b981' : '#ef4444'};">${formatCurrency(fechamento.diferenca)}</p>
        </div>
      </div>
  
      <div class="content">
        <div class="section">
          <h2>Totais por Tipo de Pagamento</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
            <div style="padding: 15px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <span style="font-weight: 600; color: #374151; font-size: 14px;">PIX</span>
                <span style="font-size: 18px; font-weight: 700; color: #3b82f6; word-wrap: break-word; overflow-wrap: break-word;">${formatCurrency(totaisPorPagamento.PIX)}</span>
              </div>
            </div>
            <div style="padding: 15px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px;">
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <span style="font-weight: 600; color: #374151; font-size: 14px;">Dinheiro</span>
                <span style="font-size: 18px; font-weight: 700; color: #10b981; word-wrap: break-word; overflow-wrap: break-word;">${formatCurrency(totaisPorPagamento.Dinheiro)}</span>
              </div>
            </div>
            <div style="padding: 15px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px;">
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <span style="font-weight: 600; color: #374151; font-size: 14px;">Débito</span>
                <span style="font-size: 18px; font-weight: 700; color: #f59e0b; word-wrap: break-word; overflow-wrap: break-word;">${formatCurrency(totaisPorPagamento.Débito)}</span>
              </div>
            </div>
            <div style="padding: 15px; background: #f9fafb; border-left: 4px solid #6b7280; border-radius: 8px;">
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <span style="font-weight: 600; color: #374151; font-size: 14px;">Crédito</span>
                <span style="font-size: 18px; font-weight: 700; color: #6b7280; word-wrap: break-word; overflow-wrap: break-word;">${formatCurrency(totaisPorPagamento.Crédito)}</span>
              </div>
            </div>
          </div>
          <div style="padding: 20px; background: #f0fdfa; border-left: 4px solid #14b8a6; border-radius: 8px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: #1f2937; font-size: 16px;">Saldo em Caixa (Contado)</span>
              <span style="font-size: 24px; font-weight: 700; color: #14b8a6; word-wrap: break-word; overflow-wrap: break-word;">${formatCurrency(fechamento.valorContado)}</span>
            </div>
            ${fechamento.diferenca !== 0 ? `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
              <span style="font-weight: 600; color: #64748b; font-size: 14px;">Diferença</span>
              <span style="font-size: 18px; font-weight: 700; color: ${fechamento.diferenca >= 0 ? '#10b981' : '#ef4444'};">${formatCurrency(fechamento.diferenca)}</span>
            </div>
            ` : ''}
          </div>
        </div>
  
        <div class="section">
          <h2>Vendas do Dia (${fechamento.vendas.length})</h2>
          ${fechamento.vendas.length > 0
      ? `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Produto</th>
                  <th class="center">Qtd</th>
                  <th class="right">Preço Unit.</th>
                  <th class="right">Total</th>
                  <th>Pagamento</th>
                </tr>
              </thead>
              <tbody>
                ${vendasRows}
              </tbody>
            </table>
          </div>
          `
      : '<div class="empty-message">Nenhuma venda registrada</div>'
    }
        </div>
  
        <div class="section">
          <h2>Retiradas do Dia (${fechamento.retiradas.length})</h2>
          ${fechamento.retiradas.length > 0
      ? `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Descrição</th>
                  <th class="right">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${retiradasRows}
              </tbody>
            </table>
          </div>
          `
      : '<div class="empty-message">Nenhuma retirada registrada</div>'
    }
        </div>
      </div>
  
      <div class="footer">
        <p>Gerado pelo Livro Caixa Profissional</p>
      </div>
    </div>
  </body>
  </html>`;
}

// Generate Blob functions
export function generateHTMLBlob(fechamento: Fechamento): Blob {
  const html = generateFechamentoHTML(fechamento);
  return new Blob([html], { type: 'text/html' });
}

export function generatePDFBlob(fechamento: Fechamento): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Header
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setTextColor(255, 255, 255);

  const empresaNome = localStorage.getItem('empresa_nome');
  let currentYHeader = 15;

  if (empresaNome) {
    doc.setFontSize(14);
    doc.text(empresaNome, pageWidth / 2, currentYHeader, { align: 'center' });
    currentYHeader += 8;
  }

  doc.setFontSize(22);
  doc.text('Fechamento de Caixa', pageWidth / 2, currentYHeader + 5, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`${fechamento.data} às ${fechamento.hora}`, pageWidth / 2, currentYHeader + 15, { align: 'center' });

  let yPos = 50;

  // Summary Cards
  const margin = 14;
  const gap = 10;
  const availableWidth = pageWidth - (margin * 2);
  const cardWidth = (availableWidth - (gap * 2)) / 3; // 3 cards per row

  const cards = [
    { title: 'Abertura', value: fechamento.valorAbertura, color: [59, 130, 246] }, // Blue
    { title: 'Vendas', value: fechamento.totalVendas, color: [22, 163, 74] }, // Green
    { title: 'Retiradas', value: fechamento.totalRetiradas, color: [220, 38, 38] }, // Red
    { title: 'Valor Esperado', value: fechamento.saldoEsperado, color: [202, 138, 4] }, // Yellow
    { title: 'Valor Contado', value: fechamento.valorContado, color: [147, 51, 234] }, // Purple
    {
      title: 'Diferença',
      value: fechamento.diferenca,
      color: fechamento.diferenca >= 0 ? [22, 163, 74] : [220, 38, 38] // Green or Red
    },
  ];

  let xPos = margin;
  let currentY = yPos;

  cards.forEach((card, index) => {
    // New row after every 3 cards
    if (index > 0 && index % 3 === 0) {
      currentY += 35; // Height + Gap
      xPos = margin;
    }

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(xPos, currentY, cardWidth, 28, 2, 2, 'S');

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(card.title, xPos + 10, currentY + 10);

    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');

    // Fit text within card
    const valueText = formatCurrency(card.value);
    // basic check to reduce size if generic check fails or is tricky, 
    // but simplified:
    doc.text(valueText, xPos + 10, currentY + 22);

    xPos += cardWidth + gap;
  });

  yPos = currentY + 45;

  // Totais por Pagamento
  const totais = calcularTotaisPorFormaPagamento(fechamento);
  const paymentData = [
    ['Forma', 'Valor'],
    ['PIX', formatCurrency(totais.PIX)],
    ['Dinheiro', formatCurrency(totais.Dinheiro)],
    ['Débito', formatCurrency(totais.Débito)],
    ['Crédito', formatCurrency(totais.Crédito)],
  ];

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(14);
  doc.text('Totais por Tipo', margin, yPos - 5);

  autoTable(doc, {
    startY: yPos,
    head: [paymentData[0]],
    body: paymentData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: margin },
    tableWidth: pageWidth / 2 // Half width table
  });

  // Saldo em Caixa Highlight (Matching HTML structure)
  const boxX = (pageWidth / 2) + margin;
  const boxWidth = (pageWidth / 2) - (margin * 2);
  const boxY = yPos;

  doc.setFillColor(240, 253, 250); // Teal 50
  doc.setDrawColor(20, 184, 166); // Teal 500
  doc.roundedRect(boxX, boxY, boxWidth, 40, 2, 2, 'DF');

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(14);
  doc.text('Saldo em Caixa', boxX + 10, boxY + 15);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('(Contado)', boxX + 10, boxY + 22);

  doc.setTextColor(20, 184, 166);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(fechamento.valorContado), boxX + 10, boxY + 33);

  // Difference inside box if exists
  if (fechamento.diferenca !== 0) {
    doc.setFontSize(12);
    doc.setTextColor(fechamento.diferenca >= 0 ? 22 : 220, fechamento.diferenca >= 0 ? 163 : 38, fechamento.diferenca >= 0 ? 74 : 38);
    const difText = `Diferença: ${formatCurrency(fechamento.diferenca)}`;
    doc.text(difText, boxX + 10, boxY + 45); // Might need height adjustment if needed
    // But keeping it simple for now inside the box might be tight, let's just show main value big
  }

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Ensure yPos allows for the box if the table was short
  if (yPos < boxY + 50) {
    yPos = boxY + 50;
  }

  // Vendas Table
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text(`Vendas (${fechamento.vendas.length})`, margin, yPos);

  autoTable(doc, {
    startY: yPos + 5,
    head: [['Hora', 'Produto', 'Qtd', 'Total', 'Pag.']],
    body: fechamento.vendas.map(v => [
      v.hora,
      v.produto,
      v.quantidade,
      formatCurrency(v.total),
      v.formaPagamento
    ]),
    headStyles: { fillColor: [16, 185, 129] },
    columnStyles: {
      2: { halign: 'center' },
      3: { halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Retiradas Table
  if (fechamento.retiradas.length > 0) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text(`Retiradas (${fechamento.retiradas.length})`, 14, yPos);

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Hora', 'Descrição', 'Valor']],
      body: fechamento.retiradas.map(r => [
        r.hora,
        r.descricao,
        formatCurrency(r.valor)
      ]),
      headStyles: { fillColor: [239, 68, 68] },
      columnStyles: { 2: { halign: 'right', textColor: [239, 68, 68] } }
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Gerado pelo Livro Caixa Profissional', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
  }

  return doc.output('blob');
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareFile(file: File, title: string, text: string): Promise<boolean> {
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      return true;
    } catch (error) {
      if ((error as any).name !== 'AbortError') {
        console.warn('Error sharing file:', error);
      }
      return false;
    }
  }
  return false;
}

// Backward compatibility / Direct actions
export function downloadHTML(fechamento: Fechamento): void {
  const blob = generateHTMLBlob(fechamento);
  saveBlob(blob, `fechamento-${fechamento.data.replace(/\//g, '-')}.html`);
}

export function downloadPDF(fechamento: Fechamento): void {
  const blob = generatePDFBlob(fechamento);
  saveBlob(blob, `fechamento-${fechamento.data.replace(/\//g, '-')}.pdf`);
}

export function getWhatsAppText(fechamento: Fechamento): string {
  const totaisPorPagamento = calcularTotaisPorFormaPagamento(fechamento);
  const empresaNome = localStorage.getItem('empresa_nome');

  return `*Fechamento de Caixa - ${fechamento.data}*
${empresaNome ? `🏢 *${empresaNome}*\n` : ''}
🔵 Abertura: ${formatCurrency(fechamento.valorAbertura)}
💰 Total de Vendas: ${formatCurrency(fechamento.totalVendas)}
💸 Total de Retiradas: ${formatCurrency(fechamento.totalRetiradas)}
📊 Saldo Esperado: ${formatCurrency(fechamento.saldoEsperado)}
💵 Valor Contado: ${formatCurrency(fechamento.valorContado)}
${fechamento.diferenca >= 0 ? '✅' : '❌'} Diferença: ${formatCurrency(fechamento.diferenca)}

*Tipos de Pagamento:*
PIX: ${formatCurrency(totaisPorPagamento.PIX)}
Dinheiro: ${formatCurrency(totaisPorPagamento.Dinheiro)}
Débito: ${formatCurrency(totaisPorPagamento.Débito)}
Crédito: ${formatCurrency(totaisPorPagamento.Crédito)}

💼 Saldo em Caixa: ${formatCurrency(fechamento.valorAbertura + totaisPorPagamento.Dinheiro)}

${fechamento.vendas.length} vendas registradas
${fechamento.retiradas.length} retiradas registradas`;
}

export async function shareViaWhatsApp(fechamento: Fechamento): Promise<void> {
  const text = getWhatsAppText(fechamento);
  const encodedText = encodeURIComponent(text);

  // Detectar Mobile vs Desktop de forma mais robusta
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    window.open(`whatsapp://send?text=${encodedText}`, '_blank');
  } else {
    window.open(`https://web.whatsapp.com/send?text=${encodedText}`, '_blank');
  }
}

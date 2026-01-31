// Helper central para garantir fuso horário do Brasil
// Todas as datas e horas do sistema devem derivar daqui
export function getBrazilDateObj(): Date {
  const now = new Date();
  const brazilTimeStr = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  return new Date(brazilTimeStr);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromISODate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatBRDate(isoDate: string): string {
  try {
    const date = fromISODate(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoDate;
  }
}

export function toBRDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Retorna data atual no Brasil (YYYY-MM-DD)
export function getBrazilISODate(): string {
  const brazilDate = getBrazilDateObj();
  return toISODate(brazilDate);
}

// Retorna hora atual no Brasil (HH:mm)
export function getBrazilTime(): string {
  const brazilDate = getBrazilDateObj();
  const hours = String(brazilDate.getHours()).padStart(2, '0');
  const minutes = String(brazilDate.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}


export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  } catch (error) {
    console.error('Erro em formatDate:', error);
    const d = new Date();
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }
}

export function formatTime(date: Date): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.error('Erro em formatTime:', error);
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
}

export function formatDateTime(date: Date): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.error('Erro em formatDateTime:', error);
    return `${formatDate(date)} ${formatTime(date)}`;
  }
}

export function getCurrentDate(): string {
  try {
    return formatDate(new Date());
  } catch (error) {
    console.error('Erro em getCurrentDate:', error);
    const d = new Date();
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }
}

export function getCurrentTime(): string {
  try {
    return formatTime(new Date());
  } catch (error) {
    console.error('Erro em getCurrentTime:', error);
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
}

export function isSameDay(date1: string, date2: string): boolean {
  try {
    return date1 === date2;
  } catch (error) {
    console.error('Erro em isSameDay:', error);
    return false;
  }
}

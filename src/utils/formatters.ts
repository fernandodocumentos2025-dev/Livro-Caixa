export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo'
    }).format(date);
  } catch (error) {
    console.error('Erro em formatDate:', error);
    const d = new Date();
    return d.toLocaleDateString('pt-BR');
  }
}

export function formatTime(date: Date): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }).format(date);
  } catch (error) {
    console.error('Erro em formatTime:', error);
    const d = new Date();
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
      timeZone: 'America/Sao_Paulo'
    }).format(date);
  } catch (error) {
    console.error('Erro em formatDateTime:', error);
    return `${formatDate(date)} ${formatTime(date)}`;
  }
}

export function getCurrentDate(): string {
  return formatDate(new Date());
}

export function getCurrentTime(): string {
  return formatTime(new Date());
}

export function isSameDay(date1: string, date2: string): boolean {
  try {
    return date1 === date2;
  } catch (error) {
    console.error('Erro em isSameDay:', error);
    return false;
  }
}

export function isValidNumber(value: unknown): boolean {
  if (typeof value === 'number') {
    return !isNaN(value) && isFinite(value);
  }
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
  }
  return false;
}

export function isValidPositiveNumber(value: unknown): boolean {
  return isValidNumber(value) && parseFloat(String(value)) > 0;
}

export function isValidDate(date: string): boolean {
  const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!datePattern.test(date)) return false;

  const [day, month, year] = date.split('/').map(Number);
  const dateObj = new Date(year, month - 1, day);

  return dateObj.getDate() === day &&
         dateObj.getMonth() === month - 1 &&
         dateObj.getFullYear() === year;
}

export function isValidISODate(date: string): boolean {
  const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
  return isoPattern.test(date);
}

export function sanitizeString(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

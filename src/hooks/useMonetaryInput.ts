import { useState, useCallback } from 'react';

interface UseMonetaryInputReturn {
  displayValue: string;
  numericValue: number;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
  setValue: (value: number) => void;
  reset: () => void;
}

export function useMonetaryInput(initialValue: number = 0): UseMonetaryInputReturn {
  const [displayValue, setDisplayValue] = useState(formatForDisplay(initialValue));
  const [numericValue, setNumericValue] = useState(initialValue);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    value = value.replace(/[^\d,]/g, '');

    const parts = value.split(',');
    if (parts.length > 2) {
      value = parts[0] + ',' + parts.slice(1).join('');
    }

    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + ',' + parts[1].substring(0, 2);
    }

    setDisplayValue(value);

    const numeric = parseNumericValue(value);
    setNumericValue(numeric);
  }, []);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (numericValue === 0 || displayValue === '0,00') {
      setDisplayValue('');
    }
    e.target.select();
  }, [numericValue, displayValue]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || value === '0' || value === ',') {
      setDisplayValue('0,00');
      setNumericValue(0);
    } else {
      const numeric = parseNumericValue(value);
      setNumericValue(numeric);
      setDisplayValue(formatForDisplay(numeric));
    }
  }, []);

  const setValue = useCallback((value: number) => {
    setNumericValue(value);
    setDisplayValue(formatForDisplay(value));
  }, []);

  const reset = useCallback(() => {
    setNumericValue(0);
    setDisplayValue('0,00');
  }, []);

  return {
    displayValue,
    numericValue,
    handleChange,
    handleFocus,
    handleBlur,
    setValue,
    reset,
  };
}

function parseNumericValue(value: string): number {
  if (!value || value === ',') return 0;

  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  const numeric = parseFloat(cleanValue);

  return isNaN(numeric) ? 0 : numeric;
}

function formatForDisplay(value: number): string {
  if (value === 0) return '0,00';

  return value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

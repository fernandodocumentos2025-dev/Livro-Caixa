import { useEffect } from 'react';

export function useAppReady() {
  useEffect(() => {
    try {
      if (typeof localStorage === 'undefined') {
        console.warn('localStorage indisponível');
      }
    } catch (error) {
      console.error('Erro ao verificar localStorage:', error);
    }
  }, []);

  return true;
}

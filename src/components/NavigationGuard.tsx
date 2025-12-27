import { ReactNode } from 'react';
import { useAppReady } from '../hooks/useAppReady';

interface NavigationGuardProps {
  children: ReactNode;
}

export default function NavigationGuard({ children }: NavigationGuardProps) {
  useAppReady();
  return <>{children}</>;
}

import { ReactNode } from 'react';

interface SafeTextProps {
  children: ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export default function SafeText({ children, className = '', as: Component = 'span' }: SafeTextProps) {
  const safeChildren = typeof children === 'string'
    ? children.trim()
    : children;

  return <Component className={className}>{safeChildren}</Component>;
}

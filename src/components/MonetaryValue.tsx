import { formatCurrency } from '../utils/formatters';

interface MonetaryValueProps {
  value: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'text-sm sm:text-base',
  md: 'text-base sm:text-lg',
  lg: 'text-lg sm:text-xl',
  xl: 'text-xl sm:text-2xl',
};

export default function MonetaryValue({ value, className = '', size = 'md' }: MonetaryValueProps) {
  return (
    <span
      className={`${sizeClasses[size]} font-bold break-words ${className}`}
      style={{
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        hyphens: 'auto'
      }}
    >
      {formatCurrency(value)}
    </span>
  );
}

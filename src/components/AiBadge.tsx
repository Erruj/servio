import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiBadgeProps {
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Kleine chip die markeert dat content door AI is gegenereerd.
 * Gebruik boven of naast AI-antwoorden, samenvattingen en aanbevelingen
 * zodat gebruikers direct zien wat door Servio is opgesteld en wat niet.
 */
export const AiBadge = ({ label = 'AI', className, size = 'sm' }: AiBadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        'bg-primary/10 text-primary border border-primary/20',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      <Sparkles className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      {label}
    </span>
  );
};

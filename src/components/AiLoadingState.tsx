import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiLoadingStateProps {
  label?: string;
  sublabel?: string;
  className?: string;
  variant?: 'inline' | 'block';
}

/**
 * Geruststellende laadstatus voor AI-acties.
 * Geen kale spinner: pictogram + duidelijk NL label + subtiele pulse.
 */
export const AiLoadingState = ({
  label = 'Servio denkt na…',
  sublabel,
  className,
  variant = 'block',
}: AiLoadingStateProps) => {
  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 text-sm text-muted-foreground',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-10 px-6',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative w-12 h-12 flex items-center justify-center mb-3">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
        <Sparkles className="h-6 w-6 text-primary relative z-10" />
      </div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {sublabel && (
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{sublabel}</p>
      )}
    </div>
  );
};

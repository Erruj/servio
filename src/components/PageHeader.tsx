import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Uniforme paginakop: consistente typografie en spacing over alle
 * administratie/statistieken/dashboard pagina's. Primaire actie rechts.
 */
export const PageHeader = ({ title, description, actions, className }: PageHeaderProps) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex w-full sm:w-auto items-center gap-2 flex-shrink-0 [&>*]:flex-1 [&>*]:min-w-0 sm:[&>*]:flex-none">{actions}</div>}
    </div>
  );
};

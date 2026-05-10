import { useEffect, useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  /** Unique key for this tooltip — used to persist seen state in localStorage */
  tipKey: string;
  /** Short explanatory text */
  text: string;
  /** Optional title shown bold above the text */
  title?: string;
  className?: string;
  /** Auto-open on first ever render (until dismissed). Default: true */
  autoShowOnFirstView?: boolean;
}

const STORAGE_PREFIX = 'servio_helptip_seen_';

/**
 * A small `?` icon that opens a popover with a short explanation.
 * Persists "seen" state in localStorage so it auto-opens only on first encounter.
 */
export function HelpTooltip({
  tipKey,
  text,
  title,
  className,
  autoShowOnFirstView = true,
}: HelpTooltipProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!autoShowOnFirstView) return;
    try {
      const seen = localStorage.getItem(STORAGE_PREFIX + tipKey);
      if (!seen) {
        // Tiny delay so popover anchors after layout
        const t = setTimeout(() => setOpen(true), 400);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [tipKey, autoShowOnFirstView]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      try {
        localStorage.setItem(STORAGE_PREFIX + tipKey, '1');
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Meer informatie"
          className={cn(
            'inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors',
            className,
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-64 text-xs leading-relaxed">
        {title && <div className="font-semibold mb-1 text-foreground">{title}</div>}
        <div className="text-muted-foreground">{text}</div>
      </PopoverContent>
    </Popover>
  );
}

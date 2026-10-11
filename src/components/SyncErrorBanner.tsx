import { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { EmailConnection } from '@/hooks/useEmailConnections';

interface SyncErrorBannerProps {
  connections: EmailConnection[];
  className?: string;
  /** Start direct een nieuwe synchronisatie; zonder deze prop gaat de knop naar Mailbox-instellingen. */
  onRetry?: () => Promise<unknown> | void;
}

/**
 * Gele waarschuwing wanneer een actieve mailbox een sync_error heeft
 * (o.a. gezet door de bewaking als een mailbox >60 min niet is bijgewerkt).
 */
export function SyncErrorBanner({ connections, className, onRetry }: SyncErrorBannerProps) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const broken = connections.filter((c) => c.is_active && c.sync_error);
  if (broken.length === 0) return null;

  const handleRetry = async () => {
    if (!onRetry) return navigate('/mailbox-setup');
    setBusy(true);
    try { await onRetry(); } finally { setBusy(false); }
  };

  return (
    <div
      role="alert"
      className={`border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-3 ${className ?? ''}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
          <div className="space-y-1">
            {broken.map((c) => (
              <p key={c.id} className="text-foreground">
                We konden je mailbox <span className="font-medium">{c.email_address}</span> sinds{' '}
                {c.last_sync_at ? new Date(c.last_sync_at).toLocaleString('nl-NL') : 'het koppelen'} niet bijwerken.
                <span className="block text-muted-foreground">{c.sync_error}</span>
              </p>
            ))}
          </div>
        </div>
        <Button size="sm" variant="outline" className="min-h-[44px] shrink-0 gap-2" onClick={handleRetry} disabled={busy}>
          <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
          Opnieuw proberen
        </Button>
      </div>
    </div>
  );
}

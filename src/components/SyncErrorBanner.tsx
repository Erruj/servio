import { AlertTriangle, Link2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { EmailConnection } from '@/hooks/useEmailConnections';

interface SyncErrorBannerProps {
  connections: EmailConnection[];
  className?: string;
}

/**
 * Toont een duidelijke waarschuwing wanneer een mailbox-koppeling een sync_error heeft,
 * zodat een stil falende synchronisatie niet onopgemerkt blijft.
 */
export function SyncErrorBanner({ connections, className }: SyncErrorBannerProps) {
  const navigate = useNavigate();
  // Alleen actieve koppelingen met een echte sync-fout zijn "kapot".
  // Bewust ontkoppelde mailboxen (is_active = false) zijn geen storing.
  const broken = connections.filter((c) => c.is_active && c.sync_error);

  if (broken.length === 0) return null;

  return (
    <div
      role="alert"
      className={`border-b border-destructive/30 bg-destructive/10 px-4 py-3 ${className ?? ''}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="space-y-1">
            <p className="font-medium text-destructive">
              {broken.length === 1
                ? 'Een mailbox synchroniseert niet meer'
                : `${broken.length} mailboxen synchroniseren niet meer`}
            </p>
            {broken.map((c) => (
              <p key={c.id} className="text-muted-foreground">
                <span className="font-medium text-foreground">{c.email_address}</span>
                {' — '}
                {c.sync_error || 'De koppeling is niet meer actief.'}
                {c.last_sync_at && (
                  <span className="ml-1">
                    (laatst gelukt: {new Date(c.last_sync_at).toLocaleString('nl-NL')})
                  </span>
                )}
              </p>
            ))}
          </div>
        </div>
        <Button
          size="sm"
          variant="destructive"
          className="shrink-0 gap-2"
          onClick={() => navigate('/mailbox-setup')}
        >
          <Link2 className="h-4 w-4" />
          Opnieuw koppelen
        </Button>
      </div>
    </div>
  );
}

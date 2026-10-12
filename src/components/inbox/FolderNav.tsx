import { useTranslation } from 'react-i18next';
import { Inbox, Star, FileText, Send, Archive, ShieldAlert, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FolderCounts, MailView } from '@/hooks/useEmailConnections';

export const MAIL_VIEWS: { id: MailView; icon: typeof Inbox }[] = [
  { id: 'inbox', icon: Inbox },
  { id: 'starred', icon: Star },
  { id: 'drafts', icon: FileText },
  { id: 'sent', icon: Send },
  { id: 'archive', icon: Archive },
  { id: 'spam', icon: ShieldAlert },
  { id: 'trash', icon: Trash2 },
];

interface Props {
  view: MailView;
  counts: FolderCounts | null;
  onChange: (v: MailView) => void;
}

/** Smalle mappenkolom (desktop). */
export function FolderNav({ view, counts, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('mailFolders.label')} className="w-[184px] min-w-[184px] border-r border-border/60 bg-card p-2 space-y-0.5 overflow-y-auto">
      {MAIL_VIEWS.map(({ id, icon: Icon }) => {
        const active = id === view;
        const n = counts?.[id] ?? 0;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'w-full min-h-11 flex items-center gap-2.5 px-3 rounded-[10px] text-[13px] transition-colors duration-200',
              active ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground/80 hover:bg-secondary/60',
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left truncate">{t(`mailFolders.${id}`)}</span>
            {n > 0 && (
              <span className={cn('text-[11px] tabular-nums rounded-full px-1.5 min-w-[1.25rem] text-center', active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground')}>
                {n > 999 ? '999+' : n}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

/** Keuzelijst bovenaan (mobiel). */
export function FolderSelect({ view, counts, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="px-3 pt-3">
      <select
        aria-label={t('mailFolders.label')}
        value={view}
        onChange={(e) => onChange(e.target.value as MailView)}
        className="h-11 w-full rounded-[10px] border border-input bg-background px-3 text-sm text-foreground"
      >
        {MAIL_VIEWS.map(({ id }) => {
          const n = counts?.[id] ?? 0;
          return <option key={id} value={id}>{t(`mailFolders.${id}`)}{n > 0 ? ` (${n})` : ''}</option>;
        })}
      </select>
    </div>
  );
}

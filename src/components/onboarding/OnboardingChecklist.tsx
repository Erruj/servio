import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Circle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  href?: string;
}

const DISMISS_KEY = 'servio_checklist_dismissed';

export function OnboardingChecklist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try { setDismissed(localStorage.getItem(DISMISS_KEY) === '1'); } catch {}
  }, []);

  useEffect(() => {
    if (!user || dismissed) return;
    let cancelled = false;
    (async () => {
      // Eén gebundelde RPC in plaats van losse count-requests per tabel
      const { data, error } = await supabase.rpc('get_onboarding_status');
      if (cancelled || error || !data) return;
      const status = data as {
        connections?: number;
        read_emails?: number;
        invoices?: number;
        has_company?: boolean;
      };
      setItems([
        { key: 'account', label: 'Account aangemaakt', done: true },
        { key: 'mailbox', label: 'Mailbox gekoppeld', done: (status.connections || 0) > 0, href: '/mailbox-setup' },
        { key: 'reply', label: 'Eerste email beantwoord', done: (status.read_emails || 0) > 0, href: '/app' },
        { key: 'invoice', label: 'Eerste factuur geüpload', done: (status.invoices || 0) > 0, href: '/administration/invoices' },
        { key: 'profile', label: 'Profiel ingevuld', done: !!status.has_company, href: '/profile' },
      ]);
    })();
    return () => { cancelled = true; };
  }, [user, dismissed]);

  if (dismissed || items.length === 0) return null;

  const done = items.filter(i => i.done).length;
  const allDone = done === items.length;

  if (allDone) {
    return (
      <div className="mx-3 mb-3 p-3 rounded-lg bg-success/10 border border-success/20 text-center">
        <div className="text-xs font-semibold text-success">🎉 Setup voltooid!</div>
        <button
          onClick={() => { try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}; setDismissed(true); }}
          className="text-[10px] text-muted-foreground hover:text-foreground mt-1"
        >
          Verbergen
        </button>
      </div>
    );
  }

  return (
    <div className="mx-3 mb-3 p-3 rounded-lg bg-muted/40 border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">Aan de slag</span>
        <span className="text-[10px] text-muted-foreground">{done}/{items.length} voltooid</span>
      </div>
      <Progress value={(done / items.length) * 100} className="h-1 mb-2" />
      <ul className="space-y-1">
        {items.map(item => (
          <li key={item.key}>
            <button
              type="button"
              disabled={item.done}
              onClick={() => item.href && navigate(item.href)}
              className={`w-full flex items-center gap-2 text-xs text-left rounded px-1 py-0.5 ${
                item.done ? 'text-muted-foreground line-through' : 'text-foreground hover:bg-background cursor-pointer'
              }`}
            >
              {item.done
                ? <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
                : <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
              <span className="truncate">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

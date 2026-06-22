import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

interface AiNotification {
  id: string;
  type: string;
  message: string;
  action_url: string | null;
  severity: string;
  read: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AiNotification[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('ai_notifications' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setItems((data as any) ?? []);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel('ai_notifications_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_notifications', filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const unread = items.filter((i) => !i.read).length;
  const badge = unread > 9 ? '9+' : String(unread);

  const handleClick = async (n: AiNotification) => {
    if (!n.read) {
      await supabase.from('ai_notifications' as any).update({ read: true }).eq('id', n.id);
      setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, read: true } : p)));
    }
    if (n.action_url) {
      setOpen(false);
      navigate(n.action_url);
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('ai_notifications' as any).update({ read: true }).eq('user_id', user.id).eq('read', false);
    setItems((prev) => prev.map((p) => ({ ...p, read: true })));
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative" aria-label="Notificaties">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
              {badge}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-semibold">Meldingen</span>
          {unread > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Alles als gelezen
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Geen nieuwe meldingen 🎉
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className={`px-3 py-3 border-b last:border-b-0 hover:bg-accent ${!n.read ? 'bg-accent/40' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                      n.severity === 'urgent'
                        ? 'bg-red-500'
                        : n.severity === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{n.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: nl })}
                      </span>
                      {n.action_url && (
                        <Button size="sm" variant="link" className="h-auto p-0 text-xs" onClick={() => handleClick(n)}>
                          Bekijken
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { inboxCommand, type InboxCommand } from '@/lib/inbox-controls';
const subscribe = (listener: () => void) => {
  window.addEventListener('storage', listener);
  window.addEventListener('servio-mail-shortcuts', listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener('servio-mail-shortcuts', listener); };
};
export function useMailShortcutPrefs() {
  const { user } = useAuth();
  const key = user ? `servio-mail-shortcuts:${user.id}` : null;
  const enabled = useSyncExternalStore(subscribe, () => {
    if (!key) return false;
    try { return localStorage.getItem(key) !== 'off'; } catch { return true; }
  }, () => false);
  const setEnabled = (value: boolean) => {
    if (!key) return;
    localStorage.setItem(key, value ? 'on' : 'off');
    window.dispatchEvent(new Event('servio-mail-shortcuts'));
  };
  return { enabled, setEnabled };
}
export function useInboxShortcuts(enabled: boolean, blocked: boolean, onCommand: (command: InboxCommand) => void) {
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const editing = !!target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"]');
      const command = inboxCommand(event, enabled, blocked || editing || !!document.querySelector('[data-mail-composer], [role="dialog"], [role="menu"]'));
      if (!command || event.repeat || event.isComposing) return;
      event.preventDefault();
      onCommand(command);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [enabled, blocked, onCommand]);
}
export type BulkMailAction = 'archive' | 'trash' | 'read' | 'unread' | 'star' | 'label' | 'inbox' | 'spam';
export const INBOX_KEYS = {
  j: 'next', k: 'previous', Enter: 'open', u: 'back', r: 'reply', a: 'replyAll',
  f: 'forward', c: 'new', e: 'archive', '#': 'trash', s: 'star', U: 'unread',
  '/': 'search', '?': 'help',
} as const;
export type InboxCommand = typeof INBOX_KEYS[keyof typeof INBOX_KEYS];
export function inboxCommand(event: {key: string; shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; altKey: boolean}, enabled: boolean, blocked: boolean): InboxCommand | undefined {
  if (!enabled || blocked || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key === '#' || event.key === '?' || event.key === 'Enter' || event.key === '/') return INBOX_KEYS[event.key];
  if (event.shiftKey) return event.key.toLowerCase() === 'u' ? 'unread' : undefined;
  return INBOX_KEYS[event.key as keyof typeof INBOX_KEYS];
}
export function selectMailRange(selected: ReadonlySet<string>, ids: string[], id: string, anchor: string | null, shift: boolean): Set<string> {
  const next = new Set(selected);
  const start = anchor ? ids.indexOf(anchor) : -1;
  const end = ids.indexOf(id);
  if (end < 0) return next;
  if (shift && start >= 0) {
    ids.slice(Math.min(start, end), Math.max(start, end) + 1).forEach(value => next.add(value));
  } else if (next.has(id)) next.delete(id); else next.add(id);
  return next;
}
export function currentSelection(selected: ReadonlySet<string>, ids: string[]) {
  return ids.filter(id => selected.has(id));
}
export async function runBulkMailAction(ids: string[], action: (id: string) => Promise<unknown>) {
  const results = await Promise.allSettled(ids.map(action));
  return { succeeded: ids.filter((_, index) => results[index].status === 'fulfilled'), failed: ids.filter((_, index) => results[index].status === 'rejected') };
}
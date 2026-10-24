export type SnoozePreset = 'today' | 'tomorrow' | 'week';
export const FOLLOW_UP_DAYS = [2, 3, 7] as const;
export function snoozePreset(kind: SnoozePreset, now = new Date()) {
  const date = new Date(now);
  date.setSeconds(0, 0);
  if (kind === 'today') {
    date.setHours(18, 0, 0, 0);
    return date > now ? date : null;
  }
  date.setDate(date.getDate() + (kind === 'tomorrow' ? 1 : ((8 - date.getDay()) % 7 || 7)));
  date.setHours(8, 0, 0, 0);
  return date;
}
export function mailInboxOrder(a: { inbox_returned_at?: string | null; received_at: string }, b: { inbox_returned_at?: string | null; received_at: string }) {
  return new Date(b.inbox_returned_at || b.received_at).getTime() - new Date(a.inbox_returned_at || a.received_at).getTime();
}
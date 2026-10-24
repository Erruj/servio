// @ts-ignore Bun tests
import { test, expect } from 'bun:test';
import { snoozePreset, FOLLOW_UP_DAYS, mailInboxOrder } from './mail-reminders';
test('later today is 18:00',()=>expect(snoozePreset('today',new Date(2026,9,24,10))?.getHours()).toBe(18));
test('today after 18:00 is unavailable rather than past',()=>expect(snoozePreset('today',new Date(2026,9,24,20))).toBeNull());
test('tomorrow is next day at 08:00',()=>expect(snoozePreset('tomorrow',new Date(2026,9,24,20))).toEqual(new Date(2026,9,25,8)));
test('next week is Monday 08:00 including a Monday request',()=>expect(snoozePreset('week',new Date(2026,9,26,7))).toEqual(new Date(2026,10,2,8)));
test('follow-up choices are exactly 2,3,7 days',()=>expect([...FOLLOW_UP_DAYS]).toEqual([2,3,7]));
test('returned old mail sorts above newer original mail',()=>expect(mailInboxOrder({received_at:'2026-10-01',inbox_returned_at:'2026-10-24T18:00:00Z'},{received_at:'2026-10-24T17:00:00Z'})).toBeLessThan(0));
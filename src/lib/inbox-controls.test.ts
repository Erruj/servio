// @ts-ignore Bun tests
import { test, expect } from 'bun:test';
import { INBOX_KEYS, inboxCommand, selectMailRange, currentSelection, runBulkMailAction } from './inbox-controls';
const event = (key: string, shiftKey = false) => ({ key, shiftKey, ctrlKey: false, metaKey: false, altKey: false });
for (const [key, command] of Object.entries(INBOX_KEYS)) test(`shortcut ${key} runs ${command}`, () => expect(inboxCommand(event(key, ['U','#','?'].includes(key)), true, false)).toBe(command));
test('Shift+u works with lowercase event keys', () => expect(inboxCommand(event('u', true), true, false)).toBe('unread'));
test('disabled shortcuts do nothing', () => expect(inboxCommand(event('e'), false, false)).toBeUndefined());
test('typing and open composer block shortcuts', () => expect(inboxCommand(event('e'), true, true)).toBeUndefined());
test('browser modifier shortcuts are not intercepted', () => expect(inboxCommand({...event('r'), ctrlKey: true}, true, false)).toBeUndefined());
test('shift click selects five mails in display order', () => expect([...selectMailRange(new Set(['1']), ['1','2','3','4','5','6'], '5', '1', true)]).toEqual(['1','2','3','4','5']));
test('reverse shift range is inclusive', () => expect([...selectMailRange(new Set(), ['1','2','3','4','5'], '2', '5', true)]).toEqual(['2','3','4','5']));
test('current view excludes hidden selected messages', () => expect(currentSelection(new Set(['1','2','3']), ['2','4'])).toEqual(['2']));
test('bulk archive calls the same action for all five mails', async () => {
  const calls: string[] = []; const ids = ['1','2','3','4','5'];
  const result = await runBulkMailAction(ids, async id => { calls.push(id); });
  expect(calls).toEqual(ids); expect(result.succeeded).toEqual(ids); expect(result.failed).toEqual([]);
});
test('partial bulk failure preserves failed ids for retry', async () => {
  const result = await runBulkMailAction(['1','2'], async id => { if (id === '2') throw new Error('mailbox'); });
  expect(result).toEqual({succeeded:['1'], failed:['2']});
});
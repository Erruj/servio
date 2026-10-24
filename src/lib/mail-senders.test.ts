// @ts-ignore Bun tests
import { describe, expect, test } from 'bun:test';
import { senderAddress, legacyBlockedSenders, unsubscribeLinks } from './mail-senders';
describe('sender preferences', () => {
  test('blocks an exact normalized sender, not a display name', () => {
    expect(senderAddress('Capterra <Newsletter@Capterra.com>')).toBe('newsletter@capterra.com');
    expect(senderAddress('Capterra')).toBeNull();
  });
  test('imports legacy addresses once without duplicates or invalid entries', () => {
    expect(legacyBlockedSenders('["NEWS@EXAMPLE.COM","news@example.com","Display name",null]')).toEqual(['news@example.com']);
    expect(legacyBlockedSenders('not-json')).toEqual([]);
  });
  test('supports HTTPS and mailto unsubscribe but never script or HTTP links', () => {
    expect(unsubscribeLinks('<javascript:alert(1)>, <http://example.com>, <https://news.example.com/unsubscribe?id=123>, <mailto:unsubscribe@example.com?subject=remove>')).toEqual({https:'https://news.example.com/unsubscribe?id=123',mailto:'mailto:unsubscribe@example.com?subject=remove'});
  });
});
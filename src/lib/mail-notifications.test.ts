// @ts-nocheck -- Bun test runner types are separate from the app.
import {test,expect} from 'bun:test';
import {shouldNotify} from './mail-notifications';
import {vacationEligible,vacationCooldownPassed,suppressAutomaticReply} from '../../supabase/functions/_shared/vacation-rules';
test('urgent mode notifies high urgency',()=>expect(shouldNotify('urgent','high')).toBe(true));
test('urgent mode skips normal mail',()=>expect(shouldNotify('urgent','normal')).toBe(false));
test('all mode includes normal mail',()=>expect(shouldNotify('all','normal')).toBe(true));
test('off mode never notifies',()=>expect(shouldNotify('off','high')).toBe(false));
test('same sender cannot receive second reply within four days',()=>expect(vacationCooldownPassed('2026-10-01T08:00:00Z',Date.parse('2026-10-05T07:59:59Z'))).toBe(false));
test('four days allows a new reply',()=>expect(vacationCooldownPassed('2026-10-01T08:00:00Z',Date.parse('2026-10-05T08:00:00Z'))).toBe(true));
test('normal correspondent is eligible',()=>expect(vacationEligible({from_email:'client@example.com'},[])).toBe(true));
test('newsletter excluded',()=>expect(vacationEligible({from_email:'client@example.com',ai_category:'newsletter'},[])).toBe(false));
test('noreply excluded',()=>expect(vacationEligible({from_email:'no-reply@example.com'},[])).toBe(false));
test('unsubscribe excluded',()=>expect(vacationEligible({from_email:'client@example.com',list_unsubscribe:'<https://example.com/unsubscribe>'},[])).toBe(false));
test('automatic reply loop excluded',()=>expect(suppressAutomaticReply([{name:'Auto-Submitted',value:'auto-replied'}])).toBe(true));
test('bulk newsletter excluded without unsubscribe',()=>expect(suppressAutomaticReply([{name:'Precedence',value:'bulk'}])).toBe(true));

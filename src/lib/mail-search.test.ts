// @ts-ignore Bun tests
import {test,expect} from 'bun:test';
import {parseMailSearch,initiallyOpenMessageIds} from './mail-search';
test('Capterra attachment operator combination',()=>expect(parseMailSearch('from:capterra has:attachment')).toEqual({from:['capterra'],attachment:true}));
test('unread before October 10',()=>expect(parseMailSearch('is:unread before:2026-10-10')).toEqual({unread:true,before:'2026-10-10'}));
test('all operators combine with phrases',()=>expect(parseMailSearch('budget to:jurre subject:"Nieuwe offerte" is:starred label:Klant in:sent after:2026-10-01')).toEqual({words:'budget',to:['jurre'],subject:['Nieuwe offerte'],starred:true,label:['Klant'],in:'sent',after:'2026-10-01'}));
test('invalid dates fail',()=>expect(()=>parseMailSearch('before:2026-02-30')).toThrow());
test('four messages leave three collapsed',()=>expect(initiallyOpenMessageIds([1,4,2,3].map(n=>({id:String(n),receivedAt:`2026-10-0${n}T12:00:00Z`})))).toEqual(['4']));
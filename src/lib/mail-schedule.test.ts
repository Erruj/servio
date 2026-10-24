// @ts-ignore Bun tests
import {test,expect} from 'bun:test';
import {DEFAULT_UNDO_SECONDS,UNDO_OPTIONS,schedulePreset,deliveryDue} from './mail-schedule';
test('default undo delays delivery eight seconds',()=>{expect(DEFAULT_UNDO_SECONDS).toBe(8);const due=new Date(8000).toISOString();expect(deliveryDue(due,7999)).toBe(false);expect(deliveryDue(due,8000)).toBe(true);});
test('settings offer 5/10/20/30 seconds',()=>expect([...UNDO_OPTIONS]).toEqual([5,10,20,30]));
test('tomorrow is local 08:00',()=>{const date=schedulePreset('tomorrow',new Date(2026,9,24,19,58));expect([date.getDate(),date.getHours(),date.getMinutes()]).toEqual([25,8,0]);});
test('Monday is next Monday local 08:00',()=>{const date=schedulePreset('monday',new Date(2026,9,24,19,58));expect([date.getDay(),date.getDate(),date.getHours()]).toEqual([1,26,8]);});

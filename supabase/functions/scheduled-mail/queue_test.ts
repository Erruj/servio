import {assertEquals} from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {mayDeliver,undoOpen} from '../_shared/mail-send/queue.ts';
Deno.test('undo within eight seconds prevents delivery after restoring draft',()=>{
 const until=new Date(8000).toISOString();assertEquals(undoOpen(until,7999),true);assertEquals(undoOpen(until,8000),false);
 assertEquals(mayDeliver({folder:'drafts',send_status:'draft',send_at:null},9000),false);
});
Deno.test('scheduled mail is due on its minute, never before',()=>{
 const row={folder:'scheduled',send_status:'queued',send_at:'2026-10-26T08:00:00Z'};
 assertEquals(mayDeliver(row,Date.parse('2026-10-26T07:59:59Z')),false);
 assertEquals(mayDeliver(row,Date.parse('2026-10-26T08:00:00Z')),true);
});
Deno.test('already claimed or uncertain mail cannot be delivered again',()=>{
 for(const send_status of ['sending','uncertain','sent','failed'])assertEquals(mayDeliver({folder:'scheduled',send_status,send_at:new Date(0).toISOString()},9000),false);
});

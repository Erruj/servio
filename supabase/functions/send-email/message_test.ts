import { assertEquals, assertThrows } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { SendSchema, replyHeaders, assertAttachments, selectOriginals, MAX_BYTES } from "./message.ts";
Deno.test('reply headers preserve original Message-ID and References',()=>{
  assertEquals(replyHeaders({message_id:'original@example.nl',reference_ids:['<first@example.nl>']},'replyAll'),{inReplyTo:'<original@example.nl>',references:['<first@example.nl>','<original@example.nl>']});
  assertEquals(replyHeaders({message_id:'original@example.nl'},'forward'),{});
});
Deno.test('all recipients and CC/BCC are parsed separately',()=>{
  const value=SendSchema.parse({to:'a@example.nl, b@example.nl',cc:'c@example.nl',bcc:'d@example.nl',subject:'Test',body:'Test'});
  assertEquals(value.to,['a@example.nl','b@example.nl']);assertEquals(value.cc,['c@example.nl']);assertEquals(value.bcc,['d@example.nl']);
});
Deno.test('attachments allow 20 MB combined but reject an extra byte',()=>{
  const base64=(bytes:number)=>btoa('a'.repeat(bytes));
  assertEquals(assertAttachments([{content:base64(MAX_BYTES)}]),MAX_BYTES);
  assertThrows(()=>assertAttachments([{content:base64(MAX_BYTES)},{content:'YQ=='}]),Error,'attachment_size');
});
Deno.test('forward includes the selected original PDF and rejects missing attachments',()=>{
  const pdf={id:'pdf-1',filename:'offerte.pdf',content:'JVBERg=='};
  assertEquals(selectOriginals([pdf,{id:'other'}],['pdf-1']),[pdf]);
  assertThrows(()=>selectOriginals([pdf],['missing']),Error,'attachment_missing');
});
Deno.test('headers cannot be injected through subject or recipients',()=>{
  assertEquals(SendSchema.safeParse({to:'a@example.nl\r\nBcc: victim@example.nl',subject:'Hello',body:'test'}).success,false);
  assertEquals(SendSchema.safeParse({to:'a@example.nl',subject:'Hello\r\nBcc: victim@example.nl',body:'test'}).success,false);
});

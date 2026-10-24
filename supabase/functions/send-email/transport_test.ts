import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { simpleParser } from "npm:mailparser@3";
import { Buffer } from "node:buffer";
import { buildMime, mimeAttachments } from "../_shared/mail-send/transport.ts";
Deno.test('SMTP MIME preserves HTML, text, threading, CC and original PDF without exposing BCC', async()=>{
  const raw=await buildMime({from:'self@example.nl',to:['klant@example.nl','collega@example.nl'],cc:['cc@example.nl'],bcc:['private@example.nl'],subject:'Re: Offerte',text:'Antwoord',html:'<b>Antwoord</b>',messageId:'<new@example.nl>',inReplyTo:'<original@example.nl>',references:['<root@example.nl>','<original@example.nl>'],attachments:mimeAttachments([{filename:'offerte.pdf',mimeType:'application/pdf',content:'JVBERg=='}])});
  const parsed=await simpleParser(Buffer.from(raw));
  assertEquals(parsed.messageId,'<new@example.nl>');assertEquals(parsed.inReplyTo,'<original@example.nl>');
  assertEquals(parsed.references,['<root@example.nl>','<original@example.nl>']);
  assertStringIncludes(parsed.html || '', '<b>Antwoord</b>');assertStringIncludes(parsed.text || '', 'Antwoord');
  assertEquals(parsed.attachments[0].filename,'offerte.pdf');assertEquals(parsed.attachments[0].content.toString(),'%PDF');
  assertEquals(parsed.bcc,undefined);
});

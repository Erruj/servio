import nodemailer from "npm:nodemailer@6";
import MailComposer from "npm:nodemailer@6/lib/mail-composer/index.js";
import { ImapFlow } from "npm:imapflow@1";
import { simpleParser } from "npm:mailparser@3";
import { Buffer } from "node:buffer";

export async function decryptPassword(encrypted: string, secret: string) {
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({name:"PBKDF2",salt:new TextEncoder().encode("servio-imap-v1"),iterations:100000,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["decrypt"]);
  const bytes = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  return new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:bytes.slice(0,12)},key,bytes.slice(12)));
}
export function imapClient(connection: any, password: string) {
  return new ImapFlow({host:connection.imap_host,port:connection.imap_port || 993,secure:connection.use_ssl !== false,auth:{user:connection.email_address,pass:password},logger:false,connectionTimeout:20000,socketTimeout:30000});
}
export async function originalImap(connection: any, password: string, original: any) {
  const client = imapClient(connection,password);
  try {
    await client.connect();
    const folders = await client.list();
    const special = {archive:"\\Archive",trash:"\\Trash",spam:"\\Junk",sent:"\\Sent",drafts:"\\Drafts"};
    const folder = original.folder === "inbox" ? "INBOX" : folders.find((f:any) => f.specialUse === special[original.folder as keyof typeof special])?.path;
    if (!folder) throw new Error("original_missing");
    const lock = await client.getMailboxLock(folder);
    try {
      const bare = (original.message_id || original.external_id).replace(/[<>]/g, "");
      const uids = original.external_id.startsWith("uid-") ? [Number(original.external_id.slice(4))] : await client.search({header:{"message-id":bare}}, {uid:true});
      if (!uids || !uids.length) throw new Error("original_missing");
      const found = await client.fetchOne(String(uids[uids.length-1]), {source:true}, {uid:true});
      if (!found || !found.source) throw new Error("original_missing");
      const parsed = await simpleParser(found.source);
      return { message_id:parsed.messageId, reference_ids: Array.isArray(parsed.references) ? parsed.references : parsed.references ? [parsed.references] : [], attachments:parsed.attachments.map((a:any,i:number) => ({id:`part-${i}`,filename:a.filename || `attachment-${i+1}`,mimeType:a.contentType,content:a.content.toString("base64")})) };
    } finally {lock.release();}
  } finally {await client.logout().catch(()=>{});}
}
export async function buildMime(options: any): Promise<Uint8Array> {
  return await new Promise((resolve,reject) => new MailComposer(options).compile().build((error:any,buffer:Uint8Array) => error ? reject(error) : resolve(buffer)));
}
export async function sendSmtp(connection: any,password: string, raw: Uint8Array, recipients: string[]) {
  const transport = nodemailer.createTransport({host:connection.smtp_host,port:connection.smtp_port || 587,secure:connection.smtp_port === 465,requireTLS:connection.smtp_port !== 465,auth:{user:connection.email_address,pass:password},connectionTimeout:20000,socketTimeout:30000,logger:false});
  try {
    const result = await transport.sendMail({envelope:{from:connection.email_address,to:recipients},raw:Buffer.from(raw)});
    return {rejected:result.rejected || []};
  } finally {transport.close();}
}
export async function appendSent(connection:any,password:string,raw:Uint8Array) {
  const client = imapClient(connection,password);
  try {
    await client.connect();
    const folders = await client.list();
    let sent = folders.find((f:any)=>f.specialUse === "\\Sent")?.path || folders.find((f:any)=>/^(sent|sent items|verzonden)$/i.test(f.path))?.path;
    if (!sent) {sent="Verzonden"; await client.mailboxCreate(sent);}
    await client.append(sent, Buffer.from(raw), ["\\Seen"], new Date());
  } finally {await client.logout().catch(()=>{});}
}
export const mimeAttachments = (attachments:any[]) => attachments.map(a=>({filename:a.filename,contentType:a.mimeType,content:Buffer.from(a.content,"base64")}));

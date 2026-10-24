import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { Buffer } from "node:buffer";
import sanitizeHtml from "npm:sanitize-html@2";
import { consumeUsageOrReject } from "../_shared/usage.ts";
import { SendSchema, messageId, replyHeaders, assertAttachments, selectOriginals } from "./message.ts";
import { decryptPassword, originalImap, buildMime, sendSmtp, appendSent, mimeAttachments } from "./transport.ts";

class SendError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {status,headers:{...corsHeaders,"Content-Type":"application/json"}});
const graphBase = "https://graph.microsoft.com/v1.0/me";
const graphRecipients = (list: string[]) => list.map(address=>({emailAddress:{address}}));
const safeHtml = (html: string) => sanitizeHtml(html, {allowedTags:['p','div','br','strong','b','em','i','u','ul','ol','li','a','blockquote'],allowedAttributes:{a:['href']},allowedSchemes:['http','https','mailto']});
const escapeHtml = (text:string) => text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c)).replace(/\n/g,'<br>');

async function providerCall(url:string,token:string,method='GET',body?:unknown) {
  const response = await fetch(url,{method,headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json",Prefer:'IdType="ImmutableId"'},body:body === undefined ? undefined : JSON.stringify(body),signal:AbortSignal.timeout(30000)});
  if (!response.ok) {
    // Never expose tokens, recipient addresses or provider diagnostic bodies to the browser.
    const diagnostic = await response.text();
    const scopeFailure = /ErrorAccessDenied|insufficient.*scope|Authorization_RequestDenied/i.test(diagnostic);
    throw new SendError(response.status === 401 || response.status === 403 || scopeFailure ? 'reconnect' : response.status === 413 ? 'attachment_size' : response.status === 429 ? 'busy' : response.status === 404 ? 'original_missing' : 'provider',response.status);
  }
  return response.status === 202 || response.status === 204 ? {} : response.json();
}
async function accessToken(db:any,connection:any) {
  if (connection.access_token && new Date(connection.token_expires_at).getTime() > Date.now()+60000) return connection.access_token;
  const microsoft = connection.provider === 'outlook';
  const client = Deno.env.get(microsoft ? 'MICROSOFT_CLIENT_ID':'GOOGLE_CLIENT_ID');
  const secret = Deno.env.get(microsoft ? 'MICROSOFT_CLIENT_SECRET':'GOOGLE_CLIENT_SECRET');
  if (!client || !secret || !connection.refresh_token) throw new SendError('reconnect',401);
  const response = await fetch(microsoft ? 'https://login.microsoftonline.com/common/oauth2/v2.0/token':'https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:connection.refresh_token,client_id:client,client_secret:secret}),signal:AbortSignal.timeout(20000)});
  if (!response.ok) throw new SendError('reconnect',401);
  const tokens = await response.json();
  const {error} = await db.from('email_connections').update({access_token:tokens.access_token,refresh_token:tokens.refresh_token || connection.refresh_token,token_expires_at:new Date(Date.now()+tokens.expires_in*1000).toISOString()}).eq('id',connection.id).eq('user_id',connection.user_id);
  if (error) throw new SendError('storage',500);
  return tokens.access_token;
}
async function graphAttachments(token:string,externalId:string) {
  let url:string | undefined = `${graphBase}/messages/${encodeURIComponent(externalId)}/attachments`;
  const attachments:any[]=[];
  while(url) {
    if (!url.startsWith('https://graph.microsoft.com/v1.0/')) throw new SendError('attachment_missing');
    const data:any=await providerCall(url,token);
    for(const a of data.value || []) {
      if(a['@odata.type']==='#microsoft.graph.fileAttachment') attachments.push({id:a.id,filename:a.name,mimeType:a.contentType || 'application/octet-stream',content:a.contentBytes});
      else attachments.push({id:a.id,unsupported:true});
    }
    url=data['@odata.nextLink'];
  }
  return attachments;
}
async function gmailOriginal(token:string,externalId:string) {
  const data=await providerCall(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(externalId)}?format=full`,token);
  const headers=data.payload?.headers || [];
  const header=(name:string)=>headers.find((h:any)=>h.name.toLowerCase()===name)?.value;
  const attachments:any[]=[];
  const walk=async(part:any)=>{
    if(part.filename) {
      const id=part.body?.attachmentId || part.partId;
      const bytes=part.body?.attachmentId ? await providerCall(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(externalId)}/attachments/${encodeURIComponent(part.body.attachmentId)}`,token) : part.body;
      const content=(bytes?.data || '').replace(/-/g,'+').replace(/_/g,'/');
      attachments.push({id,filename:part.filename,mimeType:part.mimeType,content});
    }
    for(const child of part.parts || []) await walk(child);
  };
  await walk(data.payload);
  return {message_id:header('message-id'),reference_ids:(header('references') || '').match(/<[^>]+>/g) || [],attachments};
}
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST') return json({errorCode:'method'},405);
  let db:any, draft:any, owner:string | undefined;
  let delivered=false, claimed=false;
  try {
    const url=Deno.env.get('SUPABASE_URL');
    const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anon=Deno.env.get('SUPABASE_ANON_KEY');
    if(!url || !service || !anon) throw new SendError('configuration',500);
    const auth=req.headers.get('Authorization');
    if(!auth?.startsWith('Bearer ')) return json({errorCode:'session'},401);
    const authClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});
    const {data:{user},error:authError}=await authClient.auth.getUser();
    if(authError || !user) return json({errorCode:'session'},401);
    owner=user.id; db=createClient(url,service);
    const parsed=SendSchema.safeParse(await req.json());
    if(!parsed.success) return json({errorCode:'validation'},400);
    const input=parsed.data;
    const originalId=input.originalId || input.replyToEmailId;
    const mode=input.replyToEmailId && input.mode==='new' ? 'reply' : input.mode;
    if(mode!=='new' && !originalId) throw new SendError('original_missing');
    if(input.draftId) {
      const result=await db.from('emails').select('*').eq('id',input.draftId).eq('user_id',owner).maybeSingle();
      draft=result.data;
      if(result.error || !draft) throw new SendError('draft_missing');
      if(draft.folder==='sent' || draft.send_status==='sent') return json({success:true,messageId:draft.message_id});
      if(draft.send_status==='sending' || draft.send_status==='uncertain') throw new SendError('uncertain',409);
      if(draft.folder!=='drafts') throw new SendError('draft_missing');
    } else {
      // Legacy callers also receive a durable record before any external side effect.
      const result=await db.from('emails').insert({user_id:owner,external_id:`servio-draft-${crypto.randomUUID()}`,folder:'drafts',from_email:user.email || '',to_emails:input.to,cc_emails:input.cc,subject:input.subject,body_text:input.body,body_html:safeHtml(input.html || escapeHtml(input.body)),received_at:new Date().toISOString()}).select('*').single();
      if(result.error) throw new SendError('storage',500);
      draft=result.data;
    }
    let query=db.from('email_connections').select('*').eq('user_id',owner).eq('is_active',true);
    if(input.connection_id || draft.connection_id) query=query.eq('id',input.connection_id || draft.connection_id);
    const {data:connection,error:connectionError}=await query.order('created_at',{ascending:false}).limit(1).single();
    if(connectionError || !connection) throw new SendError('mailbox');
    let original:any;
    if(originalId) {
      const result=await db.from('emails').select('*').eq('id',originalId).eq('user_id',owner).maybeSingle();
      original=result.data;
      if(result.error || !original || original.folder==='drafts') throw new SendError('original_missing');
      if(original.connection_id!==connection.id && mode!=='forward') throw new SendError('source_mailbox');
    }
    let token:string | undefined, password:string | undefined;
    if(connection.provider==='imap') {
      if(!connection.smtp_host || !connection.encrypted_password || !connection.imap_host) throw new SendError('configuration');
      password=await decryptPassword(connection.encrypted_password,service);
    } else token=await accessToken(db,connection);
    const attachments=[...input.attachments];
    if(original && (input.originalAttachments.length || !original.message_id)) {
      // Resolve originals using only the owned source mailbox; never fetch client-supplied URLs.
      let source=connection, sourceToken=token, sourcePassword=password;
      if(original.connection_id!==connection.id) {
        const result=await db.from('email_connections').select('*').eq('id',original.connection_id).eq('user_id',owner).eq('is_active',true).single();
        if(result.error || !result.data) throw new SendError('original_missing');
        source=result.data;
        if(source.provider==='imap') sourcePassword=await decryptPassword(source.encrypted_password,service);
        else sourceToken=await accessToken(db,source);
      }
      let fetched:any;
      if(source.provider==='imap' && sourcePassword) fetched=await originalImap(source,sourcePassword,original);
      else if(source.provider==='gmail' && sourceToken) fetched=await gmailOriginal(sourceToken,original.external_id);
      else if(sourceToken) {
        const data=await providerCall(`${graphBase}/messages/${encodeURIComponent(original.external_id)}?$select=internetMessageId,internetMessageHeaders`,sourceToken);
        fetched={message_id:data.internetMessageId,reference_ids:(data.internetMessageHeaders?.find((h:any)=>h.name.toLowerCase()==='references')?.value || '').match(/<[^>]+>/g) || [],attachments:input.originalAttachments.length ? await graphAttachments(sourceToken,original.external_id) : []};
      }
      if(!fetched) throw new SendError('original_missing');
      original={...original,message_id:fetched.message_id || original.message_id,reference_ids:fetched.reference_ids || original.reference_ids};
      const selected=selectOriginals(fetched.attachments,input.originalAttachments);
      if(selected.some((a:any)=>a.unsupported || !a.content)) throw new SendError('attachment_missing');
      attachments.push(...selected);
      await db.from('emails').update({message_id:original.message_id,reference_ids:original.reference_ids}).eq('id',original.id).eq('user_id',owner);
    }
    assertAttachments(attachments);
    if(['reply','replyAll'].includes(mode) && !messageId(original?.message_id)) throw new SendError('original_missing');
    const mid=messageId(draft.message_id) || `<${crypto.randomUUID()}@${connection.email_address.split('@')[1]}>`;
    const headers=replyHeaders(original || {},mode);
    const html=safeHtml(input.html || escapeHtml(input.body));
    const raw=await buildMime({from:connection.email_address,to:input.to,cc:input.cc,bcc:input.bcc,subject:input.subject,text:input.body,html,messageId:mid,date:new Date(),...headers,attachments:mimeAttachments(attachments)});
    const claim=await db.from('emails').update({send_status:'sending',message_id:mid,connection_id:connection.id}).eq('id',draft.id).eq('user_id',owner).eq('folder','drafts').in('send_status',['draft','failed']).select('id');
    if(claim.error) throw new SendError('storage',500);
    if(!claim.data?.length) throw new SendError('uncertain',409);
    claimed=true;
    const usage=await consumeUsageOrReject(owner,'email',corsHeaders);
    if(usage) {await db.from('emails').update({send_status:'failed'}).eq('id',draft.id).eq('user_id',owner);return usage;}
    let externalId=mid.replace(/[<>]/g,''),threadId=original?.thread_id || original?.message_id || mid;
    const warnings:string[]=[];
    if(connection.provider==='imap' && password) {
      const result=await sendSmtp(connection,password,raw,[...input.to,...input.cc,...input.bcc]);
      delivered=true;
      if(result.rejected.length) warnings.push('partial');
      try {await appendSent(connection,password,raw);} catch {warnings.push('sent_copy');}
    } else if(connection.provider==='outlook' && token) {
      const graphMessage:any={subject:input.subject,body:{contentType:'HTML',content:html},toRecipients:graphRecipients(input.to),ccRecipients:graphRecipients(input.cc),bccRecipients:graphRecipients(input.bcc),attachments:attachments.map(a=>({'@odata.type':'#microsoft.graph.fileAttachment',name:a.filename,contentType:a.mimeType,contentBytes:a.content}))};
      if(mode==='new' || (mode==='forward' && original?.connection_id!==connection.id)) {
        await providerCall(`${graphBase}/sendMail`,token,'POST',{message:{...graphMessage,internetMessageHeaders:[{name:'x-servio-message-id',value:mid}]},saveToSentItems:true});
      } else {
        await providerCall(`${graphBase}/messages/${encodeURIComponent(original.external_id)}/${mode}`,token,'POST',{message:graphMessage});
      }
      delivered=true;
      // Graph owns RFC Message-ID generation. Read its actual sent ID where immediately available.
      try {
        const sent=await providerCall(`${graphBase}/mailFolders/sentitems/messages?$top=10&$orderby=sentDateTime desc&$select=id,internetMessageId,conversationId,subject,toRecipients,sentDateTime`,token);
        const match=sent.value?.find((m:any)=>m.subject===input.subject && new Date(m.sentDateTime).getTime()>Date.now()-120000 && input.to.every(a=>m.toRecipients?.some((r:any)=>r.emailAddress.address.toLowerCase()===a.toLowerCase())));
        if(match) {externalId=match.id;threadId=match.conversationId || threadId;draft.message_id=match.internetMessageId;}
      } catch { /* Delivery succeeded; never retry delivery for a lookup failure. */ }
    } else if(connection.provider==='gmail' && token) {
      const result=await providerCall('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',token,'POST',{raw:Buffer.from(raw).toString('base64url'),...(['reply','replyAll'].includes(mode) && original?.thread_id ? {threadId:original.thread_id}:{})});
      delivered=true;externalId=result.id;threadId=result.threadId || threadId;
    } else throw new SendError('configuration');
    const {error:saveError}=await db.from('emails').update({folder:'sent',send_status:'sent',external_id:externalId,message_id:draft.message_id || mid,reference_ids:headers.references || [],thread_id:threadId,from_email:connection.email_address,to_emails:input.to,cc_emails:input.cc,subject:input.subject,body_text:input.body,body_html:html,snippet:input.body.slice(0,160),is_read:true,is_starred:false,received_at:new Date().toISOString(),has_attachments:attachments.length>0,attachment_metadata:attachments.map((a,i)=>({id:`part-${i}`,name:a.filename,type:a.mimeType,sizeKB:Math.ceil(atob(a.content).length/1024)})),draft_data:null}).eq('id',draft.id).eq('user_id',owner);
    if(saveError) warnings.push('storage_sent');
    return json({success:true,messageId:draft.message_id || mid,warnings});
  } catch(error) {
    const rawCode=error instanceof Error ? error.message : '';
    const code=error instanceof SendError ? error.code : ['attachment_size','attachment_missing','original_missing'].includes(rawCode) ? rawCode : /auth|login|credentials/i.test(rawCode) ? 'reconnect' : 'network';
    const uncertain=claimed && !delivered && (code==='network');
    if(db && draft && owner && claimed) await db.from('emails').update({send_status:delivered ? 'sent':uncertain ? 'uncertain':'failed'}).eq('id',draft.id).eq('user_id',owner);
    if(delivered) return json({success:true,warnings:['storage_sent']});
    console.error('send-email failed', {code,uncertain});
    return json({errorCode:uncertain ? 'uncertain':code},error instanceof SendError ? error.status : 500);
  }
});

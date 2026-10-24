import {vacationEligible} from './vacation-rules.ts';
import {accessToken} from './mail-send/handler.ts';
import {decryptPassword,buildMime,sendSmtp,appendSent} from './mail-send/transport.ts';
export async function processVacationReplies(db:any,connection:any,externalIds:string[]){
 if(!['imap','outlook'].includes(connection.provider)||!externalIds.length)return;
 const {data:p,error:pError}=await db.from('mailbox_preferences').select('*').eq('user_id',connection.user_id).eq('connection_id',connection.id).maybeSingle();
 if(pError||!p?.vacation_enabled||Date.now()<Date.parse(p.vacation_start)||Date.now()>=Date.parse(p.vacation_end))return;
 const {data:mails,error}=await db.from('emails').select('*').eq('user_id',connection.user_id).eq('connection_id',connection.id).in('external_id',externalIds).eq('folder','inbox');if(error)throw error;
 for(const mail of mails||[]){
 if(!vacationEligible(mail,[connection.email_address]))continue;
 // Resolve credentials before claiming. A claimed or uncertain send never retries automatically.
 let password:string|undefined,token:string|undefined;
 try {if(connection.provider==='imap')password=await decryptPassword(connection.encrypted_password,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'');else token=await accessToken(db,connection);}catch{await db.from('mailbox_preferences').update({vacation_error:'connection'}).eq('connection_id',connection.id);continue;}
 const {data:auditId,error:claimError}=await db.rpc('claim_vacation_reply',{_user_id:connection.user_id,_connection_id:connection.id,_email_id:mail.id});if(claimError)throw claimError;if(!auditId)continue;
 let accepted=false;
 try {
 const mid=`<${crypto.randomUUID()}@${connection.email_address.split('@')[1]}>`;const subject=`Re: ${(mail.subject||'').replace(/[\r\n]/g,' ').slice(0,900)}`;
 if(password){const raw=await buildMime({from:connection.email_address,to:[mail.from_email],subject,text:p.vacation_text,messageId:mid,inReplyTo:mail.message_id||undefined,references:mail.message_id?[...(mail.reference_ids||[]),mail.message_id]:[],headers:{'Auto-Submitted':'auto-replied','X-Auto-Response-Suppress':'All'}});const result=await sendSmtp(connection,password,raw,[mail.from_email]);if(result.rejected.length)throw new Error('rejected');accepted=true;await db.from('audit_log').update({status:'success'}).eq('id',auditId).eq('user_id',connection.user_id);try{await appendSent(connection,password,raw);}catch{/* Never redeliver for a copy failure. */}}
 else if(token){const response=await fetch(`https://graph.microsoft.com/v1.0/me/sendMail`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(30000),body:JSON.stringify({message:{subject,body:{contentType:'Text',content:p.vacation_text},toRecipients:[{emailAddress:{address:mail.from_email}}],internetMessageHeaders:[{name:'x-auto-response-suppress',value:'All'},{name:'x-servio-vacation',value:auditId}]},saveToSentItems:true})});if(!response.ok)throw new Error('provider');accepted=true;await db.from('audit_log').update({status:'success'}).eq('id',auditId).eq('user_id',connection.user_id);}
 const {error:sentError}=await db.from('emails').insert({user_id:connection.user_id,connection_id:connection.id,external_id:`vacation-${auditId}`,folder:'sent',send_status:'sent',from_email:connection.email_address,to_emails:[mail.from_email],subject,body_text:p.vacation_text,snippet:p.vacation_text.slice(0,160),message_id:mid,thread_id:mail.thread_id||mail.message_id,is_read:true,received_at:new Date().toISOString()});if(sentError)throw sentError;
 await db.from('mailbox_preferences').update({vacation_error:null}).eq('connection_id',connection.id);
 }catch{await db.from('audit_log').update({status:accepted?'success':'uncertain'}).eq('id',auditId).eq('user_id',connection.user_id);await db.from('mailbox_preferences').update({vacation_error:accepted?'sent_copy':'delivery'}).eq('connection_id',connection.id);}
 }
}

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { isCronAuthorized, recordCronHealth } from '../_shared/security.ts';
import { deliverEmail } from '../_shared/mail-send/handler.ts';
import { SendSchema } from '../_shared/mail-send/message.ts';
declare const EdgeRuntime:{waitUntil:(promise:Promise<unknown>)=>void};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
const schema=z.object({action:z.enum(['enqueue','cancel','undo','now']).optional(),draftId:z.string().uuid().optional(),sendAt:z.string().datetime().optional(),payload:z.unknown().optional()});
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return json({errorCode:'validation'},405);
 const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),anon=Deno.env.get('SUPABASE_ANON_KEY');
 if(!url||!key||!anon)return json({errorCode:'configuration'},500);
 const db=createClient(url,key);
 try{
 const parsed=schema.safeParse(await req.json());if(!parsed.success)return json({errorCode:'validation'},400);
 const body=parsed.data;
 if(await isCronAuthorized(req.headers.get('x-cron-secret'))){
 const process=async()=>{
 if(body.draftId){const {data}=await db.from('emails').select('send_at').eq('id',body.draftId).eq('send_status','queued').maybeSingle();const delay=new Date(data?.send_at || 0).getTime()-Date.now();if(delay>0&&delay<=30000)await new Promise(r=>setTimeout(r,delay+50));}
 const {data,error}=await db.from('emails').select('id,user_id,send_payload,send_at,updated_at').eq('folder','scheduled').eq('send_status','queued').lte('send_at',new Date().toISOString()).order('send_at').limit(25);
 if(error)throw error;
 for(const row of data || []){
 const response=await deliverEmail(new Request(req.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...row.send_payload,draftId:row.id})}),row.user_id,row.updated_at);
 if(!response.ok){const result=await response.json();await db.from('emails').update({send_status:'failed',send_error:result.errorCode || 'network'}).eq('id',row.id).eq('send_status','queued').eq('updated_at',row.updated_at);}
 }
 await db.rpc('refresh_mail_send_job');await recordCronHealth('scheduled-mail-delivery');
 };
 EdgeRuntime.waitUntil(process().catch(async()=>{await recordCronHealth('scheduled-mail-delivery','Delivery processing failed');}));
 return json({accepted:true});
 }
 const auth=req.headers.get('Authorization');if(!auth?.startsWith('Bearer '))return json({errorCode:'session'},401);
 const client=createClient(url,anon,{global:{headers:{Authorization:auth}}});const {data:{user},error}=await client.auth.getUser();if(error||!user)return json({errorCode:'session'},401);
 if(!body.draftId||!body.action)return json({errorCode:'validation'},400);
 const {data:draft}=await db.from('emails').select('*').eq('id',body.draftId).eq('user_id',user.id).maybeSingle();
 if(!draft)return json({errorCode:'draft_missing'},404);
 if(['sending','uncertain','sent'].includes(draft.send_status)||draft.folder==='sent')return json({errorCode:'uncertain'},409);
 if(body.action==='cancel'||body.action==='undo'){
 if(body.action==='undo'&&(!draft.undo_until||Date.now()>=new Date(draft.undo_until).getTime()))return json({errorCode:'too_late'},409);
 const {data,error}=await db.from('emails').update({folder:'drafts',send_status:'draft',send_at:null,undo_until:null,send_payload:null,send_error:null}).eq('id',draft.id).eq('user_id',user.id).in('send_status',['queued','failed','draft']).select('id');
 if(error||!data?.length)return json({errorCode:'uncertain'},409);return json({success:true});
 }
 const input=SendSchema.safeParse(body.action==='now'?draft.send_payload:body.payload);if(!input.success)return json({errorCode:'validation'},400);
 if(!['drafts','scheduled'].includes(draft.folder))return json({errorCode:'draft_missing'},409);
 const {data:connection}=await db.from('email_connections').select('id').eq('id',input.data.connection_id || draft.connection_id).eq('user_id',user.id).eq('is_active',true).maybeSingle();if(!connection)return json({errorCode:'mailbox'},400);
 let due=new Date(),undoUntil:string|null=null;
 if(body.action==='enqueue'){
 if(body.sendAt){due=new Date(body.sendAt);if(due.getTime()<=Date.now())return json({errorCode:'future'},400);}
 else {const {data:pref}=await db.from('mail_send_preferences').select('undo_seconds').eq('user_id',user.id).maybeSingle();due=new Date(Date.now()+(pref?.undo_seconds || 8)*1000);undoUntil=due.toISOString();}
 }
 const {data,error:saveError}=await db.from('emails').update({folder:'scheduled',send_status:'queued',send_at:due.toISOString(),undo_until:undoUntil,send_error:null,send_payload:{...input.data,draftId:draft.id}}).eq('id',draft.id).eq('user_id',user.id).in('send_status',['draft','failed','queued']).select('id');
 if(saveError||!data?.length)return json({errorCode:'storage'},409);
 return json({success:true,sendAt:due.toISOString(),undoUntil});
 }catch{return json({errorCode:'network'},500);}
});

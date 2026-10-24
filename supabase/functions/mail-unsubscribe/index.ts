import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { publicAddress, unsubscribeTarget } from './links.ts';
import { applyMailboxAction } from '../_shared/mailbox-actions.ts';
import { request } from 'node:https';
const Body=z.object({email_id:z.string().uuid(),action:z.enum(['unsubscribe','archive']).default('unsubscribe')});
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,'Content-Type':'application/json'}});
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST') return json({errorCode:'error'},405);
  const url=Deno.env.get('SUPABASE_URL') || '';
  const auth=req.headers.get('Authorization');
  if(!auth?.startsWith('Bearer ')) return json({errorCode:'session'},401);
  const client=createClient(url,Deno.env.get('SUPABASE_ANON_KEY') || '');
  const {data:{user},error:authError}=await client.auth.getUser(auth.slice(7));
  if(authError||!user) return json({errorCode:'session'},401);
  const parsed=Body.safeParse(await req.json().catch(()=>null));
  if(!parsed.success) return json({errorCode:'error'},400);
  const db=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');
  const {data:email,error}=await db.from('emails').select('id,from_email,list_unsubscribe,list_unsubscribe_post').eq('id',parsed.data.email_id).eq('user_id',user.id).maybeSingle();
  if(error||!email) return json({errorCode:'error'},404);
  if(parsed.data.action==='archive') {
    // Paginate until all eligible messages are processed; failures remain available for retry.
    let archived=0;
    const connections=new Map<string,any>();
    let cursor='';
    for(let page=0;page<100;page++) {
      let query=db.from('emails').select('id,connection_id,external_id,folder').eq('user_id',user.id).eq('from_email',email.from_email).in('folder',['inbox','spam','snoozed']).order('id').limit(50);
      if(cursor) query=query.gt('id',cursor);
      const {data:rows,error:readError}=await query;
      if(readError) return json({errorCode:'archiveError',archived},500);
      if(!rows?.length) return json({success:true,archived});
      for(const row of rows) {
        try {
          if(!row.connection_id) throw new Error('connection');
          if(!connections.has(row.connection_id)) {
            const {data:conn}=await db.from('email_connections').select('*').eq('user_id',user.id).eq('id',row.connection_id).maybeSingle();
            if(!conn) throw new Error('connection');
            connections.set(row.connection_id,conn);
          }
          const external_id=await applyMailboxAction(db,connections.get(row.connection_id),row,'archive');
          const {error:saveError}=await db.from('emails').update({folder:'archive',...(external_id?{external_id}:{})}).eq('id',row.id).eq('user_id',user.id);
          if(saveError) throw saveError;
          archived++;
        } catch {return json({errorCode:'archiveError',archived},502);}
      }
      cursor=rows[rows.length-1].id;
    }
    return json({errorCode:'archiveError',archived},409);
  }
  const target=unsubscribeTarget(email.list_unsubscribe,email.list_unsubscribe_post);
  if(!target.oneClick) return json({https:target.https,mailto:target.mailto});
  try {
    if(!target.https) throw new Error('target');
    const targetUrl=new URL(target.https);
    if(targetUrl.port && targetUrl.port!=='443') throw new Error('port');
    const host=targetUrl.hostname.toLowerCase();
    if(host==='localhost'||host.endsWith('.local')||host.endsWith('.internal')||host.startsWith('[')) throw new Error('host');
    const addresses=/^[\d.]+$/.test(host)?[host]:await Deno.resolveDns(host,'A');
    if(!addresses.length||addresses.some(address=>!publicAddress(address))) throw new Error('private');
    // Pin DNS while retaining the original TLS hostname and certificate validation.
    await new Promise<void>((resolve,reject)=>{
      const body='List-Unsubscribe=One-Click';
      const outgoing=request(targetUrl,{method:'POST',agent:false,lookup:(_hostname,_options,callback)=>callback(null,addresses[0],4),headers:{'Content-Type':'application/x-www-form-urlencoded','Content-Length':String(body.length)}},response=>{
        const status=response.statusCode||0;
        response.destroy();
        if(status>=200&&status<300) resolve();else reject(new Error('upstream'));
      });
      outgoing.setTimeout(10000,()=>outgoing.destroy(new Error('timeout')));
      outgoing.on('error',reject);
      outgoing.end(body);
    });
    return json({success:true});
  } catch {return json({errorCode:'error'},502);}
});
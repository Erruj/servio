"""Regression checks against real React components with isolated service doubles.
Run: python3 src/lib/mail-monitoring.browser.py (Vite must be running).
No account credentials, AI requests, or real mail delivery are used.
"""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path('/tmp/browser/mail-monitoring')
AUTH = """export function useAuth(){return {user:{id:'user-1',email:'owner@example.test'},isLoading:false};}"""
CLIENT = """
window.qaCalls=[];
window.qaCustomers=[{id:'customer-1',name:'Alice',email:'alice@example.test',company_name:'Acme',created_at:'2026-11-01'}];
const sent={id:'sent-1',connection_id:'conn-1',thread_id:'thread-1',from_name:'Owner',from_email:'owner@example.test',to_emails:['alice@example.test'],subject:'Re: Request',body_text:'Already replied',received_at:'2026-11-11T18:00:00Z',folder:'sent'};
export const supabase={auth:{getSession:async()=>({data:{session:null}}),getUser:async()=>({data:{user:{id:'user-1'}}})},
functions:{invoke:async(name,opts)=>{window.qaCalls.push({name,...opts.body});if(name==='scheduled-mail')return {data:{success:true,undoUntil:new Date(Date.now()+8000).toISOString()}};return {data:{data:{company_name:'Suggested company',phone:''}}};}},
from(table){let op='select',payload,filters=[];const q=new Proxy({}, {get(_,key){if(key==='then')return(resolve,reject)=>Promise.resolve((()=>{
if(table==='customers'){if(op==='insert'){window.qaCustomers.push({id:'customer-2',...payload,created_at:'2026-11-11'});return {data:{id:'customer-2'}};}if(op==='update'){window.qaCustomers=window.qaCustomers.map(c=>c.id===filters.find(f=>f[0]==='id')?.[1]?{...c,...payload}:c);}if(op==='delete'){window.qaCustomers=window.qaCustomers.filter(c=>c.id!==filters.find(f=>f[0]==='id')?.[1]);}const email=filters.find(f=>f[0]==='email');return {data:email?[]:window.qaCustomers};}
if(table==='emails')return {data:filters.some(f=>f[0]==='thread_id')?[window.qaOriginal,sent]:[]};
if(table==='email_connections_safe')return {data:[{id:'conn-1',email_address:'owner@example.test',provider:'imap',is_active:true}]};
if(table==='user_settings'||table==='mail_preferences')return {data:null};return {data:[],count:0};})()).then(resolve,reject);
return(...args)=>{if(['insert','update','upsert','delete'].includes(key)){op=key;payload=args[0];}if(['eq','ilike'].includes(key))filters.push(args);return q;};}});return q;}};
"""
HARNESS = """
import React from '/@oj-deps/react.mjs'; import {useState} from '/@oj-deps/react__oj_named.mjs';
import {createRoot} from '/@oj-deps/react-dom_client__oj_named.mjs';
import {QueryClient,QueryClientProvider} from '/@oj-deps/tanstack_react-query.mjs';
import {BrowserRouter} from '/@oj-deps/react-router-dom.mjs';
import i18n from '/src/lib/i18n.ts';
import {MailDetail} from '/src/components/MailDetail.tsx';
import {SenderCustomer} from '/src/components/inbox/MailBusiness.tsx';
import {useMailCommercial} from '/src/hooks/useMailCommercial.ts';
import Customers from '/src/pages/administration/Customers.tsx';
import {ComposeEmail} from '/src/components/ComposeEmail.tsx';
import {Toaster} from '/src/components/ui/toaster.tsx';
await i18n.changeLanguage('nl');
const original={id:'original-1',from:'Alice',fromEmail:'alice@example.test',to:['owner@example.test'],subject:'Request',body:'Customer question',bodyText:'Customer question',snippet:'Customer question',receivedAt:'2026-11-11T17:00:00Z',unread:false,starred:false,folder:'inbox',labels:[],threadId:'thread-1',connectionId:'conn-1'};
window.qaOriginal={...original,connection_id:'conn-1',thread_id:'thread-1',from_name:'Alice',from_email:original.fromEmail,to_emails:original.to,body_text:original.body,received_at:original.receivedAt};
const connection={id:'conn-1',email_address:'owner@example.test',is_active:true,provider:'imap'};
function Commercial(){const [mail,setMail]=useState(original);const c=useMailCommercial(mail);return <><button onClick={()=>void c.start('time')}>Start time</button><button onClick={()=>setMail({...original,id:'other-2',from:'Bob',fromEmail:'bob@example.test'})}>Other mail</button><SenderCustomer key={mail.id} mail={mail} createRequest={c.createRequest} onCreated={c.onCreated}/></>;}
function App(){const mode=new URLSearchParams(location.search).get('mode');if(mode==='customer')return <Customers/>;if(mode==='commercial')return <Commercial/>;if(mode==='compose')return <ComposeEmail open hasConnection connections={[connection]} onOpenChange={v=>{window.qaClosed=!v;}} draftId="failed-1" initialDraft={{mode:'new',connectionId:'conn-1',to:['fixed@example.test'],cc:[],bcc:[],subject:'Corrected mail',html:'<p>Corrected body</p>',quote:'',quoteHeading:'',attachments:[],originalAttachments:[]}}/>;const action=name=>mail=>window.qaCalls.push({action:name,id:mail.id});return <MailDetail mail={original} connections={[connection]} actions={{onArchive:action('archive'),onDelete:action('delete'),onSpam:action('spam'),onRestore:action('restore'),onSnooze:action('snooze'),onUnsnooze:action('unsnooze'),onToggleStar:action('star'),onToggleRead:action('read'),onSaveLabels:action('labels')}}/>;}
createRoot(document.getElementById('root')).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><BrowserRouter><App/><Toaster/></BrowserRouter></QueryClientProvider>);
"""

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width':1280,'height':1800})
        await context.route('**/src/components/AuthProvider.tsx', lambda r:r.fulfill(content_type='application/javascript',body=AUTH))
        await context.route('**/src/integrations/supabase/client.ts', lambda r:r.fulfill(content_type='application/javascript',body=CLIENT))
        await context.route('**/qa-mail-monitoring*', lambda r:r.fulfill(content_type='text/html',body='<script type="module" src="/@oj/refresh-preamble.js"></script><div id="root"></div><script type="module" src="/qa-harness.jsx"></script>'))
        # Vite transforms the JSX served below through its normal source loader.
        import requests
        response = requests.post('http://localhost:8080/__unused', data='') if False else None
        # JSX is transformed by the project's installed esbuild without a project build.
        import subprocess
        import re
        dep_source = requests.get('http://localhost:8080/src/components/MailDetail.tsx').text + requests.get('http://localhost:8080/src/main.tsx').text + requests.get('http://localhost:8080/src/hooks/useMailCommercial.ts').text
        version = re.search(r'v=([a-f0-9]+)', dep_source).group(1)
        harness = re.sub(r"(/@oj-deps/[^']+.mjs)", lambda m:m.group(1)+'?v='+version, HARNESS)
        transformed = subprocess.run(['bun','-e',"const e=require('esbuild');let s=await Bun.stdin.text();console.log(e.transformSync(s,{loader:'jsx',format:'esm'}).code)"],input=harness,text=True,capture_output=True,check=True).stdout
        await context.route('**/qa-harness.jsx', lambda r:r.fulfill(content_type='application/javascript',body=transformed))
        page = await context.new_page()
        page.on('console',lambda m:print('CONSOLE',m.text))
        page.on('response',lambda r:print('HTTP',r.status,r.url) if r.status>=400 else None)
        page.on('requestfailed',lambda r:print('FAILED',r.url,r.failure))
        errors=[]
        page.on('pageerror',lambda e:(errors.append(str(e)),print('PAGE ERROR',str(e))))
        await page.goto('http://localhost:8080/qa-mail-monitoring?mode=detail')
        await page.wait_for_timeout(1500)
        print((await page.locator('body').inner_text())[:1000])
        await page.get_by_text('Already replied',exact=True).last.wait_for()
        await page.get_by_role('button',name='Archiveren',exact=True).click()
        await page.get_by_role('button',name='Verwijderen',exact=True).click()
        await page.get_by_role('button',name='Met ster markeren',exact=True).click()
        assert await page.evaluate("qaCalls.filter(c=>c.action).every(c=>c.id==='original-1')")
        assert await page.evaluate("qaCalls.filter(c=>c.action).length") == 3
        await page.get_by_role('button',name='Beantwoorden',exact=True).first.click()
        await page.locator('[data-mail-composer]').wait_for()
        assert await page.locator('[data-mail-composer]').inner_text() and await page.get_by_text('alice@example.test',exact=True).count()>0
        await page.screenshot(path=str(OUT/'1-selected-mail.png'))
        print('PASS: newer sent reply does not replace archive/delete/star or reply recipient')
        await page.goto('http://localhost:8080/qa-mail-monitoring?mode=commercial')
        await page.get_by_role('button',name='Start time').click()
        await page.get_by_role('dialog').wait_for()
        await page.get_by_role('button',name='Annuleren',exact=True).click()
        await page.get_by_role('button',name='Other mail').click()
        await page.get_by_role('button',name='Bob',exact=True).wait_for()
        await page.wait_for_timeout(300)
        assert await page.get_by_role('dialog').count()==0
        assert await page.evaluate("qaCalls.filter(c=>c.action==='customer').map(c=>c.email_id)") == ['original-1']
        await page.screenshot(path=str(OUT/'2-no-customer-popup.png'))
        print('PASS: switching sender does not open a form or consume another AI lookup')
        await page.goto('http://localhost:8080/qa-mail-monitoring?mode=customer&customer=customer-1&keep=yes')
        await page.get_by_role('dialog').wait_for()
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(150)
        assert 'customer=customer-1' not in page.url and 'keep=yes' in page.url
        await page.get_by_role('button',name='Nieuwe Klant',exact=True).click()
        # Existing form labels are not connected, so select the first form input.
        await page.get_by_role('dialog').locator('input').first.fill('New customer')
        await page.get_by_role('button',name='Aanmaken',exact=True).click()
        await page.get_by_text('New customer',exact=True).wait_for()
        assert await page.get_by_role('dialog').count()==0
        await page.screenshot(path=str(OUT/'3-customer-details-closed.png'))
        print('PASS: closing deep-linked details clears only its parameter; customer reload stays closed')
        await page.goto('http://localhost:8080/qa-mail-monitoring?mode=compose')
        await page.get_by_role('button',name='Verstuur',exact=True).click()
        await page.wait_for_function('window.qaClosed===true')
        assert await page.evaluate("qaCalls.some(c=>c.name==='scheduled-mail'&&c.action==='enqueue'&&c.draftId==='failed-1'&&c.sendAt===undefined&&c.payload.to[0]==='fixed@example.test')")
        await page.screenshot(path=str(OUT/'4-send-retry.png'))
        print('PASS: corrected draft uses immediate enqueue, not a stored past date')
        assert not errors, errors
        await browser.close()

asyncio.run(main())
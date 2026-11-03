import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import type { MailItem } from '@/types';
import { commercialSchema, paymentMatch, type CommercialExtraction } from '@/lib/mail-commercial';

export function useMailCommercial(mail: MailItem | null) {
 const { user } = useAuth(); const { t } = useTranslation(); const navigate = useNavigate(); const qc = useQueryClient();
 const [busy, setBusy] = useState(false); const [createRequest, setCreateRequest] = useState(0); const [pending, setPending] = useState<'quote'|'time'|null>(null);
 const email = (mail?.fromEmail || mail?.from || '').trim().toLowerCase();
 const customer = useQuery({queryKey:['mail-commercial-customer',user?.id,email],enabled:!!user&&!!email,retry:false,queryFn:async()=>{
  if(!user)return null;
  const {data,error}=await supabase.from('customers').select('id').eq('user_id',user.id).ilike('email',email.replace(/[\\%_]/g,'\\$&')).limit(2);
  if(error)throw error;return data?.length===1?data[0]:null;
 }});
 const invoices = useQuery({queryKey:['mail-commercial-invoices',user?.id,customer.data?.id],enabled:!!user&&!!customer.data,retry:false,queryFn:async()=>{
  if(!user||!customer.data)return [];
  const {data,error}=await supabase.from('invoices').select('id,invoice_number,amount,status,customer_id,supplier_id').eq('user_id',user.id).eq('customer_id',customer.data.id).is('supplier_id',null).in('status',['pending','overdue']);
  if(error)throw error;return data||[];
 }});
 const paymentCandidate = /betalin|betaald|payment|paid|zahlung|bezahlt|paiement|payé|pago|pagado/i.test(`${mail?.subject||''} ${mail?.bodyText||mail?.snippet||''}`);
 const extraction = useQuery({queryKey:['mail-commercial-extraction',user?.id,mail?.id],enabled:!!user&&!!mail&&!!invoices.data?.length&&paymentCandidate,retry:false,staleTime:Infinity,queryFn:async()=>{
  if(!mail)throw new Error('mail');
  const {data,error}=await supabase.functions.invoke('mail-business',{body:{action:'commercial',email_id:mail.id}});
  if(error||data?.errorCode)throw error||new Error('ai');return commercialSchema.parse(data.data);
 }});
 const matchingInvoice = customer.data && extraction.data ? paymentMatch(invoices.data||[],customer.data.id,extraction.data) : null;
 const continueAction=async(action:'quote'|'time',customerId:string)=>{
  if(!mail||!user)return;setBusy(true);
  try {
   if(action==='time'){navigate('/administration/time-tracking',{state:{mailTime:{userId:user.id,customerId,subject:mail.subject}}});return;}
   let fields:CommercialExtraction = {lines:[],requested_date:null,payment_confirmed:false,payment_amount:null,currency:null};
   try { const result=extraction.data?{data:extraction.data}:await extraction.refetch();if(!result.data)throw new Error('ai');fields=result.data; }
   catch {toast.warning(t('mailCommercial.aiFailed'));}
   if(!fields.lines.length)toast.info(t('mailCommercial.empty'));
   navigate('/administration/quotes',{state:{mailQuote:{userId:user.id,customerId,subject:mail.subject,extraction:fields}}});
  } finally {setBusy(false);}
 };
 const start=async(action:'quote'|'time')=>{
  if(!mail||!user||busy)return;
  if(customer.isPending||customer.isError){toast.error(t('mailBusiness.loadError'));return;}
  if(customer.data){await continueAction(action,customer.data.id);return;}
  setPending(action);setCreateRequest(v=>v+1);toast.info(t('mailCommercial.customer'));
 };
 const onCreated=(id:string)=>{const action=pending;setPending(null);void qc.invalidateQueries({queryKey:['mail-commercial-customer',user?.id,email]});if(action)void continueAction(action,id);};
 const markPaid=async()=>{
  if(!matchingInvoice||!user||busy)return;setBusy(true);
  try{
   const {data,error}=await supabase.from('invoices').update({status:'paid'}).eq('id',matchingInvoice.id).eq('user_id',user.id).eq('customer_id',matchingInvoice.customer_id||'').eq('amount',Number(matchingInvoice.amount)).is('supplier_id',null).in('status',['pending','overdue']).select('id');
   if(error||data?.length!==1)throw error||new Error('changed');
   await Promise.all([qc.invalidateQueries({queryKey:['mail-commercial-invoices']}),qc.invalidateQueries({queryKey:['mail-customer']})]);toast.success(t('mailCommercial.paid'));
  }catch{toast.error(t('mailCommercial.error'));}finally{setBusy(false);}
 };
 return {start,markPaid,matchingInvoice,busy,customerLoading:customer.isPending,createRequest,onCreated,extraction,
  checkPayment:async()=>{const result=await extraction.refetch();if(result.error){toast.error(t('mailCommercial.error'));return;}if(!customer.data||!result.data||!paymentMatch(invoices.data||[],customer.data.id,result.data))toast.info(t('mailCommercial.noMatch'));}};
}
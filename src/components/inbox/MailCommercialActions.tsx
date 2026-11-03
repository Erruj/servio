import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Clock, Check } from 'lucide-react';
import type { useMailCommercial } from '@/hooks/useMailCommercial';
export function MailCommercialActions({actions}:{actions:ReturnType<typeof useMailCommercial>}) {
 const {t}=useTranslation();
 return <div className="space-y-2">
  <div className="flex flex-wrap gap-2">
   <Button variant="outline" className="min-h-11 gap-2 whitespace-normal text-left" disabled={actions.busy||actions.customerLoading} onClick={()=>void actions.start('quote')}><FileText className="h-4 w-4 shrink-0"/>{t('mailCommercial.quote')}</Button>
   <Button variant="outline" className="min-h-11 gap-2" disabled={actions.busy||actions.customerLoading} onClick={()=>void actions.start('time')}><Clock className="h-4 w-4"/>{t('mailCommercial.time')}</Button>
   <Button variant="ghost" className="min-h-11" disabled={actions.busy||actions.extraction.isFetching} onClick={()=>void actions.checkPayment()}>{t('mailCommercial.payment')}</Button>
  </div>
  {actions.extraction.isFetching&&<Skeleton className="h-5 w-48"/>}
  {actions.matchingInvoice&&<Button variant="outline" className="min-h-11 gap-2 whitespace-normal" disabled={actions.busy} onClick={()=>void actions.markPaid()}><Check className="h-4 w-4 shrink-0"/>{t('mailCommercial.paidQuestion',{number:actions.matchingInvoice.invoice_number||actions.matchingInvoice.id})}</Button>}
 </div>;
}
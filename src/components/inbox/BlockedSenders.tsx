import {useBlockedSenders} from '@/hooks/useBlockedSenders';
import {useTranslation} from 'react-i18next';
import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {toast} from 'sonner';
export function BlockedSenders() {
  const {t}=useTranslation();
  const prefs=useBlockedSenders();
  return <div className="space-y-3">
    {prefs.hasLegacy && <div className="space-y-2 border-b border-border pb-3">
      <p className="font-medium text-sm">{t('mailSenders.legacy')}</p><p className="text-sm text-muted-foreground">{t('mailSenders.legacyInfo')}</p>
      <div className="flex flex-wrap gap-2"><Button variant="outline" className="min-h-11" disabled={prefs.importLegacy.isPending} onClick={()=>prefs.importLegacy.mutate(undefined,{onError:()=>toast.error(t('mailSenders.importError'))})}>{t('mailSenders.import')}</Button><Button variant="ghost" className="min-h-11" onClick={prefs.dismissLegacy}>{t('mailSenders.discard')}</Button></div>
    </div>}
    {prefs.loading?<Skeleton className="h-11 w-full"/>:prefs.error?<p role="alert" className="text-sm text-destructive">{t('mailSenders.loadError')}</p>:prefs.senders.length===0?<p className="text-sm text-muted-foreground">{t('mailSenders.empty')}</p>:<ul className="divide-y divide-border">{prefs.senders.map(sender=><li key={sender} className="flex items-center justify-between gap-3 py-2"><span className="text-sm break-all min-w-0">{sender}</span><Button variant="outline" className="min-h-11 shrink-0" disabled={prefs.unblock.isPending} onClick={()=>prefs.unblock.mutate(sender,{onSuccess:()=>toast.success(t('mailSenders.unblocked')),onError:()=>toast.error(t('mailSenders.unblockError'))})}>{t('mailSenders.unblock')}</Button></li>)}</ul>}
  </div>;
}
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { snoozePreset } from '@/lib/mail-reminders';
export function SnoozeDialog({open,onOpenChange,onSnooze}:{open:boolean;onOpenChange:(open:boolean)=>void;onSnooze:(until:string)=>Promise<void>}) {
  const {t}=useTranslation();
  const [custom,setCustom]=useState(false);
  const [value,setValue]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const submit=async(date:Date|null)=>{
    if(!date || !Number.isFinite(date.getTime()) || date.getTime()<=Date.now()){setError(t('mailReminders.future'));return;}
    setBusy(true);setError('');
    try{await onSnooze(date.toISOString());onOpenChange(false);}catch{setError(t('mailReminders.error'));}finally{setBusy(false);}
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{t('mailReminders.snooze')}</DialogTitle></DialogHeader><div className="flex flex-col gap-2">{(['today','tomorrow','week'] as const).map(kind=><Button key={kind} variant="outline" className="min-h-11 justify-start" disabled={busy || !snoozePreset(kind)} onClick={()=>void submit(snoozePreset(kind))}>{t(`mailReminders.${kind}`)}</Button>)}<Button variant="outline" className="min-h-11 justify-start" disabled={busy} onClick={()=>setCustom(true)}>{t('mailReminders.custom')}</Button>{custom && <><Input type="datetime-local" aria-label={t('mailReminders.dateTime')} value={value} onChange={e=>setValue(e.target.value)} /><Button disabled={busy || !value} onClick={()=>void submit(new Date(value))}>{t('mailReminders.snooze')}</Button></>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div></DialogContent></Dialog>;
}
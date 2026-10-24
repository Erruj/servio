import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Archive, Trash2, MailOpen, Mail, Star, Tag, FolderInput, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { BulkMailAction } from '@/lib/inbox-controls';
export function BulkMailToolbar({ count, busy, onClear, onAction }: {count: number; busy: boolean; onClear: () => void; onAction: (action: BulkMailAction, label?: string) => void}) {
  const {t} = useTranslation();
  const [labelOpen, setLabelOpen] = useState(false);
  const [label, setLabel] = useState('');
  const actions = [{action:'archive', Icon:Archive},{action:'trash',Icon:Trash2},{action:'read',Icon:MailOpen},{action:'unread',Icon:Mail},{action:'star',Icon:Star}] as const;
  return <TooltipProvider><div role="toolbar" aria-label={t('inboxControls.selected',{count})} className="flex flex-wrap items-center gap-1 border-b border-border bg-primary/5 px-3 py-2">
    <span className="text-xs text-muted-foreground mr-auto">{busy ? t('inboxControls.busy') : t('inboxControls.selected',{count})}</span>
    <Button variant="ghost" size="icon" className="h-11 w-11" disabled={busy} aria-label={t('inboxControls.clear')} title={t('inboxControls.clear')} onClick={onClear}><X className="h-4 w-4" /></Button>
    <div className="flex flex-wrap basis-full">
      {actions.map(({action,Icon})=><Tooltip key={action}><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-11 w-11" disabled={busy} aria-label={t(`inboxControls.${action}`)} onClick={()=>onAction(action)}><Icon className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>{t(`inboxControls.${action}`)}</TooltipContent></Tooltip>)}
      <Button variant="ghost" size="icon" className="h-11 w-11" disabled={busy} aria-label={t('inboxControls.label')} title={t('inboxControls.label')} onClick={()=>{setLabel('');setLabelOpen(true);}}><Tag className="h-4 w-4" /></Button>
      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-11 w-11" disabled={busy} aria-label={t('inboxControls.move')} title={t('inboxControls.move')}><FolderInput className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent>{(['inbox','archive','spam','trash'] as const).map(folder=><DropdownMenuItem key={folder} onClick={()=>onAction(folder)}>{t(`mailFolders.${folder}`)}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
    </div>
  </div><Dialog open={labelOpen} onOpenChange={setLabelOpen}><DialogContent><DialogHeader><DialogTitle>{t('inboxControls.labelTitle')}</DialogTitle></DialogHeader><Input aria-label={t('inboxControls.labelName')} maxLength={40} value={label} onChange={e=>setLabel(e.target.value)} onKeyDown={e=>{if(e.key==='Enter' && label.trim()){onAction('label',label.trim());setLabelOpen(false);}}} /><DialogFooter><Button variant="outline" onClick={()=>setLabelOpen(false)}>{t('mailActions.cancel')}</Button><Button disabled={!label.trim() || busy} onClick={()=>{onAction('label',label.trim());setLabelOpen(false);}}>{t('mailActions.add')}</Button></DialogFooter></DialogContent></Dialog></TooltipProvider>;
}
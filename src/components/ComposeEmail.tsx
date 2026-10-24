import { useState, useRef, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, X, Minus, Maximize2, Minimize2, Paperclip, Trash2, Bold, Italic, Underline, List, Link, Quote, Sparkles, FileText, MoreHorizontal } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { useTranslation } from 'react-i18next';
import type { MailItem } from '@/types';
import type { EmailConnection } from '@/types/email';
import { RecipientInput } from '@/components/inbox/RecipientInput';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { addresses, composeRecipients, composeSubject, attachmentFits, textToComposeHtml, DRAFT_SAVE_INTERVAL, type DraftData, type ComposeMode, type ComposeAttachment } from '@/lib/mail-compose';

interface ComposeEmailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasConnection: boolean;
  replyTo?: { to: string; subject: string; emailId: string } | null;
  initialTo?: string;
  mail?: MailItem;
  mode?: ComposeMode;
  inline?: boolean;
  connections?: EmailConnection[];
  draftId?: string;
  initialDraft?: DraftData;
  onSaved?: () => void;
  initialBody?: string;
}
const cleanHtml = (html: string) => DOMPurify.sanitize(html, { ALLOWED_TAGS: ['p','div','br','strong','b','em','i','u','ul','ol','li','a','blockquote'], ALLOWED_ATTR: ['href'], ALLOW_DATA_ATTR: false });
const plainText = (html: string) => {
  const div = document.createElement('div');
  div.innerHTML = cleanHtml(html).replace(/<br\s*\/?>/gi, '\n').replace(/<\/(?:p|div|li)>/gi, '\n');
  return div.textContent || '';
};

export function ComposeEmail(props: ComposeEmailProps) {
  if (!props.open) return null;
  return <ComposerSession key={props.draftId || `${props.mode || 'new'}-${props.mail?.id || props.replyTo?.emailId || props.initialTo || 'new'}`} {...props} />;
}
function ComposerSession({ onOpenChange, hasConnection, initialTo, replyTo, mail, mode = replyTo ? 'reply' : 'new', inline, connections: provided, draftId, initialDraft, onSaved, initialBody }: ComposeEmailProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<EmailConnection[]>(provided || []);
  const [draft, setDraft] = useState<DraftData>(() => initialDraft || {
    mode, originalId: mail?.id || replyTo?.emailId, connectionId: mail?.connectionId || '',
    ...composeRecipients(mail, mode, []), bcc: [],
    to: initialTo ? addresses([initialTo]) : replyTo ? addresses([replyTo.to]) : composeRecipients(mail, mode, []).to,
    subject: composeSubject(mail?.subject || replyTo?.subject || '', mode), html: textToComposeHtml(initialBody || ''),
    quote: mail ? (mode === 'forward' ? `${t('compose.from')}: ${mail.fromEmail || mail.from}\n${t('compose.to')}: ${mail.to.join(', ')}\n${t('compose.subject')}: ${mail.subject}\n${new Date(mail.receivedAt).toLocaleString(i18n.language)}\n\n` : '') + (mail.bodyText || plainText(mail.bodyHtml || mail.body || '')) : '',
    quoteHeading: mail ? mode === 'forward' ? t('compose.forwarded') : t('compose.quoted', { date: new Date(mail.receivedAt).toLocaleString(i18n.language), name: mail.from }) : '',
    attachments: [], originalAttachments: mode === 'forward' ? (mail?.attachments || []).map(a => ({ id: a.id, name: a.name, url: a.url, selected: false })) : [],
  });
  const [ready, setReady] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showCopies, setShowCopies] = useState(!!initialDraft?.cc.length || !!initialDraft?.bcc.length);
  const [showQuote, setShowQuote] = useState((initialDraft?.mode || mode) === 'forward');
  const [status, setStatus] = useState<'saved' | 'saving' | 'error' | ''>('');
  const [sending, setSending] = useState(false);
  const [sendFailure, setSendFailure] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string; body: string }[]>([]);
  const editor = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const id = useRef(draftId || crypto.randomUUID());
  const latest = useRef(draft);
  const lastSaved = useRef(initialDraft ? JSON.stringify(initialDraft) : '');
  const saving = useRef<Promise<boolean> | null>(null);
  const stopped = useRef(false);
  const selectedRange = useRef<Range | null>(null);
  latest.current = draft;
  const patch = (v: Partial<DraftData>) => setDraft(prev => ({ ...prev, ...v }));

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      supabase.from('email_connections_safe').select('id,provider,email_address,is_active').eq('user_id', user.id).eq('is_active', true),
      supabase.from('user_settings').select('email_signature').eq('user_id', user.id).maybeSingle(),
      supabase.from('emails').select('from_email,to_emails,cc_emails').eq('user_id', user.id).neq('folder', 'drafts').order('received_at', { ascending: false }).limit(500),
      supabase.from('customers').select('email').eq('user_id', user.id).not('email', 'is', null).limit(1000),
      supabase.from('templates').select('id,name,body').eq('user_id', user.id).order('name'),
    ]).then(([conn, settings, emails, customers, tmpl]) => {
      if (cancelled) return;
      const active = (provided || (conn.data || []) as unknown as EmailConnection[]).filter(c => c.is_active);
      setConnections(active);
      setSuggestions(addresses([...(emails.data || []).flatMap(e => [e.from_email, ...(e.to_emails || []), ...(e.cc_emails || [])]), ...(customers.data || []).map(c => c.email || '')]));
      setTemplates(tmpl.data || []);
      setDraft(prev => {
        if (initialDraft) return prev;
        const recipients = mail ? composeRecipients(mail, mode, active.map(c => c.email_address)) : { to: prev.to, cc: prev.cc };
        const signature = settings.data?.email_signature;
        return { ...prev, ...recipients, connectionId: prev.connectionId || active[0]?.id || '', html: prev.html + (signature && !plainText(prev.html).includes(signature) ? `<br><br>${textToComposeHtml(signature)}` : '') };
      });
      setReady(true);
    }).catch(() => { if (!cancelled) { setReady(true); setStatus('error'); } });
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => { if (ready && editor.current) editor.current.innerHTML = cleanHtml(latest.current.html); }, [ready]);
  useEffect(() => {
    if (!initialBody || !ready || !editor.current) return;
    const html = textToComposeHtml(initialBody);
    editor.current.innerHTML = html;
    patch({ html });
  }, [initialBody]);

  const save = useCallback(async (): Promise<boolean> => {
    if (!user || stopped.current) return false;
    if (saving.current) { await saving.current; return save(); }
    const data = { ...latest.current, html: cleanHtml(latest.current.html) };
    const serialized = JSON.stringify(data);
    if (serialized === lastSaved.current) return true;
    if (!data.to.length && !data.subject && !plainText(data.html).trim() && !data.attachments.length) return true;
    setStatus('saving');
    const task = (async () => {
      const sender = connections.find(c => c.id === data.connectionId)?.email_address || user.email || '';
      const { error } = await supabase.from('emails').upsert({
        id: id.current, user_id: user.id, external_id: `servio-draft-${id.current}`, connection_id: data.connectionId || null,
        folder: 'drafts', from_email: sender, to_emails: data.to, cc_emails: data.cc, subject: data.subject,
        body_html: data.html, body_text: plainText(data.html), snippet: plainText(data.html).slice(0, 160),
        received_at: new Date().toISOString(), is_read: true, has_attachments: data.attachments.length > 0, draft_data: JSON.parse(serialized),
      }, { onConflict: 'id' });
      if (error) { setStatus('error'); return false; }
      lastSaved.current = serialized; setStatus('saved'); onSaved?.(); return true;
    })();
    saving.current = task;
    try { return await task; } catch { setStatus('error'); return false; } finally { saving.current = null; }
  }, [user?.id, connections, onSaved]);
  const saveRef = useRef(save); saveRef.current = save;
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => { void saveRef.current(); }, DRAFT_SAVE_INTERVAL);
    const flush = () => { void saveRef.current(); };
    document.addEventListener('visibilitychange', flush);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', flush); if (!stopped.current) void saveRef.current(); };
  }, [ready]);
  const close = async () => { if (uncertain || await save()) { stopped.current = true; onOpenChange(false); } };

  const addFiles = async (files: File[]) => {
    const added: ComposeAttachment[] = [];
    for (const file of files) {
      if (!attachmentFits([...latest.current.attachments, ...added], file.size)) { toast({ title: t('compose.tooLarge'), variant: 'destructive' }); continue; }
      try {
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] || ''); reader.onerror = reject; reader.readAsDataURL(file);
        });
        added.push({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, content });
      } catch { toast({ title: t('compose.attachmentError'), variant: 'destructive' }); }
    }
    setDraft(prev => ({ ...prev, attachments: [...prev.attachments, ...added] }));
  };
  const command = (cmd: string, arg?: string) => {
    editor.current?.focus(); document.execCommand(cmd, false, arg);
    if (editor.current) patch({ html: cleanHtml(editor.current.innerHTML) });
  };
  const setEditorText = (text: string) => {
    const html = textToComposeHtml(text); if (editor.current) editor.current.innerHTML = html; patch({ html });
  };
  const ai = async (improve?: string) => {
    if (!improve && !latest.current.originalId) return;
    if (improve && !plainText(latest.current.html).trim()) { toast({ title: t('compose.missingFields'), variant: 'destructive' }); return; }
    setAiBusy(true);
    try {
      if (!(await save())) return;
      const { data, error } = await supabase.functions.invoke('generate-reply', { body: { emailId: improve ? id.current : latest.current.originalId, tone: improve || 'zakelijk', language: i18n.language, ...(improve ? { action: 'improve', text: plainText(latest.current.html) } : {}) } });
      if (error || data?.error || !data?.variants?.[0]?.content) throw new Error('AI');
      setEditorText(data.variants[0].content);
    } catch { toast({ title: t('compose.aiError'), variant: 'destructive' }); } finally { setAiBusy(false); }
  };
  const send = async () => {
    const d = latest.current;
    if (!d.to.length || !d.subject.trim() || !plainText(d.html).trim()) { toast({ title: t('compose.missingFields'), variant: 'destructive' }); return; }
    if (!hasConnection || !d.connectionId) { toast({ title: t('compose.noMailbox'), variant: 'destructive' }); return; }
    if (uncertain) return;
    setSending(true); setSendFailure('');
    try {
      if (!(await save())) return;
      stopped.current = true;
      const quote = d.quote ? `\n\n${d.quoteHeading}\n${d.quote}` : '';
      const { data, error } = await supabase.functions.invoke('send-email', { body: {
        to: d.to, cc: d.cc, bcc: d.bcc, subject: d.subject, body: plainText(d.html) + quote,
        html: cleanHtml(d.html) + (d.quote ? `<blockquote>${textToComposeHtml(d.quoteHeading + '\n' + d.quote)}</blockquote>` : ''),
        mode: d.mode, originalId: d.originalId, draftId: id.current,
        originalAttachments: d.originalAttachments.filter(a => a.selected).map(a => a.id || '*'),
        connection_id: d.connectionId, replyToEmailId: d.mode === 'reply' || d.mode === 'replyAll' ? d.originalId : undefined,
        attachments: d.attachments.map(a => ({ filename: a.name, mimeType: a.type, content: a.content })),
      } });
      if (error || data?.error || data?.errorCode) {
        let details = data;
        if (error instanceof FunctionsHttpError) { try { details = await error.context.json(); } catch { /* use fallback */ } }
        throw new Error(details?.errorCode || (details?.error ? 'limit' : 'network'));
      }
      for (const warning of data?.warnings || []) toast({ title: t(`compose.delivery.${warning}`, { defaultValue: t('compose.delivery.storage_sent') }) });
      toast({ title: t('compose.sent') }); onSaved?.(); onOpenChange(false);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'network';
      stopped.current = code === 'uncertain';
      setUncertain(code === 'uncertain');
      setSendFailure(t(`compose.delivery.${code}`, { defaultValue: t('compose.delivery.network') }));
    } finally { setSending(false); }
  };
  const icon = (label: string, Icon: typeof X, action: () => void) => <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label={label} onMouseDown={e => e.preventDefault()} onClick={action}><Icon className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>;
  return <TooltipProvider><section aria-label={t(`compose.${draft.mode}`)} className={expanded ? 'fixed inset-3 sm:inset-10 z-50 bg-card border border-border shadow-elevated rounded-lg flex flex-col' : inline ? 'border border-border rounded-lg bg-card my-4 min-w-0' : 'fixed bottom-20 md:bottom-4 right-2 sm:right-4 left-2 sm:left-auto sm:w-[580px] max-h-[calc(100dvh-100px)] z-40 bg-card border border-border shadow-elevated rounded-lg flex flex-col'}>
    <header className="flex items-center justify-between border-b border-border px-3 shrink-0">
      <h2 className="font-semibold text-sm truncate">{t(`compose.${draft.mode}`)}</h2>
      <div className="flex">{!inline && icon(t('compose.minimize'), Minus, () => setMinimized(!minimized))}{icon(t(expanded ? 'compose.collapse' : 'compose.expand'), expanded ? Minimize2 : Maximize2, () => { setExpanded(!expanded); setMinimized(false); })}{icon(t('compose.close'), X, () => { void close(); })}</div>
    </header>
    <div className={minimized ? 'hidden' : 'overflow-y-auto min-h-0 p-3 space-y-2'} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void addFiles(Array.from(e.dataTransfer.files)); }}>
      {!ready ? <div className="space-y-3"><Skeleton className="h-11" /><Skeleton className="h-11" /><Skeleton className="h-40" /></div> : <>
        <div className="flex items-center gap-2"><label className="text-sm text-muted-foreground w-12 shrink-0">{t('compose.from')}</label><Select value={draft.connectionId} onValueChange={v => patch({ connectionId: v })}><SelectTrigger className="min-h-11 flex-1" aria-label={t('compose.from')}><SelectValue placeholder={t('compose.from')} /></SelectTrigger><SelectContent>{connections.map(c => <SelectItem key={c.id} value={c.id}>{c.email_address}</SelectItem>)}</SelectContent></Select></div>
        <RecipientInput label={t('compose.to')} value={draft.to} onChange={to => patch({ to })} suggestions={suggestions} />
        <Button variant="ghost" className="min-h-11" onClick={() => setShowCopies(!showCopies)}>{t('compose.cc')} / {t('compose.bcc')}</Button>
        {showCopies && <><RecipientInput label={t('compose.cc')} value={draft.cc} onChange={cc => patch({ cc })} suggestions={suggestions} /><RecipientInput label={t('compose.bcc')} value={draft.bcc} onChange={bcc => patch({ bcc })} suggestions={suggestions} /></>}
        <Input aria-label={t('compose.subject')} placeholder={t('compose.subject')} className="min-h-11" value={draft.subject} onChange={e => patch({ subject: e.target.value })} />
        <div className="flex flex-wrap border-b border-border" role="toolbar" aria-label={t('compose.message')}>
          {icon(t('compose.bold'), Bold, () => command('bold'))}{icon(t('compose.italic'), Italic, () => command('italic'))}{icon(t('compose.underline'), Underline, () => command('underline'))}{icon(t('compose.list'), List, () => command('insertUnorderedList'))}{icon(t('compose.link'), Link, () => { const s = window.getSelection(); selectedRange.current = s?.rangeCount ? s.getRangeAt(0).cloneRange() : null; setLinkOpen(true); })}{icon(t('compose.quote'), Quote, () => command('formatBlock', 'blockquote'))}
        </div>
        {aiBusy && <Skeleton className="h-8 w-3/4" />}
        <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-label={t('compose.message')} aria-multiline="true" className="min-h-44 p-2 outline-none text-sm leading-relaxed break-words [&_ul]:list-disc [&_ul]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_a]:text-primary" onInput={e => patch({ html: cleanHtml(e.currentTarget.innerHTML) })} onPaste={e => { e.preventDefault(); command('insertHTML', textToComposeHtml(e.clipboardData.getData('text/plain'))); }} />
        {draft.quote && <div className="text-xs text-muted-foreground"><Button variant="ghost" className="h-11" aria-label={t('compose.quote')} onClick={() => setShowQuote(!showQuote)}><MoreHorizontal className="h-4 w-4" /></Button>{showQuote && <blockquote className="border-l-2 border-border pl-3 whitespace-pre-wrap break-words max-h-64 overflow-y-auto"><strong>{draft.quoteHeading}</strong><br />{draft.quote}</blockquote>}</div>}
        {draft.originalAttachments.length > 0 && <fieldset className="text-xs space-y-2"><legend>{t('compose.forwardAttachments')}</legend>{draft.originalAttachments.map((a, i) => <label key={i} className="flex items-center gap-2 min-h-11"><input type="checkbox" checked={a.selected} onChange={e => patch({ originalAttachments: draft.originalAttachments.map((att, index) => index === i ? { ...att, selected: e.target.checked } : att) })} />{a.name}</label>)}<p className="text-muted-foreground">{t('compose.delivery.originals')}</p></fieldset>}
        {draft.attachments.map((a, i) => <div key={i} className="flex items-center gap-2 bg-secondary rounded-md pl-2 text-sm"><Paperclip className="h-4 w-4 shrink-0" /><span className="truncate flex-1">{a.name}</span><span className="text-xs">{(a.size / 1024 / 1024).toFixed(1)} MB</span>{icon(t('compose.remove'), X, () => patch({ attachments: draft.attachments.filter((_, x) => x !== i) }))}</div>)}
        <input ref={fileInput} type="file" multiple className="hidden" onChange={e => { void addFiles(Array.from(e.target.files || [])); e.target.value = ''; }} />
        <div className="flex flex-wrap items-center gap-1 border-t border-border pt-2">
          {icon(t('compose.attachment'), Paperclip, () => fileInput.current?.click())}
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="min-h-11 gap-2"><FileText className="h-4 w-4" />{t('compose.template')}</Button></DropdownMenuTrigger><DropdownMenuContent>{templates.length ? templates.map(tmpl => <DropdownMenuItem key={tmpl.id} onSelect={() => { command('insertHTML', textToComposeHtml(tmpl.body)); }}>{tmpl.name}</DropdownMenuItem>) : <DropdownMenuItem disabled>{t('compose.noTemplates')}</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu>
          {draft.originalId && <Button variant="ghost" className="min-h-11 gap-2" disabled={aiBusy} onClick={() => ai()}><Sparkles className="h-4 w-4" />{t('compose.suggest')}</Button>}
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" disabled={aiBusy} className="min-h-11 gap-2"><Sparkles className="h-4 w-4" />{t('compose.improve')}</Button></DropdownMenuTrigger><DropdownMenuContent>{['business','friendly','shorter'].map(style => <DropdownMenuItem key={style} onSelect={() => ai(style)}>{t(`compose.${style}`)}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
        </div>
        {sendFailure && <div role="alert" className="text-sm text-destructive border border-destructive rounded-md p-3 flex flex-wrap items-center gap-2"><span className="flex-1">{t('compose.sendError')} {sendFailure}</span><Button variant="outline" className="min-h-11" disabled={sending || uncertain} onClick={send}>{t('compose.retry')}</Button></div>}
        <footer className="flex items-center flex-wrap gap-2 border-t border-border pt-2">
          <Button className="min-h-11 gap-2" disabled={sending || aiBusy || uncertain} onClick={send}><Send className="h-4 w-4" />{t(sending ? 'compose.sending' : 'compose.send')}</Button>
          <span className={`text-xs flex-1 ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`} role="status">{status ? t(`compose.${status === 'error' ? 'saveError' : status}`) : ''}</span>
          {status === 'error' && <Button variant="outline" className="min-h-11" onClick={() => save()}>{t('compose.retry')}</Button>}
          {icon(t('compose.discard'), Trash2, () => setDiscard(true))}
        </footer>
      </>}
    </div>
    <ConfirmDialog open={discard} onOpenChange={setDiscard} title={t('compose.discardTitle')} description={t('compose.discardDesc')} confirmLabel={t('compose.discard')} cancelLabel={t('compose.close')} variant="destructive" onConfirm={async () => { if (saving.current) await saving.current; stopped.current = true; const { error } = await supabase.from('emails').delete().eq('id', id.current).eq('user_id', user?.id || ''); if (error) { stopped.current = false; setStatus('error'); return; } onSaved?.(); onOpenChange(false); }} />
    <Dialog open={linkOpen} onOpenChange={setLinkOpen}><DialogContent><DialogHeader><DialogTitle>{t('compose.link')}</DialogTitle></DialogHeader><Input aria-label={t('compose.linkUrl')} value={linkUrl} onChange={e => setLinkUrl(e.target.value)} /><Button onClick={() => { try { const url = new URL(linkUrl); if (!['https:','http:'].includes(url.protocol)) throw new Error(); editor.current?.focus(); if (selectedRange.current) { const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(selectedRange.current); } command('createLink', url.href); setLinkOpen(false); setLinkUrl(''); } catch { toast({ title: t('compose.invalidLink'), variant: 'destructive' }); } }}>{t('compose.save')}</Button></DialogContent></Dialog>
  </section></TooltipProvider>;
}

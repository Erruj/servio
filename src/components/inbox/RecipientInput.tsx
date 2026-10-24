import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { addresses, isEmail } from '@/lib/mail-compose';

export function RecipientInput({ label, value, onChange, suggestions }: { label: string; value: string[]; onChange: (v: string[]) => void; suggestions: string[] }) {
  const { t } = useTranslation();
  const id = useId();
  const [input, setInput] = useState('');
  const [invalid, setInvalid] = useState(false);
  const commit = () => {
    if (!input.trim()) return;
    const parsed = addresses([input]);
    if (parsed.some(v => !isEmail(v))) { setInvalid(true); return; }
    onChange(addresses([...value, ...parsed])); setInput(''); setInvalid(false);
  };
  return <div>
    <div className="flex items-start gap-2 border-b border-border py-1">
      <label htmlFor={id} className="text-sm text-muted-foreground w-12 pt-3 shrink-0">{label}</label>
      <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
        {value.map(v => <span key={v} className="bg-secondary text-secondary-foreground inline-flex items-center max-w-full rounded-md pl-2 text-xs break-all">
          {v}<Button type="button" size="icon" variant="ghost" className="h-11 w-11 shrink-0" aria-label={`${t('compose.remove')} ${v}`} onClick={() => onChange(value.filter(x => x !== v))}><X className="w-3 h-3" /></Button>
        </span>)}
        <Input id={id} aria-label={label} list={`${id}-list`} value={input} onChange={e => { setInput(e.target.value); setInvalid(false); }} onBlur={commit} onKeyDown={e => { if (['Enter', ',', ';'].includes(e.key)) { e.preventDefault(); commit(); } }} onPaste={e => { const text = e.clipboardData.getData('text'); if (/[,;\n]/.test(text)) { const parsed = addresses([text.replace(/\n/g, ',')]); if (parsed.every(isEmail)) { e.preventDefault(); onChange(addresses([...value, ...parsed])); } } }} placeholder={t('compose.recipient')} className="min-h-11 min-w-40 w-auto flex-1 border-0 shadow-none" />
        <datalist id={`${id}-list`}>{suggestions.filter(s => !value.includes(s)).slice(0, 200).map(s => <option key={s} value={s} />)}</datalist>
      </div>
    </div>
    {invalid && <p className="text-sm text-destructive" role="alert">{t('compose.invalidEmail')}</p>}
  </div>;
}
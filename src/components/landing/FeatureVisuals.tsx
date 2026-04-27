import { useEffect, useState } from 'react';
import {
  Sparkles,
  Mail,
  CheckCircle2,
  TrendingUp,
  FileText,
  Wand2,
  Bot,
  Send,
  Star,
} from 'lucide-react';

/**
 * Compact, code-built feature visuals that mirror real Servio UI.
 * Lightweight — pure CSS/React, no video. Auto-loop subtle motion.
 */

/* ---------- Shared frame ---------- */
function Frame({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="relative w-full aspect-[16/10] rounded-lg border border-border/60 bg-card shadow-card overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 h-7 border-b border-border/40 bg-muted/40">
        <div className="w-2 h-2 rounded-full bg-border" />
        <div className="w-2 h-2 rounded-full bg-border" />
        <div className="w-2 h-2 rounded-full bg-border" />
        {label && (
          <span className="ml-2 text-[10px] text-muted-foreground font-medium">{label}</span>
        )}
      </div>
      <div className="relative h-[calc(100%-1.75rem)]">{children}</div>
    </div>
  );
}

/* ---------- 1. Inbox / AI mail triage ---------- */
export function InboxVisual() {
  const items = [
    { from: 'Anna Bakker', subj: 'Vraag over offerte', tag: 'Klant', tagClass: 'bg-primary/10 text-primary', unread: true },
    { from: 'Stripe', subj: 'Betaling € 1.250 ontvangen', tag: 'Financieel', tagClass: 'bg-success/10 text-success' },
    { from: 'KPN Zakelijk', subj: 'Factuur november', tag: 'Leverancier', tagClass: 'bg-warning/10 text-warning' },
    { from: 'Tom Janssen', subj: 'Re: Project planning', tag: 'Intern', tagClass: 'bg-muted text-muted-foreground' },
  ];
  return (
    <Frame label="Inbox">
      <div className="p-2 space-y-1.5">
        {items.map((m, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md border border-border/40 ${
              i === 0 ? 'bg-primary/[0.04]' : 'bg-card'
            }`}
            style={{ animation: `fade-in 500ms ease-out ${i * 90}ms both` }}
          >
            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-medium text-muted-foreground shrink-0">
              {m.from.split(' ').map((p) => p[0]).join('').slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-[10px] truncate ${m.unread ? 'font-semibold' : 'font-medium'}`}>
                {m.from}
              </div>
              <div className="text-[9px] text-muted-foreground truncate">{m.subj}</div>
            </div>
            <span className={`text-[8px] px-1.5 py-0.5 rounded font-medium shrink-0 ${m.tagClass}`}>
              {m.tag}
            </span>
            {i === 0 && <Star className="w-2.5 h-2.5 text-warning fill-warning shrink-0" />}
          </div>
        ))}
        <div
          className="mt-2 flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-primary/5 border border-primary/20"
          style={{ animation: 'fade-in 600ms ease-out 500ms both' }}
        >
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[9px] text-primary font-medium">AI sorteerde 12 mails • bespaarde 18 min</span>
        </div>
      </div>
    </Frame>
  );
}

/* ---------- 2. Analytics dashboard ---------- */
export function AnalyticsVisual() {
  const bars = [42, 58, 49, 67, 74, 61, 82, 70, 88, 76, 92, 95];
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);
  return (
    <Frame label="Financieel overzicht">
      <div className="p-3 h-full flex flex-col">
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {[
            { l: 'Omzet', v: '€ 24.380', d: '+12,4%' },
            { l: 'Openstaand', v: '€ 3.210', d: '−€ 540' },
            { l: 'Marge', v: '38%', d: '+3,1%' },
          ].map((s, i) => (
            <div
              key={i}
              className="rounded-md border border-border/50 bg-card p-1.5"
              style={{ animation: `fade-in 500ms ease-out ${i * 80}ms both` }}
            >
              <div className="text-[8px] text-muted-foreground">{s.l}</div>
              <div className="text-[11px] font-semibold">{s.v}</div>
              <div className="text-[8px] text-success">{s.d}</div>
            </div>
          ))}
        </div>
        <div className="flex-1 flex items-end gap-1">
          {bars.map((h, i) => (
            <div
              key={`${tick}-${i}`}
              className="flex-1 rounded-sm bg-gradient-to-t from-primary to-primary/60"
              style={{
                height: `${h}%`,
                animation: `grow-up 700ms ease-out ${i * 40}ms both`,
                transformOrigin: 'bottom',
              }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[9px] text-success">
          <TrendingUp className="w-3 h-3" />
          <span className="font-medium">Beste maand van het jaar — automatisch gematcht</span>
        </div>
      </div>
    </Frame>
  );
}

/* ---------- 3. Document OCR ---------- */
export function DocumentVisual() {
  return (
    <Frame label="Factuur uploaden">
      <div className="p-2.5 h-full flex gap-2">
        <div className="w-[42%] rounded-md border border-border/50 bg-muted/30 p-2 flex flex-col">
          <div className="flex items-center gap-1 mb-1.5">
            <FileText className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-medium truncate">factuur-kpn.pdf</span>
          </div>
          <div className="flex-1 space-y-1">
            <div className="h-1 rounded bg-border w-full" />
            <div className="h-1 rounded bg-border w-4/5" />
            <div className="h-1 rounded bg-border w-3/5" />
            <div className="h-1 rounded bg-border w-full" />
            <div className="h-1 rounded bg-border w-2/3" />
            <div className="h-1 rounded bg-primary/40 w-1/2 mt-1.5" />
            <div className="h-1 rounded bg-primary/40 w-2/5" />
          </div>
          <div className="mt-1.5 h-0.5 rounded-full bg-border overflow-hidden">
            <div className="h-full bg-primary" style={{ animation: 'progress 2.5s ease-out infinite' }} />
          </div>
          <div className="text-[8px] text-muted-foreground mt-1 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-primary" /> AI leest uit...
          </div>
        </div>
        <div className="flex-1 rounded-md border border-border/50 bg-card p-2 space-y-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-semibold">Herkend</span>
            <span className="text-[8px] text-success flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" /> 99%
            </span>
          </div>
          {[
            { l: 'Leverancier', v: 'KPN Zakelijk' },
            { l: 'Factuurnr.', v: 'KPN-11-4421' },
            { l: 'Datum', v: '01-11-2026' },
            { l: 'BTW (21%)', v: '€ 18,74' },
            { l: 'Totaal', v: '€ 107,99', h: true },
          ].map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-[9px] py-0.5 border-b border-border/30 last:border-0"
              style={{ animation: `fade-in 400ms ease-out ${300 + i * 100}ms both` }}
            >
              <span className="text-muted-foreground">{f.l}</span>
              <span className={f.h ? 'font-semibold text-primary' : 'font-medium'}>{f.v}</span>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/* ---------- 4. AI Reply Generator ---------- */
export function AIReplyVisual() {
  const reply = `Hoi Anna,\n\nEind januari is haalbaar — we leveren in week 4. Ik stuur de aangepaste offerte vandaag door.\n\nGroet,\nMark`;
  const [out, setOut] = useState('');
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    setOut('');
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setOut(reply.slice(0, i));
      if (i >= reply.length) {
        clearInterval(id);
        setTimeout(() => setCycle((c) => c + 1), 2500);
      }
    }, 30);
    return () => clearInterval(id);
  }, [cycle]);

  return (
    <Frame label="AI antwoord">
      <div className="p-2.5 h-full flex flex-col">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">
            <Wand2 className="w-3 h-3 text-primary" />
          </div>
          <span className="text-[10px] font-semibold">Professioneel antwoord</span>
          <span className="ml-auto text-[8px] text-success flex items-center gap-0.5">
            <Bot className="w-2.5 h-2.5" /> Gemini-3
          </span>
        </div>
        <div className="flex-1 rounded-md border border-border/50 bg-muted/20 p-2 text-[10px] leading-relaxed whitespace-pre-line text-foreground/90 overflow-hidden">
          {out}
          <span className="inline-block w-[2px] h-2.5 bg-primary/70 align-middle ml-0.5 animate-pulse" />
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <div className="text-[9px] px-2 py-1 rounded-md bg-primary text-primary-foreground font-medium flex items-center gap-1">
            <Send className="w-2.5 h-2.5" /> Verstuur
          </div>
          <div className="text-[9px] px-2 py-1 rounded-md border border-border text-foreground/70">
            Aanpassen
          </div>
          <span className="ml-auto text-[8px] text-muted-foreground flex items-center gap-1">
            <Mail className="w-2.5 h-2.5" /> 1.2s
          </span>
        </div>
      </div>
    </Frame>
  );
}

export const featureVisuals = [InboxVisual, AnalyticsVisual, DocumentVisual, AIReplyVisual];

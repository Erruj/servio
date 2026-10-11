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
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'motion/react';
import { getPreviewCopy } from './productPreviewCopy';

const useCopy = () => getPreviewCopy(useTranslation().i18n.language);

/**
 * Compact, code-built feature visuals that mirror real Servio UI.
 * Lightweight — pure CSS/React, no video. Auto-loop subtle motion.
 */

/* ---------- Shared frame ---------- */
function Frame({ children, label }: { children: React.ReactNode; label?: string }) {
  const c = useCopy();
  return (
    <div data-frame className="relative w-full aspect-[16/10] rounded-lg border border-border/60 bg-card shadow-card overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 h-7 border-b border-border/40 bg-muted/40">
        <div className="w-2 h-2 rounded-full bg-border" />
        <div className="w-2 h-2 rounded-full bg-border" />
        <div className="w-2 h-2 rounded-full bg-border" />
        {label && (
          <span className="ml-2 text-[10px] text-muted-foreground font-medium">{label}</span>
        )}
        <span className="ml-auto text-[9px] text-muted-foreground/70 font-medium">{c.sample}</span>
      </div>
      <div className="relative h-[calc(100%-1.75rem)]">{children}</div>
    </div>
  );
}

/* ---------- 1. Inbox / AI mail triage ---------- */
export function InboxVisual() {
  const c = useCopy();
  const items = [
    { from: c.mails[0].from, subj: c.mails[0].subj, tag: c.fv.tags[0], tagClass: 'bg-primary/10 text-primary', unread: true },
    { from: 'Drukkerij De Vries', subj: c.mails[1].subj, tag: c.fv.tags[1], tagClass: 'bg-success/10 text-success' },
    { from: c.mails[2].from, subj: c.mails[2].subj, tag: c.fv.tags[2], tagClass: 'bg-warning/10 text-warning' },
    { from: c.mails[3].from, subj: c.mails[3].subj, tag: c.fv.tags[3], tagClass: 'bg-muted text-muted-foreground' },
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
          <span className="text-[9px] text-primary font-medium">{c.fv.sorted}</span>
        </div>
      </div>
    </Frame>
  );
}

/* ---------- 2. Analytics dashboard ---------- */
export function AnalyticsVisual() {
  const c = useCopy();
  const bars = [42, 58, 49, 67, 74, 61, 82, 70, 88, 76, 92, 95];
  return (
    <Frame label={c.finTitle}>
      <div className="p-3 h-full flex flex-col">
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {[
            { l: c.stats[0], v: '€ 24.380', d: '+12,4%' },
            { l: c.stats[1], v: '€ 3.210', d: '−€ 540' },
            { l: c.fv.margin, v: '38%', d: '+3,1%' },
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
        <div className="flex h-16 shrink-0 items-end gap-1.5">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              className="w-full origin-bottom rounded-t-md bg-gradient-to-t from-primary to-primary/60"
              style={{ height: `${h}%` }}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[9px] text-success">
          <TrendingUp className="w-3 h-3" />
          <span className="font-medium">{c.fv.best}</span>
        </div>
      </div>
    </Frame>
  );
}

/* ---------- 3. Document OCR ---------- */
export function DocumentVisual() {
  const c = useCopy();
  return (
    <Frame label={c.upload}>
      <div className="p-2.5 h-full flex gap-2">
        <div className="w-[42%] rounded-md border border-border/50 bg-muted/30 p-2 flex flex-col">
          <div className="flex items-center gap-1 mb-1.5">
            <FileText className="w-3 h-3 text-primary" />
            <span className="text-[9px] font-medium truncate">{c.file}</span>
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
            <Sparkles className="w-2.5 h-2.5 text-primary" /> {c.fv.reading}
          </div>
        </div>
        <div className="flex-1 rounded-md border border-border/50 bg-card p-2 space-y-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-semibold">{c.fv.recognized}</span>
            <span className="text-[8px] text-success flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" /> 99%
            </span>
          </div>
          {[
            { l: c.fields[0], v: 'Telecom Noord B.V.' },
            { l: c.fv.invNo, v: 'TN-11-4421' },
            { l: c.fields[2], v: '01-11-2026' },
            { l: c.fields[5], v: '€ 18,74' },
            { l: c.fields[6], v: '€ 107,99', h: true },
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
  const c = useCopy();
  const reply = c.fv.shortReply;
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
  }, [cycle, reply]);

  return (
    <Frame label={c.fv.aiReply}>
      <div className="p-2.5 h-full flex flex-col">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">
            <Wand2 className="w-3 h-3 text-primary" />
          </div>
          <span className="text-[10px] font-semibold">{c.fv.profReply}</span>
          <span className="ml-auto text-[8px] text-success flex items-center gap-0.5">
            <Bot className="w-2.5 h-2.5" /> AI
          </span>
        </div>
        <div className="flex-1 rounded-md border border-border/50 bg-muted/20 p-2 text-[10px] leading-relaxed whitespace-pre-line text-foreground/90 overflow-hidden">
          {out}
          <span className="inline-block w-[2px] h-2.5 bg-primary/70 align-middle ml-0.5 animate-pulse" />
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <div className="text-[9px] px-2 py-1 rounded-md bg-primary text-primary-foreground font-medium flex items-center gap-1">
            <Send className="w-2.5 h-2.5" /> {c.send}
          </div>
          <div className="text-[9px] px-2 py-1 rounded-md border border-border text-foreground/70">
            {c.adjust}
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

const ASSIST_COPY: Record<string, { q: string; a: string; cats: [string, string, string]; label: string; pills: [string, string, string] }> = {
  nl: { q: 'Hoeveel heb ik dit kwartaal aan software uitgegeven?', a: '€ 1.284 in Q3, 18% minder dan Q2.', cats: ['Software', 'Telefoon', 'Hosting'], label: 'AI-assistent', pills: ['Versleuteld', 'EU-hosting', 'AVG'] },
  en: { q: 'How much did I spend on software this quarter?', a: '€1,284 in Q3, 18% less than Q2.', cats: ['Software', 'Phone', 'Hosting'], label: 'AI assistant', pills: ['Encrypted', 'EU hosting', 'GDPR'] },
  de: { q: 'Wie viel habe ich dieses Quartal für Software ausgegeben?', a: '1.284 € in Q3, 18 % weniger als Q2.', cats: ['Software', 'Telefon', 'Hosting'], label: 'KI-Assistent', pills: ['Verschlüsselt', 'EU-Hosting', 'DSGVO'] },
  fr: { q: 'Combien ai-je dépensé en logiciels ce trimestre ?', a: '1 284 € au T3, 18 % de moins qu’au T2.', cats: ['Logiciels', 'Téléphone', 'Hébergement'], label: 'Assistant IA', pills: ['Chiffré', 'Hébergement UE', 'RGPD'] },
  es: { q: '¿Cuánto he gastado en software este trimestre?', a: '1.284 € en el T3, un 18 % menos que en el T2.', cats: ['Software', 'Teléfono', 'Hosting'], label: 'Asistente IA', pills: ['Cifrado', 'Hosting UE', 'RGPD'] },
};
const useAssist = () => ASSIST_COPY[(useTranslation().i18n.language || 'nl').slice(0, 2)] ?? ASSIST_COPY.nl;

/* ---------- 5. AI accounting assistant ---------- */
export function AssistantVisual() {
  const a = useAssist();
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  const d = (s: number) => (reduce ? 0 : s);
  return (
    <div className="h-full w-full" onMouseEnter={() => setRun((r) => r + 1)}>
      <Frame label={a.label}>
        <motion.div key={run} className="flex h-full flex-col gap-1.5 p-2.5" initial="hidden" whileInView="show" viewport={{ once: true }}>
          <motion.div
            variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { delay: d(0.1), duration: 0.3 } } }}
            className="ml-auto max-w-[80%] rounded-xl rounded-br-sm bg-primary px-2.5 py-1.5 text-[10px] text-primary-foreground"
          >
            {a.q}
          </motion.div>
          {!reduce && (
            <motion.div
              variants={{ hidden: { opacity: 0 }, show: { opacity: [0, 1, 1, 0], transition: { delay: 0.5, duration: 1.1, times: [0, 0.15, 0.85, 1] } } }}
              className="flex w-fit gap-1 rounded-xl bg-muted px-2.5 py-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-1 w-1 rounded-full bg-muted-foreground" animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} />
              ))}
            </motion.div>
          )}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { delay: d(1.6), duration: 0.3 } } }}
            className="mr-auto w-[85%] rounded-xl rounded-bl-sm border border-border/60 bg-card px-2.5 py-1.5"
          >
            <p className="text-[10px] font-medium">{a.a}</p>
            <div className="mt-1.5 space-y-1">
              {a.cats.map((c, i) => (
                <div key={c} className="flex items-center gap-1.5">
                  <span className="w-14 shrink-0 truncate text-[8px] text-muted-foreground">{c}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full origin-left rounded-full bg-primary"
                      style={{ width: `${[78, 45, 28][i]}%` }}
                      variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { delay: d(1.9 + i * 0.15), duration: 0.5 } } }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </Frame>
    </div>
  );
}

/* ---------- 6. Security & GDPR ---------- */
export function SecurityVisual() {
  const a = useAssist();
  const reduce = useReducedMotion();
  const pos = ['left-[8%] top-[22%]', 'right-[8%] top-[30%]', 'left-1/2 bottom-[10%] -translate-x-1/2'];
  return (
    <Frame label="Security">
      <div className="relative flex h-full items-center justify-center overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute rounded-full border border-primary/30"
            style={{ width: 56 + i * 32, height: 56 + i * 32 }}
            animate={reduce ? undefined : { scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
            transition={{ repeat: Infinity, duration: 3, delay: i * 0.6, ease: 'easeInOut' }}
          />
        ))}
        <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-7 w-7 text-primary" />
        </div>
        {a.pills.map((p, i) => (
          <motion.span
            key={p}
            className={`absolute z-10 rounded-full border border-border/60 bg-card px-2 py-0.5 text-[9px] font-medium shadow-sm ${pos[i]}`}
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: reduce ? 0 : 0.3 + i * 0.25, duration: 0.3 }}
          >
            {p}
          </motion.span>
        ))}
      </div>
    </Frame>
  );
}

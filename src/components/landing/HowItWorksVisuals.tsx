import { useEffect, useRef, useState } from 'react';
import { motion, animate, useInView, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Check, Mail, Server, Send } from 'lucide-react';

type Copy = {
  synced: string; mails: { from: string; subj: string }[]; labels: [string, string, string, string];
  reply: string; send: string; revenue: string; open: string; processed: string; ai: string;
};
const COPY: Record<string, Copy> = {
  nl: { synced: 'e-mails gesynchroniseerd', mails: [{ from: 'Anna B.', subj: 'Levering eind januari?' }, { from: 'Drukkerij De Vries', subj: 'Factuur 2026-118' }, { from: 'Mark de V.', subj: 'Server ligt eruit!' }, { from: 'Team Servio', subj: 'Planning volgende week' }], labels: ['Klant', 'Factuur', 'Urgent', 'Intern'], reply: 'Hoi Anna, bedankt voor je bericht! Eind januari leveren kan zeker…', send: 'Verstuur', revenue: 'Omzet deze maand', open: 'Openstaand', processed: 'Facturen verwerkt', ai: 'AI-suggestie' },
  en: { synced: 'emails synced', mails: [{ from: 'Anna B.', subj: 'Delivery end of January?' }, { from: 'De Vries Printing', subj: 'Invoice 2026-118' }, { from: 'Mark de V.', subj: 'Server is down!' }, { from: 'Team Servio', subj: 'Planning next week' }], labels: ['Customer', 'Invoice', 'Urgent', 'Internal'], reply: 'Hi Anna, thanks for your message! Delivering end of January is no problem…', send: 'Send', revenue: 'Revenue this month', open: 'Outstanding', processed: 'Invoices processed', ai: 'AI suggestion' },
  de: { synced: 'E-Mails synchronisiert', mails: [{ from: 'Anna B.', subj: 'Lieferung Ende Januar?' }, { from: 'Druckerei De Vries', subj: 'Rechnung 2026-118' }, { from: 'Mark de V.', subj: 'Server ist ausgefallen!' }, { from: 'Team Servio', subj: 'Planung nächste Woche' }], labels: ['Kunde', 'Rechnung', 'Dringend', 'Intern'], reply: 'Hallo Anna, danke für deine Nachricht! Eine Lieferung Ende Januar ist kein Problem…', send: 'Senden', revenue: 'Umsatz diesen Monat', open: 'Offen', processed: 'Rechnungen verarbeitet', ai: 'KI-Vorschlag' },
  fr: { synced: 'e-mails synchronisés', mails: [{ from: 'Anna B.', subj: 'Livraison fin janvier ?' }, { from: 'Imprimerie De Vries', subj: 'Facture 2026-118' }, { from: 'Mark de V.', subj: 'Le serveur est en panne !' }, { from: 'Équipe Servio', subj: 'Planning semaine prochaine' }], labels: ['Client', 'Facture', 'Urgent', 'Interne'], reply: 'Bonjour Anna, merci pour ton message ! Une livraison fin janvier est tout à fait possible…', send: 'Envoyer', revenue: 'Chiffre d’affaires ce mois', open: 'En attente', processed: 'Factures traitées', ai: 'Suggestion IA' },
  es: { synced: 'correos sincronizados', mails: [{ from: 'Anna B.', subj: '¿Entrega a finales de enero?' }, { from: 'Imprenta De Vries', subj: 'Factura 2026-118' }, { from: 'Mark de V.', subj: '¡El servidor no funciona!' }, { from: 'Equipo Servio', subj: 'Planificación próxima semana' }], labels: ['Cliente', 'Factura', 'Urgente', 'Interno'], reply: '¡Hola Anna, gracias por tu mensaje! Entregar a finales de enero no es problema…', send: 'Enviar', revenue: 'Ingresos este mes', open: 'Pendiente', processed: 'Facturas procesadas', ai: 'Sugerencia IA' },
};
const useCopy = () => COPY[(useTranslation().i18n.language || 'nl').slice(0, 2)] ?? COPY.nl;
const nf = (lng: string) => new Intl.NumberFormat(lng.startsWith('en') ? 'en-GB' : 'nl-NL');

/** Restarts (via key) whenever the panel enters view and then loops every `loopMs`. */
function useReplay(loopMs = 9000) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5 });
  const reduce = !!useReducedMotion();
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!inView || reduce) return;
    setK((x) => x + 1);
    const id = window.setInterval(() => setK((x) => x + 1), loopMs);
    return () => window.clearInterval(id);
  }, [inView, reduce, loopMs]);
  return { ref, k, reduce };
}

function useCounter(to: number, k: number, reduce: boolean, delay = 0, duration = 1.6) {
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) { setV(to); return; }
    setV(0);
    const c = animate(0, to, { duration, delay, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [k, to, reduce, delay, duration]);
  return v;
}

function Panel({ children, innerRef }: { children: React.ReactNode; innerRef: React.RefObject<HTMLDivElement> }) {
  return (
    <div ref={innerRef} className="flex h-full min-h-[22rem] w-full flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      {children}
    </div>
  );
}

function Sample() {
  const { t } = useTranslation();
  return <p className="mt-auto text-right text-[10px] text-slate-500">{t('marketing.landing.sampleData')}</p>;
}

/* ---------- 01 Connect ---------- */
export function ConnectAnim() {
  const { t, i18n } = useTranslation();
  const c = useCopy();
  const { ref, k, reduce } = useReplay();
  const count = useCounter(128, k, reduce, 2.4, 1.4);
  const rows = [
    { name: 'Outlook / Microsoft 365', Icon: Mail, delay: 0.2 },
    { name: t('marketing.landing.imap'), Icon: Server, delay: 1.3 },
  ];
  return (
    <Panel innerRef={ref}>
      <p className="text-sm font-semibold text-white">{t('marketing.landing.connectTitle')}</p>
      <div key={k} className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.name} className="rounded-2xl bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-3 text-sm text-slate-200"><r.Icon className="h-4 w-4 text-blue-300" />{r.name}</span>
              <motion.span
                initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: r.delay + 1, type: 'spring', stiffness: 400, damping: 20 }}
                className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs text-emerald-200"
              >
                <Check className="h-3 w-3" />{t('marketing.landing.connected')}
              </motion.span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full origin-left rounded-full bg-blue-500"
                initial={reduce ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: r.delay, duration: 1, ease: 'easeInOut' }}
              />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 opacity-60">
          <span className="flex items-center gap-3 text-sm text-slate-300"><Mail className="h-4 w-4 text-slate-400" />Gmail</span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-slate-400">{t('marketing.landing.comingSoon')}</span>
        </div>
      </div>
      <p className="text-sm text-slate-300"><span className="font-semibold tabular-nums text-white">{nf(i18n.language).format(count)}</span> {c.synced}</p>
      <Sample />
    </Panel>
  );
}

/* ---------- 02 Automate ---------- */
const LABEL_CLS = ['bg-blue-500/20 text-blue-200', 'bg-amber-500/20 text-amber-200', 'bg-red-500/20 text-red-200', 'bg-purple-500/20 text-purple-200'];
export function AutomateAnim() {
  const c = useCopy();
  const { ref, k, reduce } = useReplay(11000);
  const [typed, setTyped] = useState(reduce ? c.reply.length : 0);
  useEffect(() => {
    if (reduce) { setTyped(c.reply.length); return; }
    setTyped(0);
    let i = 0;
    let id = 0;
    const start = window.setTimeout(() => {
      id = window.setInterval(() => { i += 1; setTyped(i); if (i >= c.reply.length) window.clearInterval(id); }, 35);
    }, 2300);
    return () => { window.clearTimeout(start); window.clearInterval(id); };
  }, [k, reduce, c.reply]);
  return (
    <Panel innerRef={ref}>
      <div key={k} className="flex flex-col gap-2">
        {c.mails.map((m, i) => (
          <motion.div
            key={m.from}
            initial={reduce ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.25, duration: 0.3, ease: 'easeOut' }}
            className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-2.5"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm text-slate-100">{m.from}</span>
              <span className="block truncate text-xs text-slate-400">{m.subj}</span>
            </span>
            <motion.span
              initial={reduce ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.25 + 0.3, type: 'spring', stiffness: 500, damping: 18 }}
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${LABEL_CLS[i]}`}
            >
              {c.labels[i]}
            </motion.span>
          </motion.div>
        ))}
        <motion.div
          initial={reduce ? false : { opacity: 0, scaleY: 0.6 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ delay: 1.8, duration: 0.35, ease: 'easeOut' }}
          className="origin-top rounded-2xl border border-blue-400/30 bg-blue-500/10 p-3"
        >
          <p className="text-[11px] font-medium text-blue-200">{c.ai}</p>
          <p className="mt-1 min-h-[2.5rem] text-sm text-slate-100">
            {c.reply.slice(0, typed)}
            {!reduce && <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-white align-middle" />}
          </p>
          <div className="mt-2 flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-blue-600 px-3 py-1.5 text-xs font-medium text-white">
              <Send className="h-3 w-3" />{c.send}
            </span>
          </div>
        </motion.div>
      </div>
    </Panel>
  );
}

/* ---------- 03 Overview ---------- */
const BARS = [38, 52, 45, 61, 58, 72, 68, 86];
export function OverviewAnim() {
  const c = useCopy();
  const { i18n } = useTranslation();
  const { ref, k, reduce } = useReplay();
  const revenue = useCounter(24380, k, reduce, 0.1, 1.6);
  const path = BARS.map((h, i) => `${i === 0 ? 'M' : 'L'} ${(i + 0.5) * 12.5} ${100 - h}`).join(' ');
  return (
    <Panel innerRef={ref}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">{c.revenue}</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-white">€ {nf(i18n.language).format(revenue)}</p>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-200">▲ 12,4%</span>
      </div>
      <div key={k} className="relative h-32 shrink-0">
        <div className="flex h-full items-end gap-1.5">
          {BARS.map((h, i) => (
            <motion.div
              key={i}
              className="w-full origin-bottom rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400"
              style={{ height: `${h}%` }}
              initial={reduce ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
            />
          ))}
        </div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
          <motion.path
            d={path}
            fill="none"
            stroke="white"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 1.1, duration: 1.2, ease: 'easeInOut' }}
          />
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white/5 px-3 py-2">
          <p className="text-[11px] text-slate-400">{c.open}</p>
          <p className="text-sm font-semibold text-white">€ {nf(i18n.language).format(3210)}</p>
        </div>
        <div className="rounded-2xl bg-white/5 px-3 py-2">
          <p className="text-[11px] text-slate-400">{c.processed}</p>
          <p className="text-sm font-semibold text-white">38</p>
        </div>
      </div>
      <Sample />
    </Panel>
  );
}

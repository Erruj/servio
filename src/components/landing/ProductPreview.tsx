import { useEffect, useState } from 'react';
import {
  Inbox,
  LayoutDashboard,
  FileText,
  Receipt,
  Sparkles,
  Search,
  Star,
  Paperclip,
  Send,
  CheckCircle2,
  TrendingUp,
  Upload,
  Wand2,
} from 'lucide-react';

/**
 * ProductPreview
 * A lightweight, code-built animated mockup of the real Servio UI.
 * Cycles through 4 scenes: Inbox → AI Reply → Dashboard → Invoice Upload.
 * Pure CSS/React — no video, no heavy libs.
 */

type Scene = 0 | 1 | 2 | 3;
const SCENE_DURATION = 4200; // ms per scene

export function ProductPreview() {
  const [scene, setScene] = useState<Scene>(0);

  useEffect(() => {
    const id = setInterval(() => {
      setScene((s) => ((s + 1) % 4) as Scene);
    }, SCENE_DURATION);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-full h-full bg-[hsl(220_14%_98%)] text-foreground overflow-hidden flex">
      {/* Sidebar */}
      <aside className="hidden sm:flex w-[180px] shrink-0 flex-col border-r border-border/60 bg-[hsl(220_14%_97%)]">
        <div className="flex items-center gap-2 px-4 h-12 border-b border-border/60">
          <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-[13px] font-semibold tracking-tight">Servio</span>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 text-[12px]">
          <NavItem icon={Inbox} label="Inbox" active={scene === 0 || scene === 1} badge="12" />
          <NavItem icon={LayoutDashboard} label="Dashboard" active={scene === 2} />
          <NavItem icon={Receipt} label="Facturen" active={scene === 3} />
          <NavItem icon={FileText} label="Documenten" />
          <NavItem icon={TrendingUp} label="Analytics" />
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium truncate">Mark de Vries</div>
              <div className="text-[10px] text-muted-foreground truncate">Pro plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main canvas */}
      <div className="flex-1 relative min-w-0">
        {/* Topbar */}
        <div className="h-12 border-b border-border/60 flex items-center px-4 gap-3 bg-card">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[12px] text-muted-foreground">Zoeken in Servio...</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Synced
          </div>
        </div>

        {/* Scene container */}
        <div className="relative h-[calc(100%-3rem)]">
          <SceneWrap visible={scene === 0}><InboxScene /></SceneWrap>
          <SceneWrap visible={scene === 1}><ReplyScene /></SceneWrap>
          <SceneWrap visible={scene === 2}><DashboardScene /></SceneWrap>
          <SceneWrap visible={scene === 3}><InvoiceScene /></SceneWrap>
        </div>

        {/* Scene indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                scene === i ? 'w-6 bg-primary' : 'w-1.5 bg-border'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------- shared bits -------------------- */

function NavItem({
  icon: Icon,
  label,
  active,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-colors ${
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
          {badge}
        </span>
      )}
    </div>
  );
}

function SceneWrap({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`absolute inset-0 transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      {children}
    </div>
  );
}

/* -------------------- Scene 1: Inbox -------------------- */

const inboxItems = [
  { from: 'Anna Bakker', subj: 'Vraag over offerte 2026-104', snippet: 'Hoi, kunnen we de levertijd nog bespreken?', time: '09:42', unread: true, label: 'Klant' },
  { from: 'Stripe', subj: 'Betaling ontvangen — €1.250,00', snippet: 'Factuur INV-0421 is voldaan door Bakker BV.', time: '09:21', label: 'Financieel' },
  { from: 'KPN Zakelijk', subj: 'Factuur november beschikbaar', snippet: 'Uw maandfactuur staat klaar in het portaal.', time: '08:55', label: 'Leverancier' },
  { from: 'Tom Janssen', subj: 'Re: Project planning Q2', snippet: 'Top, dan plannen we de kickoff voor dinsdag.', time: 'Gister', label: 'Intern' },
  { from: 'Belastingdienst', subj: 'Bevestiging BTW-aangifte', snippet: 'Uw aangifte over Q3 is succesvol verwerkt.', time: 'Gister', label: 'Overheid' },
];

function InboxScene() {
  return (
    <div className="h-full flex animate-fade-in">
      <div className="w-full md:w-[55%] border-r border-border/60 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between">
          <div className="text-[13px] font-semibold">Inbox</div>
          <div className="text-[11px] text-muted-foreground">12 ongelezen</div>
        </div>
        <div>
          {inboxItems.map((m, i) => (
            <div
              key={i}
              className={`px-4 py-2.5 border-b border-border/40 flex items-start gap-3 ${
                i === 0 ? 'bg-primary/[0.04]' : ''
              }`}
              style={{ animation: `fade-in 400ms ease-out ${i * 60}ms both` }}
            >
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground shrink-0">
                {m.from.split(' ').map((p) => p[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-[12px] truncate ${m.unread ? 'font-semibold' : 'font-medium'}`}>
                    {m.from}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{m.time}</span>
                </div>
                <div className="text-[12px] truncate text-foreground/90">{m.subj}</div>
                <div className="text-[11px] text-muted-foreground truncate">{m.snippet}</div>
              </div>
              {i === 0 && <Star className="w-3 h-3 text-warning fill-warning shrink-0 mt-1" />}
            </div>
          ))}
        </div>
      </div>
      {/* Preview pane */}
      <div className="hidden md:flex flex-1 flex-col p-4">
        <div className="text-[13px] font-semibold mb-1">Vraag over offerte 2026-104</div>
        <div className="text-[11px] text-muted-foreground mb-3">Anna Bakker • anna@bakkerbv.nl</div>
        <div className="text-[12px] text-foreground/80 leading-relaxed space-y-2">
          <p>Hoi,</p>
          <p>Bedankt voor de offerte. We willen graag akkoord, maar kunnen we de levertijd nog bespreken? Eind januari zou ideaal zijn.</p>
          <p>Groet,<br />Anna</p>
        </div>
        <div className="mt-auto pt-3 border-t border-border/60 flex items-center gap-2">
          <div className="text-[11px] px-2 py-1 rounded-md bg-primary/10 text-primary flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> AI suggestie beschikbaar
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Scene 2: AI Reply -------------------- */

function ReplyScene() {
  const reply = `Hoi Anna,\n\nBedankt voor je bericht. Eind januari is haalbaar — we kunnen leveren in week 4. Ik stuur de aangepaste offerte vandaag nog door.\n\nMet vriendelijke groet,\nMark`;
  return (
    <div className="h-full flex animate-fade-in">
      <div className="hidden md:block w-[35%] border-r border-border/60 p-4">
        <div className="text-[12px] font-semibold mb-2">Origineel bericht</div>
        <div className="text-[11px] text-muted-foreground leading-relaxed">
          Hoi, bedankt voor de offerte. We willen graag akkoord, maar kunnen we de levertijd nog bespreken? Eind januari zou ideaal zijn.
        </div>
      </div>
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
            <Wand2 className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-[12px] font-semibold">AI antwoord — professioneel</span>
          <span className="ml-auto text-[10px] text-success flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Gegenereerd in 1.2s
          </span>
        </div>

        <div className="flex-1 rounded-lg border border-border/60 bg-card p-3 text-[12px] leading-relaxed whitespace-pre-line text-foreground/90 relative overflow-hidden">
          <Typewriter text={reply} />
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Gemini-3
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button className="text-[11px] px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium flex items-center gap-1.5">
            <Send className="w-3 h-3" /> Verstuur
          </button>
          <button className="text-[11px] px-3 py-1.5 rounded-md border border-border text-foreground/70">
            Aanpassen
          </button>
          <button className="text-[11px] px-3 py-1.5 rounded-md border border-border text-foreground/70">
            Opnieuw genereren
          </button>
        </div>
      </div>
    </div>
  );
}

function Typewriter({ text }: { text: string }) {
  const [out, setOut] = useState('');
  useEffect(() => {
    setOut('');
    let i = 0;
    const id = setInterval(() => {
      i += 3;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, [text]);
  return <>{out}<span className="inline-block w-[2px] h-3 bg-primary/70 align-middle ml-0.5 animate-pulse" /></>;
}

/* -------------------- Scene 3: Dashboard -------------------- */

function DashboardScene() {
  const stats = [
    { label: 'Omzet (mnd)', value: '€ 24.380', delta: '+12,4%', positive: true },
    { label: 'Openstaand', value: '€ 3.210', delta: '−€ 540', positive: true },
    { label: 'Auto-replies', value: '128', delta: '+22%', positive: true },
    { label: 'Tijd bespaard', value: '14u', delta: 'deze maand', positive: true },
  ];
  const bars = [38, 52, 44, 61, 70, 58, 76, 64, 82, 71, 88, 92];
  return (
    <div className="h-full p-4 overflow-hidden animate-fade-in">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-[14px] font-semibold">Financieel overzicht</div>
          <div className="text-[11px] text-muted-foreground">November 2026</div>
        </div>
        <div className="text-[10px] px-2 py-1 rounded-md bg-success/10 text-success font-medium">
          Live data
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {stats.map((s, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/60 bg-card p-2.5"
            style={{ animation: `fade-in 500ms ease-out ${i * 80}ms both` }}
          >
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
            <div className="text-[14px] font-semibold mt-0.5">{s.value}</div>
            <div className="text-[10px] text-success mt-0.5">{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border/60 bg-card p-3 h-[140px] flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-medium">Omzet per week</div>
          <div className="flex gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary" /> 2026</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-border" /> 2025</span>
          </div>
        </div>
        <div className="flex-1 flex items-end gap-1.5">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full rounded-sm bg-primary/80"
                style={{
                  height: `${h}%`,
                  animation: `grow-up 700ms ease-out ${i * 50}ms both`,
                  transformOrigin: 'bottom',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-border/60 bg-card p-2.5 flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-success/10 flex items-center justify-center">
          <TrendingUp className="w-3.5 h-3.5 text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium">3 nieuwe betalingen ontvangen</div>
          <div className="text-[10px] text-muted-foreground">Automatisch gematcht aan facturen</div>
        </div>
        <div className="text-[11px] font-semibold text-success">+€ 2.180</div>
      </div>
    </div>
  );
}

/* -------------------- Scene 4: Invoice Upload -------------------- */

function InvoiceScene() {
  return (
    <div className="h-full p-4 flex gap-3 animate-fade-in">
      <div className="w-[45%] flex flex-col">
        <div className="text-[13px] font-semibold mb-2">Factuur uploaden</div>
        <div className="flex-1 rounded-lg border-2 border-dashed border-primary/30 bg-primary/[0.03] flex flex-col items-center justify-center p-4 text-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <div className="text-[12px] font-medium">factuur-kpn-nov.pdf</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">128 KB</div>
          <div className="w-full h-1 rounded-full bg-border mt-3 overflow-hidden">
            <div className="h-full bg-primary" style={{ animation: 'progress 2.5s ease-out forwards' }} />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" /> AI leest factuur uit...
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-lg border border-border/60 bg-card p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[12px] font-semibold">Herkende gegevens</div>
          <div className="text-[10px] text-success flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 99% zeker
          </div>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <Field label="Leverancier" value="KPN Zakelijk B.V." />
          <Field label="Factuurnummer" value="KPN-2026-11-4421" />
          <Field label="Datum" value="01-11-2026" />
          <Field label="Vervaldatum" value="15-11-2026" />
          <Field label="Bedrag excl." value="€ 89,25" />
          <Field label="BTW (21%)" value="€ 18,74" />
          <Field label="Totaal" value="€ 107,99" highlight />
          <Field label="Categorie" value="Telecom & Internet" />
        </div>
        <div className="mt-3 pt-2 border-t border-border/60 flex items-center gap-2">
          <button className="text-[11px] px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Boeken
          </button>
          <button className="text-[11px] px-2.5 py-1 rounded-md border border-border text-foreground/70">
            Bewerken
          </button>
          <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
            <Paperclip className="w-3 h-3" /> Gekoppeld
          </span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? 'font-semibold text-primary' : 'font-medium'}>{value}</span>
    </div>
  );
}

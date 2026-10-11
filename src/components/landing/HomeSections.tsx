import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Inbox, Sparkles, Receipt, LineChart, Bot, ShieldCheck, Mail, Server, Tag } from 'lucide-react';
import { ContainerScroll } from '@/components/aceternity/container-scroll-animation';
import { FlipWords } from '@/components/aceternity/flip-words';
import { BentoGrid, BentoGridItem } from '@/components/aceternity/bento-grid';
import { GlowingEffect } from '@/components/aceternity/glowing-effect';
import { StickyScroll } from '@/components/aceternity/sticky-scroll-reveal';
import { LampContainer } from '@/components/aceternity/lamp';
import { ProductPreview } from '@/components/landing/ProductPreview';
import { InboxVisual, AIReplyVisual, DocumentVisual, AnalyticsVisual, AssistantVisual, SecurityVisual } from '@/components/landing/FeatureVisuals';
import { useMemo } from 'react';

function usePrefix() {
  const { i18n } = useTranslation();
  return i18n.language?.startsWith('en') ? '/en' : '';
}

const DOTS_LIGHT = 'bg-[radial-gradient(rgba(15,23,42,0.06)_1px,transparent_1px)] [background-size:24px_24px]';
const DOTS_DARK = 'bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:24px_24px]';

export function HomeHero() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const prefix = usePrefix();
  const flip = t('marketing.landing.flipWords', { returnObjects: true }) as string[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const words = useMemo(() => flip, [i18n.language]);
  const trust = [t('marketing.hero.trustNoCard'), t('marketing.hero.trustQuickSetup'), t('marketing.hero.trustCancel')];

  return (
    <section className="relative overflow-hidden bg-[#F4F4F6] pt-36 md:pt-24" aria-label="Servio">
      <div className={`pointer-events-none absolute inset-0 ${DOTS_LIGHT}`} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40rem] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.18),transparent_60%)]" />
      <div className="relative">
        <ContainerScroll
          titleComponent={
            <div className="px-4">
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-xs md:text-sm text-neutral-600">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t('marketing.hero.badge')}
              </span>
              <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-neutral-900 leading-[1.1]">
                {t('marketing.landing.heroStop')}
                <span className="block sm:inline"><FlipWords words={words} /></span>
                <br />
                <span className="text-primary">{t('marketing.landing.heroStart')}</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base md:text-lg text-neutral-600 leading-relaxed">
                {t('marketing.hero.subtitle')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={() => navigate('/signup')} className="inline-flex h-12 items-center rounded-full bg-primary px-7 text-[15px] font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90 active:scale-[0.97]">
                  {t('marketing.hero.ctaPrimary')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
                <button onClick={() => navigate(`${prefix}/features`)} className="inline-flex h-12 items-center rounded-full border border-neutral-300 bg-white px-7 text-[15px] font-medium text-neutral-800 transition-all duration-150 hover:border-neutral-400 active:scale-[0.97]">
                  {t('marketing.hero.ctaSecondary')}
                </button>
              </div>
              <div className="mt-6 mb-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-neutral-600">
                {trust.map((x) => (
                  <span key={x} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {x}
                  </span>
                ))}
              </div>
            </div>
          }
        >
          <div className="h-full w-full overflow-hidden">
            <ProductPreview />
          </div>
        </ContainerScroll>
      </div>
    </section>
  );
}

function IconDot({ Icon }: { Icon: typeof Inbox }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Icon className="h-4 w-4" />
    </div>
  );
}

function VisualHeader({ children }: { children: React.ReactNode }) {
  return <div className="relative z-10 h-40 overflow-hidden rounded-2xl [mask-image:linear-gradient(to_bottom,black_75%,transparent)] md:h-44 [&_[data-frame]]:aspect-auto [&_[data-frame]]:h-full">{children}</div>;
}

export function HomeBento() {
  const { t } = useTranslation();
  const cards = t('marketing.landing.cards', { returnObjects: true }) as Array<{ title: string; description: string }>;
  const icons = [Inbox, Sparkles, Receipt, LineChart, Bot, ShieldCheck];
  const headers: Array<React.ReactNode> = [
    <VisualHeader key="0"><InboxVisual /></VisualHeader>,
    <VisualHeader key="1"><AIReplyVisual /></VisualHeader>,
    <VisualHeader key="2"><DocumentVisual /></VisualHeader>,
    <VisualHeader key="3"><AnalyticsVisual /></VisualHeader>,
    <VisualHeader key="4"><AssistantVisual /></VisualHeader>,
    <VisualHeader key="5"><SecurityVisual /></VisualHeader>,
  ];
  const spans = ['md:col-span-2', '', '', 'md:col-span-2', 'md:col-span-2', ''];

  return (
    <section className="bg-white py-24 md:py-32">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-900">{t('marketing.product.title')}</h2>
          <p className="mt-4 text-neutral-600">{t('marketing.product.subtitle')}</p>
        </div>
        <BentoGrid className="md:auto-rows-[22rem]">
          {cards.map((c, i) => (
            <BentoGridItem
              key={c.title}
              className={spans[i]}
              header={headers[i] ?? <div className="flex-1" />}
              icon={<IconDot Icon={icons[i]} />}
              title={c.title}
              description={c.description}
            >
              <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} />
            </BentoGridItem>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}

function MockPanel({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full min-h-[18rem] w-full flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-6">{children}</div>;
}

export function HomeHowItWorks() {
  const { t } = useTranslation();
  const steps = t('marketing.howItWorks.steps', { returnObjects: true }) as Array<{ title: string; description: string }>;
  const labels = t('marketing.landing.labels', { returnObjects: true }) as string[];

  const connect = (
    <MockPanel>
      <p className="text-sm font-semibold text-white">{t('marketing.landing.connectTitle')}</p>
      {[
        { name: 'Outlook / Microsoft 365', Icon: Mail, status: t('marketing.landing.connected'), active: true },
        { name: t('marketing.landing.imap'), Icon: Server, status: t('marketing.landing.connected'), active: true },
        { name: 'Gmail', Icon: Mail, status: t('marketing.landing.comingSoon'), active: false },
      ].map((p) => (
        <div key={p.name} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
          <span className="flex items-center gap-3 text-sm text-slate-200"><p.Icon className="h-4 w-4 text-blue-300" />{p.name}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs ${p.active ? 'bg-blue-500/20 text-blue-200' : 'bg-white/10 text-slate-400'}`}>{p.status}</span>
        </div>
      ))}
    </MockPanel>
  );
  const inbox = (
    <MockPanel>
      {['Anna B.', 'Mark de V.', 'Studio Noord'].map((n, i) => (
        <div key={n} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
          <span className="text-sm text-slate-200">{n}</span>
          <span className="flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs text-blue-200"><Tag className="h-3 w-3" />{labels[i]}</span>
        </div>
      ))}
      <p className="mt-auto text-right text-[10px] text-slate-500">{t('marketing.landing.sampleData')}</p>
    </MockPanel>
  );
  const dash = (
    <MockPanel>
      <div className="flex flex-1 items-end gap-2">
        {[40, 65, 50, 80, 70, 95].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400" style={{ height: `${h}%` }} />
        ))}
      </div>
      <p className="text-right text-[10px] text-slate-500">{t('marketing.landing.sampleData')}</p>
    </MockPanel>
  );
  const contents = [connect, inbox, dash];

  return (
    <section className="relative bg-[#0A0F1E] py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className={`absolute inset-0 ${DOTS_DARK}`} />
        <div className="absolute left-1/2 top-0 h-[30rem] w-[50rem] -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />
      </div>
      <div className="relative z-10">
        <div className="mx-auto mb-8 max-w-2xl px-4 text-center">
          <span className="text-sm font-medium text-blue-300">{t('marketing.howItWorks.eyebrow')}</span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold tracking-tight text-white">{t('marketing.howItWorks.title')}</h2>
          <p className="mt-4 text-slate-300">{t('marketing.howItWorks.subtitle')}</p>
        </div>
        <StickyScroll content={steps.map((s, i) => ({ ...s, content: contents[i] }))} />
      </div>
    </section>
  );
}

export function HomePricingTeaser() {
  const { t, i18n } = useTranslation();
  const prefix = usePrefix();
  const plans = t('marketing.pricing.plans', { returnObjects: true }) as Array<{ name: string; price: string; description: string }>;
  const fmt = (p: string) => (i18n.language?.startsWith('en') ? p : p.replace('.', ','));
  const all = [{ name: t('marketing.landing.freeName'), price: '0', description: t('marketing.landing.freeDesc') }, ...plans];

  return (
    <section className="bg-[#F4F4F6] py-24 md:py-32">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-900">{t('marketing.landing.pricingTitle')}</h2>
          <p className="mt-4 text-neutral-600">{t('marketing.landing.pricingSubtitle')}</p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {all.map((p) => (
            <div key={p.name} className="relative rounded-3xl border border-neutral-200 bg-white p-6 shadow-input">
              <p className="text-sm font-semibold text-neutral-900">{p.name}</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-neutral-900">
                €{fmt(p.price)}
                <span className="text-sm font-normal text-neutral-500">{t('marketing.pricing.perMonth')}</span>
              </p>
              <p className="mt-3 text-sm text-neutral-600">{p.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link to={`${prefix}/pricing`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            {t('marketing.landing.seeAllPrices')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LampCTA() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prefix = usePrefix();
  return (
    <LampContainer>
      <motion.h2
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
        className="mt-8 bg-gradient-to-br from-white to-slate-400 bg-clip-text py-4 text-center text-4xl md:text-7xl font-semibold tracking-tight text-transparent"
      >
        {t('marketing.cta.title')}
      </motion.h2>
      <p className="mt-2 max-w-xl text-center text-slate-300">{t('marketing.cta.subtitle')}</p>
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <button onClick={() => navigate('/signup')} className="inline-flex h-12 items-center rounded-full bg-white px-7 text-[15px] font-medium text-neutral-900 transition-all duration-150 hover:bg-white/90 active:scale-[0.97]">
          {t('marketing.cta.button')}
        </button>
        <button onClick={() => navigate(`${prefix}/features`)} className="inline-flex h-12 items-center rounded-full border border-white/40 px-7 text-[15px] font-medium text-white transition-all duration-150 hover:border-white active:scale-[0.97]">
          {t('marketing.landing.ctaSecondary')}
        </button>
      </div>
    </LampContainer>
  );
}

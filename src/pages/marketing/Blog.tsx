import { Link } from 'react-router-dom';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SeoHead } from '@/components/SeoHead';
import { blogPosts, type BlogCategory, type BlogPost } from '@/data/blogPosts';
import { Calendar, Clock, Sparkles, Calculator, TrendingUp, Package, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/landing/motion';

/** Gedempte, merk-passende accentkleuren per categorie (HSL, thema-neutraal). */
const CATEGORY_META: Record<BlogCategory, { color: string; icon: LucideIcon }> = {
  'AI & Automatisering': { color: 'var(--primary)', icon: Sparkles },
  Boekhouding: { color: '174 42% 42%', icon: Calculator },
  Ondernemen: { color: '250 38% 55%', icon: TrendingUp },
  Product: { color: '35 62% 50%', icon: Package },
};

function CategoryVisual({ category, className }: { category: BlogCategory; className?: string }) {
  const meta = CATEGORY_META[category];
  const accent = `hsl(${meta.color})`;
  const Icon = meta.icon;
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className ?? ''}`}
      aria-hidden="true"
    >
      {/* basis-gradient */}
      <div
        className="absolute inset-0 transition-opacity duration-300 ease-out group-hover:opacity-0"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 18%, transparent), color-mix(in srgb, ${accent} 6%, transparent))`,
        }}
      />
      {/* intensere gradient bij hover */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 24%, transparent), color-mix(in srgb, ${accent} 10%, transparent))`,
        }}
      />
      {/* zachte glow achter het icoon */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 motion-reduce:transition-none"
        style={{
          background: `radial-gradient(closest-side, color-mix(in srgb, ${accent} 20%, transparent), transparent 70%)`,
        }}
      />
      <Icon
        className="relative transition-transform duration-[350ms] ease-out group-hover:scale-[1.15] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        style={{ color: accent, opacity: 0.5 }}
        strokeWidth={1.25}
        size="35%"
      />
    </div>
  );
}

function CategoryBadge({ category }: { category: BlogCategory }) {
  const accent = `hsl(${CATEGORY_META[category].color})`;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-300 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      style={{
        color: accent,
        backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
      }}
    >
      {category}
    </span>
  );
}


export default function Blog() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const prefix = isEn ? '/en' : '';
  const locale = isEn ? 'en-GB' : 'nl-NL';

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });

  const sorted: BlogPost[] = [...blogPosts].sort((a, b) => b.date.localeCompare(a.date));
  const [featured, ...rest] = sorted;

  const title = isEn
    ? 'Blog – AI & Admin Tips for Freelancers | Servio'
    : "Blog – AI & Administratie Tips voor ZZP'ers | Servio";
  const description = isEn
    ? 'Practical articles for freelancers and small business owners about AI tools, inbox automation, admin and saving time. By Servio.'
    : "Praktische artikelen voor ZZP'ers en kleine ondernemers over AI tools, inbox automatisering, administratie en tijd besparen. Door Servio.";

  const featuredAccent = `hsl(${CATEGORY_META[featured.category].color})`;

  return (
    <>
      <SeoHead path="/blog" title={title} description={description} />

      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <Reveal className="max-w-2xl mb-14 md:mb-20">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-5">
              Blog
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">{t('marketing.blog.title')}</h1>
            <p className="text-lg text-muted-foreground">{t('marketing.blog.subtitle')}</p>
          </Reveal>

          {/* Uitgelicht artikel */}
          <Reveal className="mb-16 md:mb-20">
            <Link
              to={`${prefix}/blog/${featured.slug}`}
              className="group grid lg:grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-lg hover:border-primary/30 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100"
            >
              <CategoryVisual category={featured.category} className="min-h-[240px] lg:min-h-[380px]" />
              <div className="flex flex-col p-8 md:p-12">
                <span
                  className="inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold mb-5"
                  style={{
                    color: featuredAccent,
                    backgroundColor: `color-mix(in srgb, ${featuredAccent} 14%, transparent)`,
                  }}
                >
                  {isEn ? 'Featured' : 'Uitgelicht'}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight mb-4 group-hover:text-primary transition-colors">
                  {featured.title}
                  <ArrowRight
                    className="ml-2 inline-block h-5 w-5 -translate-x-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none"
                    aria-hidden="true"
                  />
                </h2>

                <p className="text-muted-foreground leading-relaxed">{featured.excerpt}</p>
                <div className="mt-auto pt-8 flex flex-wrap items-center gap-x-4 gap-y-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(featured.date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {featured.readingTime} {t('marketing.blog.minRead')}
                  </span>
                  <CategoryBadge category={featured.category} />
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Overige artikelen */}
          <StaggerGroup className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
            {rest.map((post) => (
              <StaggerItem key={post.slug}>
                <Link
                  to={`${prefix}/blog/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-md hover:border-primary/30 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100"
                >
                  <CategoryVisual category={post.category} className="aspect-[16/10]" />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(post.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readingTime} {t('marketing.blog.minRead')}
                        </span>
                      </div>
                    </div>
                    <h2 className="text-lg font-semibold leading-snug mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                      <ArrowRight
                        className="ml-1.5 inline-block h-4 w-4 -translate-x-1.5 opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </h2>

                    <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                    <div className="mt-auto pt-5 flex justify-end">
                      <CategoryBadge category={post.category} />
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </main>
        <LandingFooter />
      </div>
    </>
  );
}

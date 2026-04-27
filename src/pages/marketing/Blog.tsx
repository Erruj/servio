import { Link } from 'react-router-dom';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { SeoHead } from '@/components/SeoHead';
import { blogPosts } from '@/data/blogPosts';
import { Calendar, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Blog() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const prefix = isEn ? '/en' : '';

  const title = isEn
    ? "Blog – Tips for Freelancers on AI, Admin & Productivity | Servio"
    : "Blog – Tips voor ZZP'ers over AI, Administratie & Productiviteit | Servio";
  const description = isEn
    ? 'Practical articles for freelancers and small business owners about AI tools, inbox automation, admin and saving time. By Servio.'
    : "Praktische artikelen voor ZZP'ers en kleine ondernemers over AI tools, inbox automatisering, administratie en tijd besparen. Door Servio.";

  return (
    <>
      <SeoHead path="/blog" title={title} description={description} />

      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t('marketing.blog.title')}</h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
            {t('marketing.blog.subtitle')}
          </p>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                to={`${prefix}/blog/${post.slug}`}
                className="group block rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md hover:border-primary/30"
              >
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.date).toLocaleDateString(isEn ? 'en-GB' : 'nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime} {t('marketing.blog.minRead')}</span>
                </div>
                <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors leading-snug">{post.title}</h2>
                <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
              </Link>
            ))}
          </div>
        </main>
        <LandingFooter />
      </div>
    </>
  );
}

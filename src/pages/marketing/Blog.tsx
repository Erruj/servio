import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { blogPosts } from '@/data/blogPosts';
import { Calendar, Clock } from 'lucide-react';

export default function Blog() {
  return (
    <>
      <Helmet>
        <title>Blog – Tips voor ZZP'ers over AI, Administratie & Productiviteit | Servio</title>
        <meta name="description" content="Praktische artikelen voor ZZP'ers en kleine ondernemers over AI tools, inbox automatisering, administratie en tijd besparen. Door Servio." />
        <link rel="canonical" href="https://getservio.co/blog" />
        <meta property="og:title" content="Servio Blog – Tips voor ZZP'ers" />
        <meta property="og:description" content="Praktische artikelen over AI, administratie en productiviteit voor ondernemers." />
        <meta property="og:url" content="https://getservio.co/blog" />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Blog</h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl">
            Praktische tips en inzichten voor ZZP'ers en kleine ondernemers. Over AI, administratie, productiviteit en alles daartussenin.
          </p>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group block rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md hover:border-primary/30"
              >
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime} min</span>
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

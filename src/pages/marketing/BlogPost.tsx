import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { getBlogPost, getRelatedPosts } from '@/data/blogPosts';
import { Calendar, Clock, Linkedin, Twitter, LinkIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import React from 'react';

function renderMarkdown(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let tableRows: string[][] = [];
  let inTable = false;

  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
    let lastIndex = 0;
    let match;
    let key = 0;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
      if (match[1] && match[2]) {
        const isInternal = match[2].startsWith('/');
        parts.push(isInternal
          ? <Link key={key++} to={match[2]} className="text-primary underline underline-offset-2 hover:text-primary/80">{match[1]}</Link>
          : <a key={key++} href={match[2]} className="text-primary underline underline-offset-2 hover:text-primary/80" target="_blank" rel="noopener noreferrer">{match[1]}</a>
        );
      } else if (match[3]) {
        parts.push(<strong key={key++}>{match[3]}</strong>);
      } else if (match[4]) {
        parts.push(<code key={key++} className="bg-muted px-1.5 py-0.5 rounded text-sm">{match[4]}</code>);
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
  };

  const flushTable = () => {
    if (tableRows.length < 2) return;
    const headers = tableRows[0];
    const rows = tableRows.slice(2); // skip separator
    elements.push(
      <div key={`table-${i}`} className="overflow-x-auto my-6">
        <table className="w-full text-sm border-collapse">
          <thead><tr>{headers.map((h, j) => <th key={j} className="text-left p-3 border-b border-border font-semibold">{renderInline(h.trim())}</th>)}</tr></thead>
          <tbody>{rows.map((row, ri) => <tr key={ri} className="border-b border-border/50">{row.map((cell, ci) => <td key={ci} className="p-3">{renderInline(cell.trim())}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
    tableRows = [];
    inTable = false;
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('|')) {
      inTable = true;
      const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      tableRows.push(cells);
      i++;
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-xl font-semibold mt-8 mb-3">{renderInline(line.slice(4))}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-2xl font-bold mt-10 mb-4">{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith('- **')) {
      elements.push(<li key={i} className="ml-5 mb-1 list-disc">{renderInline(line.slice(2))}</li>);
    } else if (line.startsWith('- ')) {
      elements.push(<li key={i} className="ml-5 mb-1 list-disc">{renderInline(line.slice(2))}</li>);
    } else if (line.startsWith('> ')) {
      elements.push(<blockquote key={i} className="border-l-4 border-primary/30 pl-4 py-2 my-4 italic text-muted-foreground">{renderInline(line.slice(2))}</blockquote>);
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(<li key={i} className="ml-5 mb-1 list-decimal">{renderInline(line.replace(/^\d+\.\s/, ''))}</li>);
    } else if (line.trim() === '') {
      // skip
    } else {
      elements.push(<p key={i} className="mb-4 leading-relaxed">{renderInline(line)}</p>);
    }
    i++;
  }
  if (inTable) flushTable();
  return elements;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) return <Navigate to="/blog" replace />;

  const related = getRelatedPosts(post.relatedSlugs);
  const url = `https://getservio.co/blog/${post.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success('Link gekopieerd!');
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.date,
    url,
    author: { "@type": "Organization", name: "Servio", url: "https://getservio.co" },
    publisher: { "@type": "Organization", name: "Servio", url: "https://getservio.co" },
    keywords: post.keywords.join(', ')
  };

  return (
    <>
      <Helmet>
        <title>{post.metaTitle}</title>
        <meta name="description" content={post.metaDescription} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={post.metaTitle} />
        <meta property="og:description" content={post.metaDescription} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://getservio.co/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <LandingHeader />
        <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8" aria-label="breadcrumb">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{post.title}</span>
          </nav>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(post.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{post.readingTime} min leestijd</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 leading-tight">{post.title}</h1>

          {/* Share */}
          <div className="flex items-center gap-2 mb-10 pb-8 border-b border-border">
            <span className="text-sm text-muted-foreground mr-2">Delen:</span>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Deel op LinkedIn"><Linkedin className="h-4 w-4" /></a>
            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Deel op X"><Twitter className="h-4 w-4" /></a>
            <button onClick={copyLink} className="p-2 rounded-lg hover:bg-accent transition-colors" aria-label="Kopieer link"><LinkIcon className="h-4 w-4" /></button>
          </div>

          {/* Content */}
          <article className="prose-custom text-foreground leading-relaxed">
            {renderMarkdown(post.content)}
          </article>

          {/* CTA */}
          <div className="mt-16 p-8 rounded-2xl bg-primary/5 border border-primary/20 text-center">
            <h2 className="text-2xl font-bold mb-2">Klaar om tijd te besparen?</h2>
            <p className="text-muted-foreground mb-6">Probeer Servio 14 dagen gratis. Geen creditcard nodig.</p>
            <Button asChild size="lg"><Link to="/signup">Start gratis proefperiode</Link></Button>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl font-bold mb-6">Gerelateerde artikelen</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {related.map(r => (
                  <Link key={r.slug} to={`/blog/${r.slug}`} className="group block rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all">
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors text-sm leading-snug">{r.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{r.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12">
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Terug naar alle artikelen
            </Link>
          </div>
        </main>
        <LandingFooter />
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogCover } from "@/components/blog/BlogCover";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/config/seo.config";
import { siteConfig } from "@/config/site.config";
import { blogPosts, getBlogPost } from "@/data/blog";
import { jsonLdScript } from "@/lib/jsonLd";
import { formatDate } from "@/lib/utils";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};

  return buildMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: new Date(`${post.date}T12:00:00`).toISOString(),
  });
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <PageShell>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, no user input
        dangerouslySetInnerHTML={jsonLdScript({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          author: { "@type": "Organization", name: siteConfig.name },
          publisher: { "@type": "Organization", name: siteConfig.name },
          mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
        })}
      />

      <header className="article-hero">
        <div className="ambient" aria-hidden="true">
          <div
            className="orb orb-blue d1"
            style={{ width: 340, height: 340, top: -110, left: -100 }}
          />
          <div
            className="orb orb-teal d2"
            style={{ width: 300, height: 300, top: 10, right: -120 }}
          />
        </div>
        <Container className="article-hero-inner">
          <a className="article-back" href="/blog">
            ← Voltar para o blog
          </a>
          <span className="page-hero-eyebrow">{formatDate(post.date)}</span>
          <h1>{post.title}</h1>
          <div className="blog-meta">
            <span>{siteConfig.name}</span>
            <span className="dot" />
            <span>{post.readingTime}</span>
          </div>
          <BlogCover topic={post.topic} className="article-cover" />
        </Container>
      </header>

      <section>
        <Container>
          <div className="article-body">
            {post.body.map((block) => {
              const key = block.text ?? block.items?.[0] ?? "";
              if (block.type === "h2") {
                return <h2 key={key}>{block.text}</h2>;
              }
              if (block.type === "ul") {
                return (
                  <ul key={key}>
                    {block.items?.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={key}>{block.text}</p>;
            })}

            <div className="article-cta">
              <h3>Quer um sistema construído para a sua operação?</h3>
              <p>Fale com a gente e veja como fica um software feito sob medida para você.</p>
              <Button href="/#contato" withArrow>
                Quero meu software
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}

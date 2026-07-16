import type { Metadata } from "next";
import { BlogCover } from "@/components/blog/BlogCover";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageShell } from "@/components/layout/PageShell";
import { Container } from "@/components/ui/Container";
import { buildMetadata } from "@/config/seo.config";
import { blogPosts } from "@/data/blog";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Blog",
  description:
    "Conteúdo sobre Inteligência Artificial, White Label e integração de sistemas para empresas que querem sair do software genérico.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Blog"
        title="Conteúdo sobre software próprio e tecnologia sob medida."
        description="Reflexões e guias práticos sobre Inteligência Artificial, White Label e integração de sistemas — escritos para quem decide a tecnologia da própria empresa."
      />

      <section className="page-section">
        <Container>
          <div className="blog-grid">
            {blogPosts.map((post) => (
              <a className="blog-card" href={`/blog/${post.slug}`} key={post.slug}>
                <BlogCover topic={post.topic} className="blog-cover" />
                <div className="blog-card-body">
                  <div className="blog-meta">
                    <span>{formatDate(post.date)}</span>
                    <span className="dot" />
                    <span>{post.readingTime}</span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.description}</p>
                </div>
              </a>
            ))}
          </div>
        </Container>
      </section>
    </PageShell>
  );
}

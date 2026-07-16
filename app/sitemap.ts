import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";
import { blogPosts } from "@/data/blog";
import { cases } from "@/data/cases";
import { materials } from "@/data/materials";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/sobre",
    "/privacidade",
    "/termos",
    "/cases",
    "/materiais",
    "/blog",
  ].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T12:00:00`),
  }));

  const caseRoutes: MetadataRoute.Sitemap = cases.map((item) => ({
    url: `${siteConfig.url}/cases/${item.slug}`,
    lastModified: new Date(),
  }));

  const materialRoutes: MetadataRoute.Sitemap = materials.map((item) => ({
    url: `${siteConfig.url}/materiais/${item.slug}`,
    lastModified: new Date(`${item.date}T12:00:00`),
  }));

  return [...staticRoutes, ...blogRoutes, ...caseRoutes, ...materialRoutes];
}

import type { Metadata } from "next";
import { siteConfig } from "@/config/site.config";

export const seoConfig: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} · ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: `${siteConfig.name} · ${siteConfig.tagline}`,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} · ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
}

export function buildMetadata({
  title,
  description,
  path,
  type = "website",
  publishedTime,
}: PageMetadataInput): Metadata {
  const url = `${siteConfig.url}${path}`;
  const fullTitle = `${title} · ${siteConfig.name}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      locale: siteConfig.locale,
      url,
      title: fullTitle,
      description,
      siteName: siteConfig.name,
      ...(type === "article" && publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

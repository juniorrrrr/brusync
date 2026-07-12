import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { PremiumEffects } from "@/components/layout/PremiumEffects";
import { seoConfig } from "@/config/seo.config";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = seoConfig;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={jakarta.variable} suppressHydrationWarning>
      <body>
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <title>Filtros SVG</title>
          <filter id="navGooeyFilter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
              result="goo"
            />
          </filter>
        </svg>
        {children}
        <PremiumEffects />
      </body>
    </html>
  );
}

import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <header className="page-hero">
      <div className="ambient" aria-hidden="true">
        <div
          className="orb orb-blue d1"
          style={{ width: 360, height: 360, top: -120, left: -100 }}
        />
        <div
          className="orb orb-teal d2"
          style={{ width: 320, height: 320, top: 20, right: -130 }}
        />
        <div className="grid-lines" style={{ opacity: 0.5 }} />
      </div>
      <Container className="page-hero-inner">
        <div className="reveal in">
          <span className="page-hero-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          {description && <p className="page-hero-desc">{description}</p>}
          {children}
        </div>
      </Container>
    </header>
  );
}

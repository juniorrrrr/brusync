"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ctaLink, navLinks } from "@/config/nav.config";
import { siteConfig } from "@/config/site.config";
import { useGooeyNav } from "@/hooks/useGooeyNav";
import { cn } from "@/lib/utils";

export function Navbar() {
  const navRef = useRef<HTMLElement | null>(null);
  const navLinksRef = useRef<HTMLDivElement | null>(null);
  const pillFxRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useGooeyNav(navLinksRef, pillFxRef, pillRef);

  useEffect(() => {
    function onScroll() {
      navRef.current?.classList.toggle("scrolled", window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="nav" id="nav" ref={navRef}>
      <div className="container nav-inner">
        <a href="/" className="logo" aria-label={siteConfig.name}>
          <span className="logo-word">
            {siteConfig.name}
            <i>.</i>
          </span>
          <span className="logo-tag">{siteConfig.tagline}</span>
        </a>

        <div className={cn("nav-links", open && "open")} ref={navLinksRef}>
          <div className="nav-pill-fx" ref={pillFxRef}>
            <div className="nav-pill" ref={pillRef} />
          </div>
          {navLinks.map((link) => (
            <a
              key={link.target}
              href={link.href}
              className="nav-link"
              data-target={link.target}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Button href={ctaLink.href} withArrow onClick={() => setOpen(false)}>
            {ctaLink.label}
          </Button>
        </div>

        <button
          type="button"
          className="nav-burger"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}

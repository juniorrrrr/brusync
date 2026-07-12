"use client";

import { type RefObject, useEffect } from "react";

/** GooeyNav-style pill that slides between nav links (FLIP transform + morph
 * filter + droplets on transition), driven by click or scrollspy. Manipulates
 * the DOM directly to avoid re-rendering the navbar on every scroll tick. */
export function useGooeyNav(
  navLinksRef: RefObject<HTMLDivElement | null>,
  pillFxRef: RefObject<HTMLDivElement | null>,
  pillRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const navLinksEl = navLinksRef.current;
    const pillFx = pillFxRef.current;
    const pill = pillRef.current;
    if (!navLinksEl || !pillFx || !pill) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const navLinkEls = [...navLinksEl.querySelectorAll<HTMLAnchorElement>(".nav-link")];
    let pillShown = false;
    let morphTimer: ReturnType<typeof setTimeout> | undefined;

    const spawnDroplets = (oldCenter: number, newCenter: number) => {
      const midY = pill.offsetTop + pill.offsetHeight / 2;
      for (const t of [0.35, 0.65]) {
        const x = oldCenter + (newCenter - oldCenter) * t;
        const d = document.createElement("div");
        d.className = "nav-droplet pop";
        d.style.left = `${x}px`;
        d.style.top = `${midY}px`;
        pillFx.appendChild(d);
        setTimeout(() => d.remove(), 340);
      }
    };

    const movePill = (link: HTMLAnchorElement, instant: boolean) => {
      const wrapRect = navLinksEl.getBoundingClientRect();
      const r = link.getBoundingClientRect();
      const newLeft = r.left - wrapRect.left;
      const newWidth = r.width;

      if (instant || reduceMotion || !pillShown) {
        pill.style.transition = "none";
        pill.style.transform = "translateX(0) scaleX(1)";
        pill.style.left = `${newLeft}px`;
        pill.style.width = `${newWidth}px`;
        pill.classList.add("on");
        void pill.offsetWidth;
        pill.style.transition = "";
        pillShown = true;
        return;
      }

      const pillRect = pill.getBoundingClientRect();
      const oldLeft = pillRect.left - wrapRect.left;
      const oldWidth = pillRect.width;
      const deltaX = oldLeft - newLeft;
      const scaleRatio = oldWidth / Math.max(1, newWidth);
      pill.style.transition = "none";
      pill.style.left = `${newLeft}px`;
      pill.style.width = `${newWidth}px`;
      pill.style.transform = `translateX(${deltaX}px) scaleX(${scaleRatio})`;
      void pill.offsetWidth;
      pillFx.classList.add("morphing");
      spawnDroplets(oldLeft + oldWidth / 2, newLeft + newWidth / 2);
      requestAnimationFrame(() => {
        pill.style.transition = "";
        pill.style.transform = "translateX(0) scaleX(1)";
      });
      clearTimeout(morphTimer);
      morphTimer = setTimeout(() => pillFx.classList.remove("morphing"), 300);
    };

    const setActiveClass = (link: HTMLAnchorElement) => {
      for (const a of navLinkEls) a.classList.toggle("active", a === link);
    };

    const activateLink = (link: HTMLAnchorElement | undefined) => {
      if (!link) return;
      const already = link.classList.contains("active");
      setActiveClass(link);
      if (already) return;
      movePill(link, false);
    };

    const cleanups: Array<() => void> = [];

    for (const a of navLinkEls) {
      const onClick = () => activateLink(a);
      const onMouseMove = (e: MouseEvent) => {
        const r = a.getBoundingClientRect();
        const relX = e.clientX - (r.left + r.width / 2);
        const mag = Math.max(-4, Math.min(4, relX * 0.22));
        a.style.transform = `translateX(${mag}px)`;
      };
      const onMouseLeave = () => {
        a.style.transform = "";
      };
      a.addEventListener("click", onClick);
      a.addEventListener("mousemove", onMouseMove);
      a.addEventListener("mouseleave", onMouseLeave);
      cleanups.push(() => {
        a.removeEventListener("click", onClick);
        a.removeEventListener("mousemove", onMouseMove);
        a.removeEventListener("mouseleave", onMouseLeave);
      });
    }

    function onResize() {
      const active = navLinksEl?.querySelector<HTMLAnchorElement>(".nav-link.active");
      if (active) movePill(active, true);
    }
    window.addEventListener("resize", onResize);
    cleanups.push(() => window.removeEventListener("resize", onResize));

    const sectionMap = navLinkEls
      .map((a) => ({ link: a, el: document.getElementById(a.dataset.target ?? "") }))
      .filter((s): s is { link: HTMLAnchorElement; el: HTMLElement } => !!s.el);

    const spyIo = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const match = sectionMap.find((s) => s.el === entry.target);
            if (match) activateLink(match.link);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    for (const s of sectionMap) spyIo.observe(s.el);
    cleanups.push(() => spyIo.disconnect());

    return () => {
      clearTimeout(morphTimer);
      for (const fn of cleanups) fn();
    };
  }, [navLinksRef, pillFxRef, pillRef]);
}

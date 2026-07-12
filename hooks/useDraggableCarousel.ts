"use client";

import { useEffect, useRef, useState } from "react";
import { animateCount } from "@/lib/animateCount";

/** Premium draggable carousel: pointer drag with momentum, wheel, keyboard
 * and snap-to-card, centered active card, autoplay while in view. Position
 * is driven imperatively (direct transform writes) to stay smooth during drag. */
export function useDraggableCarousel(itemCount: number) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const indicatorFillRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const setActiveRef = useRef<(i: number, animate?: boolean) => void>(() => {});
  const [activeIndex, setActiveIndex] = useState(-1);
  const [count, setCount] = useState(itemCount);

  function setCardRef(i: number) {
    return (el: HTMLDivElement | null) => {
      cardRefs.current[i] = el;
    };
  }

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let activeIdx = -1;
    let currentX = 0;

    const cards = () => cardRefs.current.filter((c): c is HTMLDivElement => !!c);
    const cardTarget = (card: HTMLDivElement) =>
      card.offsetLeft - (viewport.offsetWidth - card.offsetWidth) / 2;
    const maxScroll = () => Math.max(0, track.scrollWidth - viewport.offsetWidth);
    const setX = (x: number, animate: boolean) => {
      currentX = Math.max(-maxScroll(), Math.min(0, x));
      track.style.transition = animate ? "" : "none";
      track.style.transform = `translateX(${currentX}px)`;
    };

    function setActive(i: number, animate = true) {
      const all = cards();
      if (!all.length) return;
      i = Math.max(0, Math.min(all.length - 1, i));
      const prevIndex = activeIdx;
      activeIdx = i;
      all.forEach((c, j) => {
        c.classList.toggle("active", j === activeIdx);
      });
      if (prevIndex !== activeIdx && prevIndex >= 0) {
        all[prevIndex]?.classList.remove("in");
      }
      const activeCard = all[activeIdx];
      if (activeCard && !activeCard.classList.contains("in")) {
        activeCard.classList.add("in");
        for (const el of activeCard.querySelectorAll<HTMLElement>("[data-target]")) {
          delete el.dataset.done;
          animateCount(el, reduceMotion);
        }
      }
      if (activeCard) setX(-cardTarget(activeCard), animate);
      if (indicatorFillRef.current) {
        indicatorFillRef.current.style.width = `${100 / all.length}%`;
        indicatorFillRef.current.style.transform = `translateX(${activeIdx * 100}%)`;
      }
      setActiveIndex(activeIdx);
      setCount(all.length);
    }
    setActiveRef.current = setActive;

    let dragging = false;
    let dragStartX = 0;
    let dragStartTrackX = 0;
    let moveSamples: Array<{ x: number; t: number }> = [];

    function onPointerDown(e: PointerEvent) {
      dragging = true;
      track?.classList.add("dragging");
      try {
        viewport?.setPointerCapture(e.pointerId);
      } catch {}
      dragStartX = e.clientX;
      dragStartTrackX = currentX;
      moveSamples = [{ x: e.clientX, t: performance.now() }];
    }
    function onPointerMove(e: PointerEvent) {
      if (!dragging || !track) return;
      moveSamples.push({ x: e.clientX, t: performance.now() });
      if (moveSamples.length > 6) moveSamples.shift();
      const newX = dragStartTrackX + (e.clientX - dragStartX);
      currentX = Math.max(-maxScroll() - 50, Math.min(50, newX));
      track.style.transform = `translateX(${currentX}px)`;
    }
    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      track?.classList.remove("dragging");
      let velocity = 0;
      if (moveSamples.length >= 2) {
        const first = moveSamples[0];
        const last = moveSamples[moveSamples.length - 1];
        const dt = Math.max(16, last.t - first.t);
        velocity = (last.x - first.x) / dt;
      }
      const all = cards();
      const cardW = (all[0] ? all[0].getBoundingClientRect().width : 320) + 22;
      const maxProjection = cardW * 1.5;
      const clampedProjection = Math.max(-maxProjection, Math.min(maxProjection, velocity * 140));
      const projected = reduceMotion ? currentX : currentX + clampedProjection;
      let nearest = 0;
      let best = Number.POSITIVE_INFINITY;
      all.forEach((c, j) => {
        const d = Math.abs(cardTarget(c) - -projected);
        if (d < best) {
          best = d;
          nearest = j;
        }
      });
      setActive(nearest, true);
    }
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("pointermove", onPointerMove);
    viewport.addEventListener("pointerup", onPointerUp);
    viewport.addEventListener("pointercancel", onPointerUp);

    let wheelAccum = 0;
    let wheelCooldown = false;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      wheelAccum += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (wheelCooldown) return;
      if (Math.abs(wheelAccum) > 40) {
        setActive(activeIdx + (wheelAccum > 0 ? 1 : -1));
        wheelAccum = 0;
        wheelCooldown = true;
        setTimeout(() => {
          wheelCooldown = false;
        }, 450);
      }
    }
    viewport.addEventListener("wheel", onWheel, { passive: false });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        setActive(activeIdx + 1);
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        setActive(activeIdx - 1);
        e.preventDefault();
      }
    }
    viewport.addEventListener("keydown", onKeyDown);

    function onResize() {
      setActive(activeIdx, false);
    }
    window.addEventListener("resize", onResize);

    let auto: ReturnType<typeof setInterval> | null = null;
    function startAuto() {
      stopAuto();
      if (reduceMotion) return;
      auto = setInterval(() => {
        const all = cards();
        if (all.length) setActive((activeIdx + 1) % all.length);
      }, 5000);
    }
    function stopAuto() {
      if (auto) clearInterval(auto);
    }
    viewport.addEventListener("mouseenter", stopAuto);
    viewport.addEventListener("mouseleave", startAuto);

    const showIo = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) startAuto();
          else stopAuto();
        }
      },
      { threshold: 0.2 },
    );
    showIo.observe(viewport);

    setActive(Math.min(2, itemCount - 1), false);

    return () => {
      stopAuto();
      showIo.disconnect();
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("pointermove", onPointerMove);
      viewport.removeEventListener("pointerup", onPointerUp);
      viewport.removeEventListener("pointercancel", onPointerUp);
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("keydown", onKeyDown);
      viewport.removeEventListener("mouseenter", stopAuto);
      viewport.removeEventListener("mouseleave", startAuto);
      window.removeEventListener("resize", onResize);
    };
  }, [itemCount]);

  return {
    viewportRef,
    trackRef,
    indicatorFillRef,
    setCardRef,
    activeIndex,
    count,
    goPrev() {
      setActiveRef.current(activeIndex - 1);
    },
    goNext() {
      setActiveRef.current(activeIndex + 1);
    },
  };
}

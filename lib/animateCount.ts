import type { CountFormat } from "@/types";
import { formatCount } from "@/utils/formatNumber";

/** Animates a `[data-target]` counter element's text content, mirroring the
 * original vanilla `animateCount`. Marks the element as done via a data attribute
 * so it only ever plays once per reveal. */
export function animateCount(el: HTMLElement, reduceMotion: boolean) {
  if (el.dataset.done) return;
  el.dataset.done = "1";
  const target = Number.parseFloat(el.dataset.target ?? "0");
  const format = (el.dataset.fmt ?? "int") as CountFormat;

  if (reduceMotion) {
    el.textContent = formatCount(target, format);
    return;
  }

  const duration = 1400;
  const start = performance.now();

  function tick(now: number) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - progress) ** 3;
    el.textContent = formatCount(target * eased, format);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = formatCount(target, format);
  }
  requestAnimationFrame(tick);
}

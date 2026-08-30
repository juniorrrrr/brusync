"use client";

import {
  animate,
  type MotionProps,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  type ComponentType,
  type ElementType,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type EaseValue =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "circIn"
  | "circOut"
  | "circInOut"
  | "backIn"
  | "backOut"
  | "backInOut"
  | "anticipate"
  | readonly [number, number, number, number]
  | ((t: number) => number);

export interface DiaTextRevealHandle {
  play: () => void;
  replay: () => void;
}

export interface DiaTextRevealProps {
  as?: ElementType;
  className?: string;
  colors?: string[];
  delay?: number;
  direction?: "ltr" | "rtl";
  duration?: number;
  ease?: EaseValue;
  fadeDuration?: number;
  fadeEase?: EaseValue;
  fixedWidth?: boolean;
  holdDuration?: number;
  inViewMargin?:
    | `${number}px`
    | `${number}px ${number}px`
    | `${number}px ${number}px ${number}px`
    | `${number}px ${number}px ${number}px ${number}px`;
  onComplete?: () => void;
  once?: boolean;
  ref?: Ref<DiaTextRevealHandle>;
  repeat?: boolean;
  repeatDelay?: number;
  startOnView?: boolean;
  text: string | string[];
  textColor?: string;
}

const DEFAULT_EASE: EaseValue = [0.23, 1, 0.32, 1];
// A single subtle highlight tint used only as the thin "scan line" glow that
// rides the leading edge of the reveal mask — the text itself stays solid
// `textColor`, this never becomes a multicolor band.
const DEFAULT_COLORS = ["var(--accent-on-dark)"];

// Percentage-point width (relative to the element's own box, so it scales
// automatically with the text at any viewport) of the soft antialiased edge
// on the reveal mask.
const MASK_FEATHER = 6;
// Percentage-point half-width of the glow band riding that same edge.
const GLOW_HALF_WIDTH = 3;

/** Builds a mask that is fully opaque from 0% up to `reveal`% (minus a soft
 * feather) and fully transparent beyond — i.e. a hard left-to-right "scan"
 * cutoff rather than a uniform opacity fade. `angle` (90/270deg) flips the
 * sweep direction for rtl. */
function buildScanMask(reveal: number, angle: number) {
  if (reveal <= 0) return `linear-gradient(${angle}deg, transparent 0%, transparent 100%)`;
  if (reveal >= 100) return `linear-gradient(${angle}deg, #000 0%, #000 100%)`;

  const edgeStart = Math.max(0, reveal - MASK_FEATHER);
  return `linear-gradient(${angle}deg, #000 0%, #000 ${edgeStart}%, transparent ${reveal}%, transparent 100%)`;
}

/** Solid `textColor` everywhere, except a thin `glowColor` band centered
 * exactly on the current scan position — since the mask above hides
 * everything past `reveal`%, this band reads as a subtle bright edge
 * traveling with the scan line, not a color change on the revealed text. */
function buildScanColor(reveal: number, textColor: string, glowColor: string, angle: number) {
  if (reveal <= 0 || reveal >= 100) {
    return `linear-gradient(${angle}deg, ${textColor} 0%, ${textColor} 100%)`;
  }

  const bandStart = Math.max(0, reveal - GLOW_HALF_WIDTH);
  const bandEnd = Math.min(100, reveal + GLOW_HALF_WIDTH);
  return `linear-gradient(${angle}deg, ${textColor} 0%, ${textColor} ${bandStart}%, ${glowColor} ${reveal}%, ${textColor} ${bandEnd}%, ${textColor} 100%)`;
}

function measureMaxWidth(element: HTMLElement, texts: string[]) {
  const ghost = element.cloneNode() as HTMLElement;

  Object.assign(ghost.style, {
    position: "absolute",
    visibility: "hidden",
    pointerEvents: "none",
    width: "auto",
    whiteSpace: "nowrap",
  });

  element.parentElement?.appendChild(ghost);

  let max = 0;

  for (const entry of texts) {
    ghost.textContent = entry;
    max = Math.max(max, ghost.getBoundingClientRect().width);
  }

  ghost.remove();
  return max;
}

/** Cycles through `text` entries, revealing each with a left-to-right scan:
 * a `mask-image` sweep progressively uncovers the characters (not an
 * opacity/fade), with a subtle bright highlight riding the scan edge. */
export function DiaTextReveal({
  text,
  colors = DEFAULT_COLORS,
  textColor = "currentColor",
  direction = "ltr",
  duration = 1.5,
  delay = 0,
  ease = DEFAULT_EASE,
  fadeEase = "easeInOut",
  repeat = false,
  repeatDelay = 0.5,
  holdDuration = 1,
  fadeDuration = 0.6,
  fixedWidth = false,
  startOnView = true,
  once = true,
  inViewMargin = "0px",
  onComplete,
  as: Component = "span",
  className,
  ref: controlRef,
}: DiaTextRevealProps) {
  const elementRef = useRef<HTMLElement>(null);
  const isInView = useInView(elementRef, {
    once,
    margin: inViewMargin,
  });
  const prefersReducedMotion = useReducedMotion();
  const canAnimate = !prefersReducedMotion && (!startOnView || isInView);

  const texts = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);
  const isMulti = texts.length > 1;
  const [activeIndex, setActiveIndex] = useState(0);
  const [lockedWidth, setLockedWidth] = useState<number | undefined>();
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 0 = fully masked (nothing revealed yet), 100 = fully revealed.
  const reveal = useMotionValue(0);
  // Only used for the short fade-out between one word and the next — the
  // entrance itself is driven entirely by the mask, not by opacity.
  const textOpacity = useMotionValue(1);
  const angle = direction === "rtl" ? 270 : 90;
  const glowColor = colors[0] ?? textColor;
  const maskImage = useTransform(reveal, (v) => buildScanMask(v, angle));
  const colorImage = useTransform(reveal, (v) => buildScanColor(v, textColor, glowColor, angle));

  useLayoutEffect(() => {
    const element = elementRef.current;

    if (!(element && fixedWidth && isMulti)) {
      setLockedWidth(undefined);
      return;
    }

    setLockedWidth(measureMaxWidth(element, texts));
  }, [fixedWidth, isMulti, texts]);

  const clearCycle = useCallback(() => {
    reveal.stop();
    textOpacity.stop();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = undefined;
  }, [reveal, textOpacity]);

  const playRef = useRef<() => void>(() => undefined);

  playRef.current = () => {
    clearCycle();
    reveal.set(0);
    textOpacity.set(1);

    animate(reveal, 100, {
      duration,
      delay,
      ease,
      onComplete() {
        onComplete?.();

        if (!repeat) {
          return;
        }

        timerRef.current = setTimeout(() => {
          animate(textOpacity, 0, {
            duration: fadeDuration,
            ease: fadeEase,
            onComplete() {
              indexRef.current = (indexRef.current + 1) % texts.length;
              setActiveIndex(indexRef.current);
              reveal.set(0);
              textOpacity.set(1);

              timerRef.current = setTimeout(() => {
                playRef.current();
              }, repeatDelay * 1000);
            },
          });
        }, holdDuration * 1000);
      },
    });
  };

  const replay = useCallback(() => {
    if (prefersReducedMotion) {
      return;
    }

    indexRef.current = 0;
    setActiveIndex(0);
    playRef.current();
  }, [prefersReducedMotion]);

  const play = useCallback(() => {
    if (prefersReducedMotion) {
      return;
    }

    playRef.current();
  }, [prefersReducedMotion]);

  useImperativeHandle(controlRef, () => ({ play, replay }), [play, replay]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run only when visibility or text list changes
  useEffect(() => {
    indexRef.current = 0;
    setActiveIndex(0);
    clearCycle();
    reveal.set(0);
    textOpacity.set(1);

    if (canAnimate) {
      playRef.current();
    }

    return clearCycle;
  }, [canAnimate, texts]);

  const MotionComponent = useMemo(
    () =>
      motion.create(Component as never) as ComponentType<
        MotionProps & {
          children?: ReactNode;
          className?: string;
          ref?: Ref<HTMLElement>;
        }
      >,
    [Component],
  );
  const resolvedColor = textColor === "currentColor" ? "inherit" : textColor;

  return (
    <MotionComponent
      className={cn("inline-block bg-clip-text", className)}
      ref={elementRef}
      style={
        prefersReducedMotion
          ? {
              color: resolvedColor,
              opacity: 1,
              ...(lockedWidth != null && {
                width: lockedWidth,
                whiteSpace: "nowrap",
              }),
            }
          : {
              color: resolvedColor,
              WebkitTextFillColor: "transparent",
              backgroundImage: colorImage,
              backgroundSize: "100% 100%",
              WebkitMaskImage: maskImage,
              maskImage,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              opacity: textOpacity,
              ...(lockedWidth != null && {
                width: lockedWidth,
                whiteSpace: "nowrap",
              }),
            }
      }
    >
      {prefersReducedMotion ? texts[0] : texts[activeIndex]}
    </MotionComponent>
  );
}

export default DiaTextReveal;

"use client";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

interface RevealProps extends Omit<ComponentPropsWithoutRef<"div">, "className"> {
  children: ReactNode;
  as?: ElementType;
  delay?: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

export function Reveal({ children, as: Tag = "div", delay, className, ...rest }: RevealProps) {
  const ref = useScrollReveal<HTMLElement>();
  return (
    <Tag ref={ref} className={cn("reveal", className)} data-delay={delay} {...rest}>
      {children}
    </Tag>
  );
}

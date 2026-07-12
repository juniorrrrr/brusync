import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "accent" | "outline";
  withArrow?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "accent",
  withArrow = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <a
      className={cn("btn", variant === "accent" ? "btn-accent" : "btn-outline", className)}
      {...props}
    >
      {children}
      {variant === "accent" && <span className="sweep" />}
      {withArrow && <span className="arr">→</span>}
    </a>
  );
}

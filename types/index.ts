import type { ReactNode } from "react";

export interface NavLink {
  label: string;
  href: string;
  target: string;
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface SourcePlatform {
  name: string;
  icon: ReactNode;
}

export interface SolutionItem {
  title: string;
  description: string;
  icon: ReactNode;
}

export interface DifferentiatorItem {
  title: string;
  description: string;
  icon: ReactNode;
}

export interface TimelineStep {
  number: string;
  title: ReactNode;
  description: string;
  icon: ReactNode;
}

export interface TestimonialItem {
  quote: string;
  role: string;
  segment: string;
}

export interface ShowcaseCard {
  area: string;
  catColor: string;
  palette: [string, string];
  revenue: number;
  meta: number;
  variation: number;
  featured?: boolean;
}

export type CountFormat =
  | "brlM"
  | "brlK"
  | "brlKint"
  | "brlDec2"
  | "dec2"
  | "percent2"
  | "thousand"
  | "pctint"
  | "pluspctint"
  | "int";

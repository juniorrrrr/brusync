import type { CountFormat } from "@/types";

function dec2(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatCount(value: number, format: CountFormat): string {
  switch (format) {
    case "brlM":
      return `R$ ${dec2(value)}M`;
    case "brlK":
    case "brlKint":
      return `R$ ${Math.round(value)}K`;
    case "brlDec2":
      return `R$ ${dec2(value)}`;
    case "dec2":
      return dec2(value);
    case "percent2":
      return `${dec2(value)}%`;
    case "thousand":
      return Math.round(value).toLocaleString("pt-BR");
    case "pctint":
      return `${Math.round(value)}%`;
    case "pluspctint":
      return `+${Math.round(value)}%`;
    default:
      return String(Math.round(value));
  }
}

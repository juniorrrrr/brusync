import { siteConfig } from "@/config/site.config";
import type { SocialLink } from "@/types";

export const socialLinks: SocialLink[] = [
  {
    label: "LinkedIn",
    // URL oficial ainda não publicada — mantido "#" até a página estar no ar.
    href: "#",
    ariaLabel: "LinkedIn da Brusync (em breve)",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/brusyncbr/",
    ariaLabel: "Instagram da Brusync",
    external: true,
  },
  {
    label: "E-mail",
    href: `mailto:${siteConfig.contact.email}`,
    ariaLabel: "Enviar e-mail para a Brusync",
  },
];

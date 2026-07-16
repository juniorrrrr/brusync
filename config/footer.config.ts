export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export const footerColumns: FooterColumn[] = [
  {
    title: "Soluções",
    links: [
      { label: "Software sob medida", href: "/#solucoes" },
      { label: "White Label", href: "/#solucao" },
      { label: "Integrações", href: "/#integracoes" },
      { label: "Agentes de IA", href: "/#solucoes" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "Cases", href: "/cases" },
      { label: "Blog", href: "/blog" },
      { label: "Materiais", href: "/materiais" },
      // API: sem documentação pública ainda — item fica oculto para não gerar link quebrado.
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre a Brusync", href: "/sobre" },
      { label: "Política de Privacidade", href: "/privacidade" },
      { label: "Termos de Uso", href: "/termos" },
    ],
  },
];

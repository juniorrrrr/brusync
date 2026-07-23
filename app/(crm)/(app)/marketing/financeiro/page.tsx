import type { Metadata } from "next";
import { getFinancialMarketingPageData } from "@/application/financial/financialMarketingQueries";
import { MarketingFinancialPanel } from "@/components/financial/MarketingFinancialPanel";
import "@/styles/financial.css";

export const metadata: Metadata = {
  title: "Financeiro — Marketing Intelligence",
};

export default async function MarketingFinancialPage() {
  const data = await getFinancialMarketingPageData();

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)", marginBottom: 4 }}>
        Indicadores financeiros
      </h2>
      <p className="crm-card-sub" style={{ marginBottom: 20 }}>
        CAC, ROI e ROAS calculados com receita realmente recebida e investimento lançado em
        marketing_campaign_spend — nunca um valor inventado.
      </p>
      <MarketingFinancialPanel data={data} />
    </div>
  );
}

import { Sidebar, Topbar } from "@/components/dashboard-mock/primitives/Chrome";
import { BarChart, DonutChart, LineChart } from "@/components/dashboard-mock/primitives/charts";
import {
  IconBell,
  IconBolt,
  IconChart,
  IconGrid,
  IconReport,
  IconRobot,
  IconTarget,
  IconWallet,
} from "@/components/dashboard-mock/primitives/icons";
import { KpiGrid } from "@/components/dashboard-mock/primitives/KpiGrid";
import { Panel } from "@/components/dashboard-mock/primitives/Panel";

const NAV = (active: string) => [
  { label: "Visão Geral", icon: <IconGrid />, active: active === "Visão Geral" },
  { label: "KPIs", icon: <IconTarget />, active: active === "KPIs" },
  { label: "Financeiro", icon: <IconWallet />, active: active === "Financeiro" },
  { label: "Marketing", icon: <IconChart />, active: active === "Marketing" },
  { label: "Relatórios", icon: <IconReport />, active: active === "Relatórios" },
];

export function BiDashboardDesktop() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Visão Geral")} />
      <div className="dash-main">
        <Topbar title="Visão Geral" search userInitials="RC" />
        <KpiGrid
          items={[
            { label: "Faturamento", value: "R$ 1,86M", delta: "▲ 22,4%" },
            { label: "Lucro líquido", value: "R$ 412K", delta: "▲ 14,1%" },
            { label: "ROAS", value: "5,4x", delta: "▲ 0,8x" },
            { label: "CAC", value: "R$ 186", delta: "▼ 9,2%" },
          ]}
        />
        <div className="dash-row">
          <Panel label="Receita — últimos 12 meses">
            <LineChart
              d="M0 76 C30 66,50 58,70 60 S110 42,130 46 S165 28,185 32 S225 14,250 18 S285 6,300 8"
              color="#1F5EFF"
            />
          </Panel>
          <Panel label="Origem do investimento">
            <DonutChart
              segments={[
                { value: 58, color: "#1F5EFF" },
                { value: 42, color: "#25D0C3" },
              ]}
            />
          </Panel>
        </div>
        <div className="dash-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Panel label="Leads por canal (CRM x ERP)">
            <BarChart
              bars={[
                { value: 32, color: "#1F5EFF" },
                { value: 44, color: "#25D0C3" },
                { value: 26, color: "#1F5EFF", opacity: 0.6 },
                { value: 38, color: "#25D0C3", opacity: 0.7 },
                { value: 30, color: "#081C3A", opacity: 0.5 },
              ]}
            />
          </Panel>
          <Panel label="Alertas inteligentes">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div className="msg ai" style={{ maxWidth: "100%" }}>
                <IconBolt /> CAC caiu 9% após otimização de campanhas Meta Ads
              </div>
              <div className="msg ai" style={{ maxWidth: "100%" }}>
                <IconRobot /> ROAS do Google Ads 18% acima da meta mensal
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function BiDashboardMobile() {
  return (
    <div className="mscreen">
      <div className="mscreen-status" />
      <div className="mscreen-head">
        <div className="mh-greet">Boa tarde, Rafael</div>
        <h6>Visão Geral</h6>
      </div>
      <div className="mscreen-body">
        <div className="mscreen-kpis">
          <div className="mscreen-card">
            <div className="mc-label">Faturamento</div>
            <div className="mc-val">R$ 1,86M</div>
            <div className="mc-delta">▲ 22,4%</div>
          </div>
          <div className="mscreen-card">
            <div className="mc-label">ROAS</div>
            <div className="mc-val">5,4x</div>
            <div className="mc-delta">▲ 0,8x</div>
          </div>
        </div>
        <div className="mscreen-panel">
          <div className="mp-label">Receita — 12 meses</div>
          <LineChart
            d="M0 76 C30 66,50 58,70 60 S110 42,130 46 S165 28,185 32 S225 14,250 18 S285 6,300 8"
            color="#1F5EFF"
            height={60}
          />
        </div>
        <div className="mscreen-panel">
          <div className="mp-label">Alertas inteligentes</div>
          <div className="mscreen-list-row">
            <IconBell />
            CAC caiu 9% essa semana
          </div>
          <div className="mscreen-list-row">
            <IconRobot />
            ROAS 18% acima da meta
          </div>
        </div>
      </div>
      <div className="mscreen-nav">
        <div className="mscreen-nav-item on">
          <IconGrid />
          Início
        </div>
        <div className="mscreen-nav-item">
          <IconTarget />
          KPIs
        </div>
        <div className="mscreen-nav-item">
          <IconWallet />
          Financeiro
        </div>
        <div className="mscreen-nav-item">
          <IconReport />
          Relatórios
        </div>
      </div>
    </div>
  );
}

export function BiKpis() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("KPIs")} />
      <div className="dash-main">
        <Topbar title="KPIs" search userInitials="RC" />
        <KpiGrid
          items={[
            { label: "Receita", value: "R$ 1,86M", delta: "▲ 22,4%" },
            { label: "Lucro", value: "R$ 412K", delta: "▲ 14,1%" },
            { label: "ROAS", value: "5,4x", delta: "▲ 0,8x" },
            { label: "CAC", value: "R$ 186", delta: "▼ 9,2%" },
          ]}
        />
        <div style={{ marginTop: 9 }}>
          <KpiGrid
            items={[
              { label: "Ticket médio", value: "R$ 2.140", delta: "▲ 4,6%" },
              { label: "Conversão", value: "3,8%", delta: "▲ 0,6pp" },
              { label: "Google Ads", value: "R$ 92K", delta: "▲ 11%" },
              { label: "Meta Ads", value: "R$ 68K", delta: "▲ 7%" },
            ]}
          />
        </div>
        <div className="dash-row" style={{ gridTemplateColumns: "1fr" }}>
          <Panel label="Comparativo mensal — meta x realizado">
            <BarChart
              bars={[
                { value: 30, color: "#EAF0F8" },
                { value: 38, color: "#1F5EFF" },
                { value: 34, color: "#EAF0F8" },
                { value: 44, color: "#1F5EFF" },
                { value: 30, color: "#EAF0F8" },
                { value: 40, color: "#25D0C3" },
              ]}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function BiFinanceiro() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Financeiro")} />
      <div className="dash-main">
        <Topbar title="Financeiro" search userInitials="RC" />
        <KpiGrid
          items={[
            { label: "Receita", value: "R$ 1,86M", delta: "▲ 22,4%" },
            { label: "Despesas", value: "R$ 1,03M", delta: "▲ 4,1%" },
            { label: "Lucro líquido", value: "R$ 412K", delta: "▲ 14,1%" },
            { label: "Margem", value: "22,1%", delta: "▲ 1,4pp" },
          ]}
        />
        <div className="dash-row">
          <Panel label="Fluxo de caixa">
            <LineChart
              d="M0 60 C30 66,50 50,70 44 S110 62,130 56 S165 30,185 34 S225 46,250 40 S285 18,300 20"
              color="#25D0C3"
            />
          </Panel>
          <Panel label="Distribuição de custos">
            <DonutChart
              segments={[
                { value: 44, color: "#081C3A" },
                { value: 32, color: "#1F5EFF" },
                { value: 24, color: "#25D0C3" },
              ]}
            />
          </Panel>
        </div>
        <table className="data-table" style={{ marginTop: 9 }}>
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Valor</th>
              <th>Var.</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mídia paga (Ads)</td>
              <td className="num">R$ 160K</td>
              <td className="num" style={{ color: "#12A594" }}>
                ▲ 11%
              </td>
            </tr>
            <tr>
              <td>Folha e equipe</td>
              <td className="num">R$ 486K</td>
              <td className="num muted">▲ 2%</td>
            </tr>
            <tr>
              <td>Infraestrutura</td>
              <td className="num">R$ 94K</td>
              <td className="num" style={{ color: "#12A594" }}>
                ▼ 6%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BiRelatorios() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Relatórios")} />
      <div className="dash-main">
        <Topbar title="Relatórios" search userInitials="RC" />
        <div className="dash-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Panel label="Relatório executivo — Julho">
            <div className="mscreen-list-row">
              <IconReport /> Gerado automaticamente · 15/07
            </div>
          </Panel>
          <Panel label="Relatório comercial — Julho">
            <div className="mscreen-list-row">
              <IconChart /> Comparativo de metas · 15/07
            </div>
          </Panel>
        </div>
        <div className="dash-row" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 9 }}>
          <Panel label="Relatório de campanhas">
            <div className="mscreen-list-row">
              <IconTarget /> Google Ads + Meta Ads · 14/07
            </div>
          </Panel>
          <Panel label="IA gerando insights">
            <div className="msg ai" style={{ maxWidth: "100%" }}>
              <IconRobot /> "O CAC do time comercial caiu 9% após ajuste de segmentação — recomendo
              realocar 15% do orçamento para o canal com melhor ROAS."
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

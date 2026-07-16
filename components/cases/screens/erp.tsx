import { Sidebar, Topbar } from "@/components/dashboard-mock/primitives/Chrome";
import { BarChart, LineChart } from "@/components/dashboard-mock/primitives/charts";
import {
  IconBuilding,
  IconCart,
  IconGrid,
  IconPackage,
  IconReport,
  IconTruck,
  IconWallet,
} from "@/components/dashboard-mock/primitives/icons";
import { KpiGrid } from "@/components/dashboard-mock/primitives/KpiGrid";
import { Panel } from "@/components/dashboard-mock/primitives/Panel";

const NAV = (active: string) => [
  { label: "Dashboard", icon: <IconGrid />, active: active === "Dashboard" },
  { label: "Financeiro", icon: <IconWallet />, active: active === "Financeiro" },
  { label: "Pedidos", icon: <IconCart />, active: active === "Pedidos" },
  { label: "Estoque", icon: <IconPackage />, active: active === "Estoque" },
  { label: "Fornecedores", icon: <IconTruck />, active: active === "Fornecedores" },
  { label: "Relatórios", icon: <IconReport />, active: active === "Relatórios" },
];

export function ErpDashboard() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Dashboard")} />
      <div className="dash-main">
        <Topbar title="Visão geral da operação" search userInitials="MT" />
        <KpiGrid
          items={[
            { label: "Faturamento", value: "R$ 968K", delta: "▲ 12,8%" },
            { label: "Pedidos no mês", value: "1.240", delta: "▲ 8,4%" },
            { label: "Ticket médio", value: "R$ 780", delta: "▲ 3,1%" },
            { label: "Estoque crítico", value: "9 itens", delta: "▼ risco", tone: "warn" },
          ]}
        />
        <div className="dash-row">
          <Panel label="Faturamento — últimos 6 meses">
            <LineChart
              d="M0 72 C30 68,50 60,70 58 S110 44,130 40 S165 50,185 46 S225 24,250 20 S285 14,300 10"
              color="#1F5EFF"
            />
          </Panel>
          <Panel label="Pedidos por canal">
            <BarChart
              bars={[
                { value: 40, color: "#1F5EFF" },
                { value: 28, color: "#25D0C3" },
                { value: 34, color: "#081C3A", opacity: 0.6 },
              ]}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function ErpFinanceiro() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Financeiro")} />
      <div className="dash-main">
        <Topbar title="Financeiro" search userInitials="MT" />
        <KpiGrid
          items={[
            { label: "A receber", value: "R$ 214K", delta: "32 títulos" },
            { label: "A pagar", value: "R$ 148K", delta: "21 títulos" },
            { label: "Saldo projetado", value: "R$ 66K", delta: "▲ positivo" },
            { label: "Inadimplência", value: "1,8%", delta: "▼ 0,4pp" },
          ]}
        />
        <Panel label="Fluxo de caixa — próximos 30 dias">
          <LineChart
            d="M0 50 C30 44,50 60,70 56 S110 34,130 38 S165 58,185 52 S225 30,250 26 S285 44,300 40"
            color="#25D0C3"
          />
        </Panel>
        <table className="data-table" style={{ marginTop: 9 }}>
          <thead>
            <tr>
              <th>Título</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>NF 4471 — Distribuidora Vale</td>
              <td className="muted">18/07</td>
              <td className="num">R$ 12.400</td>
              <td>
                <span className="badge-status ok">Em dia</span>
              </td>
            </tr>
            <tr>
              <td>NF 4488 — Cliente Prime Corp</td>
              <td className="muted">20/07</td>
              <td className="num">R$ 8.900</td>
              <td>
                <span className="badge-status ok">Em dia</span>
              </td>
            </tr>
            <tr>
              <td>NF 4390 — Comércio Bela Vista</td>
              <td className="muted">05/07</td>
              <td className="num">R$ 3.150</td>
              <td>
                <span className="badge-status warn">Atrasado</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ErpPedidos() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Pedidos")} />
      <div className="dash-main">
        <Topbar title="Pedidos" search userInitials="MT" />
        <table className="data-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Itens</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#8821</td>
              <td>Distribuidora Vale</td>
              <td className="muted">14</td>
              <td className="num">R$ 6.480</td>
              <td>
                <span className="badge-status ok">Faturado</span>
              </td>
            </tr>
            <tr>
              <td>#8822</td>
              <td>Comércio Bela Vista</td>
              <td className="muted">6</td>
              <td className="num">R$ 1.920</td>
              <td>
                <span className="badge-status warn">Separando</span>
              </td>
            </tr>
            <tr>
              <td>#8823</td>
              <td>Prime Corp Ltda.</td>
              <td className="muted">22</td>
              <td className="num">R$ 11.340</td>
              <td>
                <span className="badge-status ok">Faturado</span>
              </td>
            </tr>
            <tr>
              <td>#8824</td>
              <td>Grupo Horizonte</td>
              <td className="muted">3</td>
              <td className="num">R$ 890</td>
              <td>
                <span className="badge-status warn">Aguardando pagamento</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ErpPedidosMobile() {
  const orders = [
    {
      id: "#8821",
      client: "Distribuidora Vale",
      value: "R$ 6.480",
      status: "ok",
      label: "Faturado",
    },
    {
      id: "#8822",
      client: "Comércio Bela Vista",
      value: "R$ 1.920",
      status: "warn",
      label: "Separando",
    },
    {
      id: "#8823",
      client: "Prime Corp Ltda.",
      value: "R$ 11.340",
      status: "ok",
      label: "Faturado",
    },
  ];
  return (
    <div className="mscreen">
      <div className="mscreen-status" />
      <div className="mscreen-head">
        <div className="mh-greet">1.240 pedidos no mês</div>
        <h6>Pedidos</h6>
      </div>
      <div className="mscreen-body">
        <div className="mscreen-kpis">
          <div className="mscreen-card">
            <div className="mc-label">Faturamento</div>
            <div className="mc-val">R$ 968K</div>
            <div className="mc-delta">▲ 12,8%</div>
          </div>
          <div className="mscreen-card">
            <div className="mc-label">Ticket médio</div>
            <div className="mc-val">R$ 780</div>
            <div className="mc-delta">▲ 3,1%</div>
          </div>
        </div>
        <div className="mscreen-panel">
          <div className="mp-label">Últimos pedidos</div>
          {orders.map((o) => (
            <div className="mscreen-list-row" key={o.id}>
              <IconCart />
              <span style={{ flex: 1 }}>
                {o.id} · {o.client}
              </span>
              <span className={`badge-status ${o.status}`}>{o.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mscreen-nav">
        <div className="mscreen-nav-item">
          <IconGrid />
          Início
        </div>
        <div className="mscreen-nav-item on">
          <IconCart />
          Pedidos
        </div>
        <div className="mscreen-nav-item">
          <IconPackage />
          Estoque
        </div>
        <div className="mscreen-nav-item">
          <IconReport />
          Relatórios
        </div>
      </div>
    </div>
  );
}

export function ErpEstoque() {
  const rows = [
    { name: "Chapa de aço 2mm", stock: 82, min: 40, pct: 82, color: "#12A594" },
    { name: "Parafuso M6 (cx 100un)", stock: 18, min: 30, pct: 30, color: "#e5484d" },
    { name: "Tinta industrial 20L", stock: 54, min: 25, pct: 70, color: "#12A594" },
    { name: "Correia transportadora", stock: 9, min: 15, pct: 22, color: "#e5484d" },
  ];
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Estoque")} />
      <div className="dash-main">
        <Topbar title="Estoque" search userInitials="MT" />
        <KpiGrid
          cols={3}
          items={[
            { label: "SKUs ativos", value: "486", delta: "▲ 12 novos" },
            { label: "Giro médio", value: "3,4x", delta: "▲ 0,3x" },
            { label: "Itens críticos", value: "9", delta: "requer compra", tone: "warn" },
          ]}
        />
        <table className="data-table" style={{ marginTop: 9 }}>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Mínimo</th>
              <th>Nível</th>
              <th>Estoque</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td className="muted">{r.min} un</td>
                <td>
                  <span className="stock-bar">
                    <span style={{ width: `${r.pct}%`, background: r.color }} />
                  </span>
                </td>
                <td className="num">{r.stock} un</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ErpRelatorios() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Relatórios")} />
      <div className="dash-main">
        <Topbar title="Relatórios" search userInitials="MT" />
        <div className="dash-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Panel label="Fechamento financeiro — Junho">
            <div className="mscreen-list-row">
              <IconWallet /> DRE completo · gerado em 01/07
            </div>
          </Panel>
          <Panel label="Relatório de estoque">
            <div className="mscreen-list-row">
              <IconPackage /> Posição de estoque · atualizado hoje
            </div>
          </Panel>
        </div>
        <div className="dash-row" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 9 }}>
          <Panel label="Curva ABC de fornecedores">
            <div className="mscreen-list-row">
              <IconBuilding /> 24 fornecedores ativos
            </div>
          </Panel>
          <Panel label="Pedidos por período">
            <BarChart
              bars={[
                { value: 24, color: "#1F5EFF" },
                { value: 30, color: "#25D0C3" },
                { value: 18, color: "#081C3A", opacity: 0.6 },
                { value: 34, color: "#1F5EFF", opacity: 0.7 },
              ]}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}

import { AgendaList } from "@/components/dashboard-mock/primitives/AgendaList";
import { Sidebar, Topbar } from "@/components/dashboard-mock/primitives/Chrome";
import { DonutChart, LineChart } from "@/components/dashboard-mock/primitives/charts";
import { FlowRules } from "@/components/dashboard-mock/primitives/FlowRules";
import {
  IconBell,
  IconBolt,
  IconCalendar,
  IconChat,
  IconFunnel,
  IconGrid,
  IconRobot,
  IconSettings,
  IconUsers,
} from "@/components/dashboard-mock/primitives/icons";
import { Kanban } from "@/components/dashboard-mock/primitives/Kanban";
import { KpiGrid } from "@/components/dashboard-mock/primitives/KpiGrid";
import { Panel } from "@/components/dashboard-mock/primitives/Panel";
import { Thread } from "@/components/dashboard-mock/primitives/Thread";

const NAV = (active: string) => [
  { label: "Dashboard", icon: <IconGrid />, active: active === "Dashboard" },
  { label: "Pipeline", icon: <IconFunnel />, active: active === "Pipeline" },
  { label: "Leads", icon: <IconUsers />, active: active === "Leads" },
  { label: "Agenda", icon: <IconCalendar />, active: active === "Agenda" },
  { label: "Configurações", icon: <IconSettings />, active: active === "Configurações" },
];

export function CrmDashboard() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Dashboard")} />
      <div className="dash-main">
        <Topbar title="Dashboard comercial" search userInitials="JS" />
        <KpiGrid
          items={[
            { label: "Leads no funil", value: "312", delta: "▲ 18%" },
            { label: "Conversão", value: "24,6%", delta: "▲ 2,1pp" },
            { label: "Ticket médio", value: "R$ 3.480", delta: "▲ 6%" },
            { label: "Vendas no mês", value: "R$ 486K", delta: "▲ 19%" },
          ]}
        />
        <div className="dash-row">
          <Panel label="Vendas — últimos 6 meses">
            <LineChart
              d="M0 70 C30 62,50 66,70 54 S110 48,130 40 S165 44,185 30 S225 26,250 18 S285 10,300 8"
              color="#25D0C3"
            />
          </Panel>
          <Panel label="Origem dos leads">
            <DonutChart
              segments={[
                { value: 46, color: "#25D0C3" },
                { value: 34, color: "#1F5EFF" },
                { value: 20, color: "#081C3A" },
              ]}
            />
          </Panel>
        </div>
        <div className="dash-row" style={{ gridTemplateColumns: "1fr" }}>
          <Panel label="IA resumindo o dia">
            <div className="msg ai" style={{ maxWidth: "100%" }}>
              <IconRobot /> "6 leads quentes sem follow-up há mais de 24h. Priorize Fernanda Souza
              (proposta enviada) e Diego Lima (2ª reunião agendada)."
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function CrmPipeline() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Pipeline")} />
      <div className="dash-main">
        <Topbar title="Pipeline comercial" search userInitials="JS" />
        <Kanban
          columns={[
            {
              title: "Novo lead",
              cards: [
                { title: "Fernanda Souza — ERP", value: "R$ 4.200" },
                { title: "Diego Lima — CRM", value: "R$ 2.800" },
                { title: "Marcos Vieira — BI", value: "R$ 6.100" },
              ],
            },
            {
              title: "Qualificação",
              cards: [
                { title: "Patrícia Nunes — ERP", value: "R$ 5.400" },
                { title: "Rafael Costa — CRM", value: "R$ 3.100" },
              ],
            },
            {
              title: "Proposta",
              cards: [
                { title: "Carla Mendes — BI", value: "R$ 8.900" },
                { title: "André Ramos — ERP", value: "R$ 4.700" },
              ],
            },
            {
              title: "Fechamento",
              cards: [{ title: "Bruno Alves — CRM", value: "R$ 3.900" }],
            },
          ]}
        />
      </div>
    </div>
  );
}

export function CrmLead() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Leads")} />
      <div className="dash-main">
        <Topbar title="Fernanda Souza" search userInitials="JS" />
        <div className="dash-row" style={{ gridTemplateColumns: "0.8fr 1.2fr" }}>
          <Panel label="Dados do lead">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="mscreen-list-row">
                <IconUsers /> Souza Contabilidade Ltda.
              </div>
              <div className="mscreen-list-row">
                <IconChat /> +55 11 98220-4471
              </div>
              <div className="mscreen-list-row">
                <IconBell /> Proposta enviada há 2 dias
              </div>
              <div className="msg ai" style={{ maxWidth: "100%" }}>
                <IconRobot /> Resumo da IA: cliente pediu desconto de 10% e prazo de implantação em
                30 dias. Alta chance de fechamento essa semana.
              </div>
            </div>
          </Panel>
          <Panel label="Conversa — WhatsApp">
            <Thread
              messages={[
                { from: "in", text: "Oi! Vi a proposta, ficou ótima 👏", time: "09:14" },
                {
                  from: "out",
                  text: "Que bom, Fernanda! Consigo fechar com 10% até sexta.",
                  time: "09:16",
                },
                { from: "in", text: "Fechado! Pode preparar o contrato.", time: "09:20" },
              ]}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function CrmAgenda() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Agenda")} />
      <div className="dash-main">
        <Topbar title="Agenda comercial" search userInitials="JS" />
        <Panel label="Hoje, 15 de julho">
          <AgendaList
            rows={[
              {
                time: "09:30",
                title: "Reunião — Marcos Vieira (BI)",
                sub: "Apresentação de proposta",
              },
              { time: "11:00", title: "Follow-up — Diego Lima", sub: "Ligação de qualificação" },
              { time: "14:00", title: "Onboarding — Bruno Alves", sub: "Kickoff de implantação" },
              { time: "16:30", title: "Reunião — Carla Mendes", sub: "Negociação de contrato" },
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}

export function CrmAgendaMobile() {
  return (
    <div className="mscreen">
      <div className="mscreen-status" />
      <div className="mscreen-head">
        <div className="mh-greet">Hoje, 15 de julho</div>
        <h6>Agenda</h6>
      </div>
      <div className="mscreen-body">
        <div className="mscreen-panel">
          <AgendaList
            rows={[
              { time: "09:30", title: "Marcos Vieira (BI)", sub: "Apresentação de proposta" },
              { time: "11:00", title: "Diego Lima", sub: "Ligação de qualificação" },
              { time: "14:00", title: "Bruno Alves", sub: "Kickoff de implantação" },
              { time: "16:30", title: "Carla Mendes", sub: "Negociação de contrato" },
            ]}
          />
        </div>
      </div>
      <div className="mscreen-nav">
        <div className="mscreen-nav-item">
          <IconGrid />
          Início
        </div>
        <div className="mscreen-nav-item">
          <IconFunnel />
          Pipeline
        </div>
        <div className="mscreen-nav-item on">
          <IconCalendar />
          Agenda
        </div>
        <div className="mscreen-nav-item">
          <IconSettings />
          Ajustes
        </div>
      </div>
    </div>
  );
}

export function CrmConfiguracoes() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Configurações")} />
      <div className="dash-main">
        <Topbar title="Automações" search userInitials="JS" />
        <Panel label="Regras ativas">
          <FlowRules
            rules={[
              {
                icon: <IconBolt />,
                title: "Follow-up automático via WhatsApp",
                sub: "Envia mensagem após 24h sem resposta",
              },
              {
                icon: <IconFunnel />,
                title: "Avançar etapa no funil",
                sub: "Move o lead ao receber a 1ª resposta",
              },
              {
                icon: <IconBell />,
                title: "Notificar vendedor",
                sub: "Alerta imediato para novo lead quente",
              },
              {
                icon: <IconRobot />,
                title: "Resumo semanal por IA",
                sub: "Envia todo domingo às 8h",
                on: false,
              },
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}

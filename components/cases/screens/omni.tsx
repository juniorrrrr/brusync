import { Sidebar, Topbar } from "@/components/dashboard-mock/primitives/Chrome";
import { BarChart, DonutChart, LineChart } from "@/components/dashboard-mock/primitives/charts";
import { FlowRules } from "@/components/dashboard-mock/primitives/FlowRules";
import { InboxList } from "@/components/dashboard-mock/primitives/InboxList";
import {
  IconBolt,
  IconChart,
  IconChat,
  IconGrid,
  IconInbox,
  IconInstagram,
  IconMessenger,
  IconReport,
  IconRobot,
  IconSettings,
  IconTag,
  IconWhatsapp,
} from "@/components/dashboard-mock/primitives/icons";
import { KpiGrid } from "@/components/dashboard-mock/primitives/KpiGrid";
import { Panel } from "@/components/dashboard-mock/primitives/Panel";
import { Thread } from "@/components/dashboard-mock/primitives/Thread";

const NAV = (active: string) => [
  { label: "Inbox", icon: <IconInbox />, active: active === "Inbox" },
  { label: "Dashboard", icon: <IconGrid />, active: active === "Dashboard" },
  { label: "Automações", icon: <IconSettings />, active: active === "Automações" },
  { label: "Etiquetas", icon: <IconTag />, active: active === "Etiquetas" },
  { label: "Relatórios", icon: <IconReport />, active: active === "Relatórios" },
];

export function OmniInbox() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Inbox")} />
      <div className="dash-main">
        <Topbar title="Inbox — todas as conversas" search userInitials="LC" />
        <div className="dash-row" style={{ gridTemplateColumns: "0.75fr 1.25fr" }}>
          <Panel label="Conversas (8 novas)">
            <InboxList
              rows={[
                {
                  name: "Fernanda Souza",
                  preview: "Perfeito, muito obrigada!",
                  time: "09:41",
                  channelIcon: <IconWhatsapp />,
                  channelColor: "#25D366",
                  active: true,
                },
                {
                  name: "Ricardo Prado",
                  preview: "Vocês fazem entrega em Curitiba?",
                  time: "09:22",
                  channelIcon: <IconInstagram />,
                  channelColor: "#C13584",
                },
                {
                  name: "Grupo Horizonte",
                  preview: "Aguardando retorno sobre orçamento",
                  time: "08:58",
                  channelIcon: <IconMessenger />,
                  channelColor: "#0084FF",
                },
                {
                  name: "Ana Beatriz",
                  preview: "Pode me mandar o catálogo?",
                  time: "08:30",
                  channelIcon: <IconWhatsapp />,
                  channelColor: "#25D366",
                },
              ]}
            />
          </Panel>
          <Panel label="Fernanda Souza · WhatsApp">
            <Thread
              messages={[
                { from: "in", text: "Oi, o pedido #8821 já foi enviado?", time: "09:38" },
                {
                  from: "ai",
                  text: "Assistente: sim! Saiu hoje às 08h, chega em até 2 dias úteis.",
                  time: "09:39",
                },
                { from: "in", text: "Perfeito, muito obrigada!", time: "09:41" },
              ]}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function OmniDashboard() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Dashboard")} />
      <div className="dash-main">
        <Topbar title="Atendimento — visão geral" search userInitials="LC" />
        <KpiGrid
          items={[
            { label: "Conversas hoje", value: "184", delta: "▲ 14%" },
            { label: "Tempo 1ª resposta", value: "48s", delta: "▼ 22%" },
            { label: "Satisfação (CSAT)", value: "96%", delta: "▲ 1,8pp" },
            { label: "Resolvido pela IA", value: "61%", delta: "▲ 9pp" },
          ]}
        />
        <div className="dash-row">
          <Panel label="Conversas por dia — 7 dias">
            <LineChart
              d="M0 60 C30 54,50 58,70 46 S110 50,130 38 S165 42,185 26 S225 30,250 18 S285 22,300 12"
              color="#1F5EFF"
            />
          </Panel>
          <Panel label="Conversas por canal">
            <DonutChart
              segments={[
                { value: 52, color: "#25D366" },
                { value: 28, color: "#C13584" },
                { value: 20, color: "#0084FF" },
              ]}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function OmniChat() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Inbox")} />
      <div className="dash-main">
        <Topbar title="Ricardo Prado · Instagram" search userInitials="LC" />
        <Panel label="Conversa">
          <Thread
            messages={[
              { from: "in", text: "Oi! Vocês fazem entrega em Curitiba?", time: "09:20" },
              {
                from: "ai",
                text: "Assistente: fazemos sim! O prazo médio para Curitiba é de 3 dias úteis.",
                time: "09:20",
              },
              { from: "in", text: "Show, e qual o valor do frete?", time: "09:21" },
              {
                from: "out",
                text: "Vou verificar com a equipe e te retorno em instantes.",
                time: "09:24",
              },
            ]}
          />
        </Panel>
        <div className="dash-row" style={{ gridTemplateColumns: "1fr", marginTop: 9 }}>
          <Panel label="IA — sugestão de resposta">
            <div className="msg ai" style={{ maxWidth: "100%" }}>
              <IconRobot /> "Frete para Curitiba: R$ 24,90, grátis acima de R$ 250. Deseja que eu
              gere o link de pagamento?"
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export function OmniChatMobile() {
  return (
    <div className="mscreen">
      <div className="mscreen-status" />
      <div className="mscreen-head">
        <div className="mh-greet">Instagram · online</div>
        <h6>Ricardo Prado</h6>
      </div>
      <div className="mscreen-body">
        <div className="mscreen-panel" style={{ flex: 1 }}>
          <Thread
            messages={[
              { from: "in", text: "Oi! Entregam em Curitiba?", time: "09:20" },
              {
                from: "ai",
                text: "Assistente: entregamos sim, prazo médio de 3 dias úteis.",
                time: "09:20",
              },
              { from: "in", text: "E o valor do frete?", time: "09:21" },
            ]}
          />
        </div>
      </div>
      <div className="mscreen-nav">
        <div className="mscreen-nav-item">
          <IconInbox />
          Inbox
        </div>
        <div className="mscreen-nav-item on">
          <IconChat />
          Chat
        </div>
        <div className="mscreen-nav-item">
          <IconTag />
          Etiquetas
        </div>
        <div className="mscreen-nav-item">
          <IconReport />
          Relatórios
        </div>
      </div>
    </div>
  );
}

export function OmniAutomacoes() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Automações")} />
      <div className="dash-main">
        <Topbar title="Automações" search userInitials="LC" />
        <Panel label="Fluxos ativos">
          <FlowRules
            rules={[
              {
                icon: <IconBolt />,
                title: "Resposta automática fora do horário",
                sub: "WhatsApp, Instagram e Messenger",
              },
              {
                icon: <IconRobot />,
                title: "Triagem por IA",
                sub: "Classifica e direciona por assunto",
              },
              {
                icon: <IconTag />,
                title: "Etiquetar por urgência",
                sub: "Aplica etiqueta automática em reclamações",
              },
              {
                icon: <IconChart />,
                title: "Transferência para vendas",
                sub: "Quando o cliente pergunta sobre preço",
                on: false,
              },
            ]}
          />
        </Panel>
      </div>
    </div>
  );
}

export function OmniRelatorios() {
  return (
    <div className="dash-inner">
      <Sidebar brand="Brusync" items={NAV("Relatórios")} />
      <div className="dash-main">
        <Topbar title="Relatórios" search userInitials="LC" />
        <div className="dash-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <Panel label="Volume por atendente">
            <BarChart
              bars={[
                { value: 38, color: "#1F5EFF" },
                { value: 44, color: "#25D0C3" },
                { value: 30, color: "#081C3A", opacity: 0.6 },
                { value: 26, color: "#1F5EFF", opacity: 0.7 },
              ]}
            />
          </Panel>
          <Panel label="Satisfação por canal">
            <div className="mscreen-list-row">
              <IconWhatsapp /> WhatsApp · 97% CSAT
            </div>
            <div className="mscreen-list-row">
              <IconInstagram /> Instagram · 94% CSAT
            </div>
            <div className="mscreen-list-row">
              <IconMessenger /> Messenger · 95% CSAT
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

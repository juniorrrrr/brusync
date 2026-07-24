import type { Metadata } from "next";
import { getCommunicationInboxPageData } from "@/application/communication/communicationDashboardQueries";
import { fetchMessageTemplates } from "@/application/communication/communicationLookupsActions";
import { CommunicationInbox } from "@/components/communication/CommunicationInbox";
import { MessageTemplatesDialog } from "@/components/communication/MessageTemplatesDialog";

export const metadata: Metadata = {
  title: "Central de Comunicação",
};

export default async function ComunicacaoPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    channelId?: string;
    ownerId?: string;
    status?: string;
    unread?: string;
    favorite?: string;
    archived?: string;
    origin?: string;
    campaign?: string;
    city?: string;
    conversationId?: string;
  }>;
}) {
  const params = await searchParams;

  const [{ conversations, channels, owners, selected, subjectInfo }, templates] = await Promise.all(
    [
      getCommunicationInboxPageData(
        {
          search: params.q,
          channelId: params.channelId || undefined,
          ownerId: params.ownerId || undefined,
          status: (params.status as "aberta" | "pendente" | "encerrada") || undefined,
          unreadOnly: params.unread === "1",
          favorite: params.favorite === "1",
          archived: params.archived === "1",
          origin: params.origin || undefined,
          campaign: params.campaign || undefined,
          city: params.city || undefined,
        },
        params.conversationId ?? null,
      ),
      fetchMessageTemplates(),
    ],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>
            Central de Comunicação
          </h1>
          <p className="crm-card-sub" style={{ marginTop: 4 }}>
            Todo o histórico de conversas com Leads e Clientes, em um só lugar.
          </p>
        </div>
        <MessageTemplatesDialog templates={templates} />
      </div>

      <CommunicationInbox
        conversations={conversations}
        channels={channels}
        owners={owners}
        templates={templates}
        selected={selected}
        subjectInfo={subjectInfo}
        selectedId={params.conversationId ?? null}
      />
    </div>
  );
}

import { formatDateTime } from "@/domain/crm/format";
import { MESSAGE_TYPE_LABEL } from "@/domain/whatsapp/statusMeta";
import type { WhatsappMessage } from "@/types/whatsapp";

function StatusTicks({ status }: { status: WhatsappMessage["status"] }) {
  if (status === "falhou") return <span style={{ color: "var(--danger)" }}>⚠</span>;
  if (status === "pendente") return <span>🕓</span>;
  if (status === "lido") return <span style={{ color: "var(--secondary)" }}>✓✓</span>;
  if (status === "entregue") return <span>✓✓</span>;
  return <span>✓</span>;
}

export function WhatsappMessageBubble({
  message,
  contactName,
}: {
  message: WhatsappMessage;
  contactName: string;
}) {
  return (
    <div className={`crm-comm-bubble ${message.direction}`}>
      {message.type === "template" && (
        <div className="crm-card-sub" style={{ marginBottom: 4 }}>
          Template: {message.templateName ?? "—"}
        </div>
      )}
      {message.attachment && (
        <div className="crm-card-sub" style={{ marginBottom: 4 }}>
          📎 {message.attachment.fileName} ({MESSAGE_TYPE_LABEL[message.type]})
        </div>
      )}
      <div>{message.body}</div>
      <div className="crm-comm-bubble-meta">
        {message.direction === "outbound" ? (message.senderName ?? "Você") : contactName} ·{" "}
        {formatDateTime(message.createdAt)}
        {message.direction === "outbound" && (
          <>
            {" · "}
            <StatusTicks status={message.status} />
            {message.status === "falhou" && message.error && ` (${message.error})`}
          </>
        )}
      </div>
    </div>
  );
}

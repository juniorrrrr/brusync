/** Allowlist de tipos MIME aceitos em todo upload de documento/anexo do CRM
 * (Leads, Financeiro, Projetos, Portal do Cliente, Base de Conhecimento) —
 * único ponto de verdade para não deixar nenhum fluxo de upload aceitar
 * qualquer tipo de arquivo (ex. HTML/SVG) num bucket privado do Storage. */
export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]);

export function validateDocumentFile(file: File, maxSizeBytes: number): string | null {
  if (file.size > maxSizeBytes) {
    return `Arquivo maior que ${Math.round(maxSizeBytes / (1024 * 1024))}MB.`;
  }
  if (file.type && !ALLOWED_DOCUMENT_MIME_TYPES.has(file.type)) {
    return "Tipo de arquivo não suportado.";
  }
  return null;
}

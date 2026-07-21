export const MAX_LEAD_FILE_SIZE_BYTES = 15 * 1024 * 1024;

export const ALLOWED_LEAD_FILE_MIME_TYPES = new Set([
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

export function validateLeadFile(file: File): string | null {
  if (file.size > MAX_LEAD_FILE_SIZE_BYTES) {
    return "Arquivo maior que 15MB.";
  }
  if (file.type && !ALLOWED_LEAD_FILE_MIME_TYPES.has(file.type)) {
    return "Tipo de arquivo não suportado.";
  }
  return null;
}

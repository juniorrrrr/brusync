import { ALLOWED_DOCUMENT_MIME_TYPES, validateDocumentFile } from "@/schemas/shared/fileValidation";

export const MAX_LEAD_FILE_SIZE_BYTES = 15 * 1024 * 1024;
export const ALLOWED_LEAD_FILE_MIME_TYPES = ALLOWED_DOCUMENT_MIME_TYPES;

export function validateLeadFile(file: File): string | null {
  return validateDocumentFile(file, MAX_LEAD_FILE_SIZE_BYTES);
}

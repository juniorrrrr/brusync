export function jsonLdScript(data: Record<string, unknown>) {
  return { __html: JSON.stringify(data) };
}

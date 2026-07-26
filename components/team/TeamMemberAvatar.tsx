function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

export function TeamMemberAvatar({
  name,
  photoUrl,
  size = 40,
}: {
  name: string | null;
  photoUrl?: string | null;
  size?: number;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name ?? "Colaborador"}
        className="crm-team-avatar"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div className="crm-team-avatar crm-team-avatar-fallback" style={{ width: size, height: size }}>
      {initials(name)}
    </div>
  );
}

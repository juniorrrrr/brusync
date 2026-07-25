"use client";

import { useRouter } from "next/navigation";

export function OwnerFilterSelect({
  owners,
  selectedOwnerId,
}: {
  owners: { id: string; name: string | null; email: string | null }[];
  selectedOwnerId: string | null;
}) {
  const router = useRouter();

  return (
    <select
      id="owner-select"
      value={selectedOwnerId ?? ""}
      onChange={(event) => router.push(`/performance/individual?ownerId=${event.target.value}`)}
    >
      {owners.map((owner) => (
        <option key={owner.id} value={owner.id}>
          {owner.name ?? owner.email}
        </option>
      ))}
    </select>
  );
}

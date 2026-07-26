"use client";

import { useRouter } from "next/navigation";

export function TeamMemberFilterSelect({
  members,
  selectedMemberId,
}: {
  members: { id: string; name: string | null }[];
  selectedMemberId: string | null;
}) {
  const router = useRouter();

  return (
    <select
      id="team-member-select"
      value={selectedMemberId ?? ""}
      onChange={(event) => router.push(`/equipe/individual?memberId=${event.target.value}`)}
    >
      {members.map((member) => (
        <option key={member.id} value={member.id}>
          {member.name ?? member.id}
        </option>
      ))}
    </select>
  );
}

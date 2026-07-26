import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeamMember, TeamMemberStatus, TeamRole } from "@/types/team";

interface TeamMemberRow {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  photo_url: string | null;
  role_id: string | null;
  department: string | null;
  entry_date: string | null;
  status: TeamMemberStatus;
  phone: string | null;
  supervisor_id: string | null;
  notes: string | null;
  profile: {
    id: string;
    name: string | null;
    email: string | null;
    role: TeamMember["accessRole"];
  } | null;
  role: { id: string; name: string } | null;
}

const MEMBER_SELECT = `
  id, created_at, updated_at, profile_id, photo_url, role_id, department, entry_date, status,
  phone, supervisor_id, notes,
  profile:profiles!team_members_profile_id_fkey (id, name, email, role),
  role:team_roles!team_members_role_id_fkey (id, name)
`;

function mapMember(row: TeamMemberRow, nameBySupervisorId: Map<string, string>): TeamMember {
  return {
    id: row.id,
    profileId: row.profile_id,
    name: row.profile?.name ?? null,
    email: row.profile?.email ?? null,
    accessRole: row.profile?.role ?? "comercial",
    photoUrl: row.photo_url,
    roleId: row.role_id,
    roleName: row.role?.name ?? null,
    department: row.department,
    entryDate: row.entry_date,
    status: row.status,
    phone: row.phone,
    supervisorId: row.supervisor_id,
    supervisorName: row.supervisor_id ? (nameBySupervisorId.get(row.supervisor_id) ?? null) : null,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface ListTeamMembersOptions {
  status?: TeamMemberStatus;
}

export async function listTeamMembers(
  supabase: SupabaseClient,
  options: ListTeamMembersOptions = {},
): Promise<TeamMember[]> {
  let query = supabase.from("team_members").select(MEMBER_SELECT);
  if (options.status) query = query.eq("status", options.status);

  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw new Error(`Falha ao carregar colaboradores: ${error.message}`);

  const rows = (data ?? []) as unknown as TeamMemberRow[];
  const nameBySupervisorId = new Map(
    rows.map((row) => [row.id, row.profile?.name ?? row.profile?.email ?? "—"]),
  );
  return rows.map((row) => mapMember(row, nameBySupervisorId));
}

export async function getTeamMemberById(
  supabase: SupabaseClient,
  id: string,
): Promise<TeamMember | null> {
  const all = await listTeamMembers(supabase);
  return all.find((member) => member.id === id) ?? null;
}

export async function getTeamMemberByProfileId(
  supabase: SupabaseClient,
  profileId: string,
): Promise<TeamMember | null> {
  const all = await listTeamMembers(supabase);
  return all.find((member) => member.profileId === profileId) ?? null;
}

export interface UpdateTeamMemberPayload {
  photoUrl?: string | null;
  roleId?: string | null;
  department?: string | null;
  entryDate?: string | null;
  status?: TeamMemberStatus;
  phone?: string | null;
  supervisorId?: string | null;
  notes?: string | null;
}

export async function updateTeamMember(
  supabase: SupabaseClient,
  id: string,
  patch: UpdateTeamMemberPayload,
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (patch.photoUrl !== undefined) payload.photo_url = patch.photoUrl;
  if (patch.roleId !== undefined) payload.role_id = patch.roleId;
  if (patch.department !== undefined) payload.department = patch.department;
  if (patch.entryDate !== undefined) payload.entry_date = patch.entryDate;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.phone !== undefined) payload.phone = patch.phone;
  if (patch.supervisorId !== undefined) payload.supervisor_id = patch.supervisorId;
  if (patch.notes !== undefined) payload.notes = patch.notes;

  const { error } = await supabase.from("team_members").update(payload).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar colaborador: ${error.message}`);
}

export interface CreateTeamMemberPayload {
  profileId: string;
  roleId?: string | null;
  department?: string | null;
  entryDate?: string | null;
  status?: TeamMemberStatus;
  phone?: string | null;
  supervisorId?: string | null;
}

export async function createTeamMember(
  supabase: SupabaseClient,
  payload: CreateTeamMemberPayload,
): Promise<void> {
  const { error } = await supabase.from("team_members").insert({
    profile_id: payload.profileId,
    role_id: payload.roleId ?? null,
    department: payload.department ?? null,
    entry_date: payload.entryDate ?? null,
    status: payload.status ?? "ativo",
    phone: payload.phone ?? null,
    supervisor_id: payload.supervisorId ?? null,
  });
  if (error) throw new Error(`Falha ao criar colaborador: ${error.message}`);
}

export async function listTeamRoles(supabase: SupabaseClient): Promise<TeamRole[]> {
  const { data, error } = await supabase
    .from("team_roles")
    .select("id, created_at, name, department, description")
    .order("name", { ascending: true });

  if (error) throw new Error(`Falha ao carregar cargos: ${error.message}`);
  return (
    (data ?? []) as {
      id: string;
      created_at: string;
      name: string;
      department: string | null;
      description: string | null;
    }[]
  ).map((row) => ({
    id: row.id,
    name: row.name,
    department: row.department,
    description: row.description,
    createdAt: row.created_at,
  }));
}

/** Candidatos a profile_id de um novo colaborador — profiles internos
 * (mesmos 4 papéis de is_internal_staff()) que ainda não têm linha em
 * team_members. Reaproveita repositories/performance/staffRepository.ts em
 * vez de repetir a query "profiles com role in (...)". */
export async function listUnassignedStaffProfiles(
  supabase: SupabaseClient,
): Promise<{ id: string; name: string | null; email: string | null }[]> {
  const { listStaffWithRole } = await import("@/repositories/performance/staffRepository");
  const [staff, members] = await Promise.all([
    listStaffWithRole(supabase),
    listTeamMembers(supabase),
  ]);
  const assigned = new Set(members.map((m) => m.profileId));
  return staff
    .filter((s) => !assigned.has(s.id))
    .map((s) => ({ id: s.id, name: s.name, email: s.email }));
}

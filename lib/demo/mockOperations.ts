/** Demo fixtures across every module (leads, tasks, projects, agenda,
 * conversations) cycle through the same small cast of owners seeded in
 * DEMO_OWNERS (lib/demo/mockSeed.ts) — Camila Rocha is always the first.
 * Modo Demonstração has no real logged-in "current user" it can match
 * against that fixture data, so Mission Control's "Minha fila" is computed
 * against this fixed persona instead of the real profile id, exactly the
 * same way every other demo screen already shows Camila's data as the
 * default owner filter. */
export const DEMO_CURRENT_USER_ID = "00000000-0000-4000-8000-000000000101";

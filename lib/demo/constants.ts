/** Shared, isomorphic (no "server-only"/"use server" directive) so both the
 * server-side cookie check and the client-side toggle button can import the
 * exact same key names without ever duplicating them. */
export const DEMO_MODE_COOKIE = "brusync_demo_mode";
export const DEMO_MODE_STORAGE_KEY = "brusync-demo-mode";

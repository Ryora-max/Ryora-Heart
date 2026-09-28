import { APP_CONFIG } from "@/config";
import type { User } from "@/types";

export type LocalRole = "owner" | "partner";

export const LOCAL_PAIR_ID = "pair-1";

/** Local users selalu punya pair_id — tidak optional seperti User umum. */
export type LocalUser = User & { pair_id: string };

/**
 * Local-auth users (single source of truth).
 * Dipakai oleh: login page, (main)/layout session restore,
 * /api/db, /api/upload, /api/auth.
 */
export const LOCAL_USERS: Record<LocalRole, LocalUser> = {
  owner: {
    id: "user-1",
    name: APP_CONFIG.users.owner.name,
    username: APP_CONFIG.users.owner.username,
    email: APP_CONFIG.users.owner.email,
    role: "owner",
    relationship: APP_CONFIG.users.owner.relationship,
    pair_id: LOCAL_PAIR_ID,
  },
  partner: {
    id: "user-2",
    name: APP_CONFIG.users.partner.name,
    username: APP_CONFIG.users.partner.username,
    email: APP_CONFIG.users.partner.email,
    role: "partner",
    relationship: APP_CONFIG.users.partner.relationship,
    pair_id: LOCAL_PAIR_ID,
  },
};

export const LOCAL_SESSION_COOKIE = "ryora-session";

// Nilai cookie di-sign dengan server secret — string polos "user-session-owner"
// ada di repo publik, jadi tanpa signature siapa pun bisa forge cookie auth.
// Secret: env server (tidak pernah masuk client bundle — non-NEXT_PUBLIC
// env var jadi undefined di browser; value di sana tidak pernah dipakai
// untuk validasi, jadi aman).
function sessionSecret(): string {
  return (
    process.env.LOCAL_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "ryora-local-fallback"
  );
}

/** Fingerprint sinkron tanpa dependency — aman di edge/proxy & browser. */
function fingerprint(input: string): string {
  const s = `ryora:${sessionSecret()}:${input}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}${s.length.toString(36)}`;
}

/** Session cookie value per role, e.g. "user-session-owner-1a2b3c". */
export function sessionValueForRole(role: LocalRole): string {
  return `user-session-${role}-${fingerprint(role)}`;
}

/**
 * Resolve role dari nilai cookie ryora-session — exact match terhadap
 * nilai signed; nilai unsigned/forged ditolak.
 */
export function roleFromSessionValue(sessionValue: string | undefined | null): LocalRole | null {
  if (!sessionValue) return null;
  if (sessionValue === sessionValueForRole("owner")) return "owner";
  if (sessionValue === sessionValueForRole("partner")) return "partner";
  return null;
}

/** User profile untuk role local-auth tertentu (fresh object, aman di-mutate). */
export function getLocalProfile(role: LocalRole): LocalUser {
  return { ...LOCAL_USERS[role] };
}

/**
 * Resolve user profile langsung dari nilai cookie ryora-session.
 * Server routes membaca cookie via `cookies()` lalu pass value-nya ke sini —
 * fungsi ini tetap client-safe (tanpa next/headers).
 */
export function getLocalUserFromSessionValue(sessionValue: string | undefined | null): LocalUser | null {
  const role = roleFromSessionValue(sessionValue);
  return role ? getLocalProfile(role) : null;
}

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

/** Session cookie value per role, e.g. "user-session-owner". */
export function sessionValueForRole(role: LocalRole): string {
  return `user-session-${role}`;
}

/**
 * Resolve role dari nilai cookie ryora-session.
 * Return null kalau cookie tidak ada / tidak dikenal.
 */
export function roleFromSessionValue(sessionValue: string | undefined | null): LocalRole | null {
  if (!sessionValue) return null;
  if (sessionValue.includes("user-session-owner")) return "owner";
  if (sessionValue.includes("user-session-partner")) return "partner";
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

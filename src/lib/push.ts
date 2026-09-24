import webpush, { type PushSubscription } from "web-push";
import { getSupabaseServer } from "@/lib/supabase/server";

function genId(): string {
  return crypto.randomUUID();
}

/**
 * Web Push — subscription disimpan di user_extras (pair-scoped):
 *   key = "push_subscriptions", value = JSON { [userId]: PushSubscription }
 * Tidak perlu tabel/migration baru.
 *
 * Env vars: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */

const SUBS_KEY = "push_subscriptions";

let vapidReady = false;
function ensureVapid() {
  if (vapidReady) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hello@ryora.app",
    pub,
    priv
  );
  vapidReady = true;
  return true;
}

async function readSubscriptions(pairId: string): Promise<Record<string, PushSubscription>> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("user_extras")
    .select("value")
    .eq("pair_id", pairId)
    .eq("key", SUBS_KEY)
    .order("updated_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  const raw = data?.[0]?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, PushSubscription>;
  } catch {
    return {};
  }
}

async function writeSubscriptions(pairId: string, subs: Record<string, PushSubscription>) {
  const supabase = getSupabaseServer();
  const now = new Date().toISOString();
  const value = JSON.stringify(subs);

  const { data: existing } = await supabase
    .from("user_extras")
    .select("id")
    .eq("pair_id", pairId)
    .eq("key", SUBS_KEY)
    .order("updated_at", { ascending: false })
    .limit(1);

  const existingId = existing?.[0]?.id;
  if (existingId) {
    await supabase.from("user_extras").update({ value, updated_at: now }).eq("id", existingId);
  } else {
    await supabase.from("user_extras").insert({
      id: genId(),
      user_id: "system",
      pair_id: pairId,
      key: SUBS_KEY,
      value,
      created_at: now,
      updated_at: now,
    });
  }
}

export async function savePushSubscription(userId: string, pairId: string, sub: PushSubscription) {
  const subs = await readSubscriptions(pairId);
  subs[userId] = sub;
  await writeSubscriptions(pairId, subs);
  return { ok: true };
}

export async function removePushSubscription(userId: string, pairId: string) {
  const subs = await readSubscriptions(pairId);
  delete subs[userId];
  await writeSubscriptions(pairId, subs);
  return { ok: true };
}

export async function isSubscribed(userId: string, pairId: string): Promise<boolean> {
  const subs = await readSubscriptions(pairId);
  return Boolean(subs[userId]?.endpoint);
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/** Kirim push ke satu user. Subscription mati (404/410) otomatis dihapus. */
export async function sendPushToUser(userId: string, pairId: string, payload: PushPayload) {
  if (!ensureVapid()) return { sent: false, reason: "no_vapid" };
  try {
    const subs = await readSubscriptions(pairId);
    const sub = subs[userId];
    if (!sub?.endpoint) return { sent: false, reason: "no_sub" };

    try {
      await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 3600 });
      return { sent: true };
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        delete subs[userId];
        await writeSubscriptions(pairId, subs).catch(() => {});
      }
      return { sent: false, reason: `push_${status || "error"}` };
    }
  } catch {
    return { sent: false, reason: "db_error" };
  }
}

/** Kirim push ke partner dari userId dalam pair yang sama. */
export async function sendPushToPartner(senderUserId: string, pairId: string, partnerId: string, payload: PushPayload) {
  if (senderUserId === partnerId) return { sent: false, reason: "self" };
  return sendPushToUser(partnerId, pairId, payload);
}

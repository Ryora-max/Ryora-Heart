import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/apiAuth";
import { savePushSubscription, removePushSubscription, isSubscribed } from "@/lib/push";
import type { PushSubscription } from "web-push";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const user = await getAuthenticatedUser();
    if (!user || !user.pair_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    switch (action) {
      case "subscribe": {
        const sub = body.subscription as PushSubscription | undefined;
        if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
          return NextResponse.json({ error: "Subscription tidak valid" }, { status: 400 });
        }
        await savePushSubscription(user.id, user.pair_id, sub);
        return NextResponse.json({ ok: true });
      }

      case "unsubscribe": {
        await removePushSubscription(user.id, user.pair_id);
        return NextResponse.json({ ok: true });
      }

      case "status": {
        const subscribed = await isSubscribed(user.id, user.pair_id);
        return NextResponse.json({ subscribed });
      }

      default:
        return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
    }
  } catch (error) {
    console.error("Push API error:", error);
    return NextResponse.json({ error: "Kesalahan server" }, { status: 500 });
  }
}

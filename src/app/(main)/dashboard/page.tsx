"use client";

import { useState, useEffect } from "react";
import { APP_CONFIG } from "@/config";
import { useAuthStore } from "@/stores";
import {
  usePresence,
  usePartnerId,
  useMoods,
  useActivities,
  useRindu,
  useUserSettings,
} from "@/hooks/useDatabase";
import { HouseEntryTransition } from "@/components/home/HouseEntryTransition";
import { VirtualCozyHouse } from "@/components/home/VirtualCozyHouse";
import type { MoodEntry, Activity, Presence } from "@/types";

function getLatestMoodForUser(
  moods: MoodEntry[],
  userId: string | undefined
): MoodEntry | undefined {
  if (!userId) return undefined;
  return moods
    .filter((m) => m.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

function getLiveActivityForUser(
  activities: Activity[],
  userId: string | undefined
): Activity | undefined {
  if (!userId) return undefined;
  return activities.find((a) => a.isLive && a.createdBy === userId);
}

function getPresenceForUser(
  presence: Presence[],
  userId: string | undefined
): Presence | undefined {
  if (!userId) return undefined;
  return presence.find((p) => p.userId === userId);
}

export default function DashboardPage() {
  const { user, token } = useAuthStore();
  const { presence } = usePresence(token || "");
  const { partnerId } = usePartnerId(token || "", user?.id);
  const { moods } = useMoods(token || "");
  const { activities } = useActivities(token || "");
  const { sendRindu } = useRindu(token || "");
  const { settings } = useUserSettings(token || "");

  const [showEntryTransition, setShowEntryTransition] = useState(false);

  // "now" via state — Date.now() / sessionStorage tidak boleh dibaca saat
  // render (purity) maupun sinkron di effect (set-state-in-effect), jadi
  // keduanya di-defer lewat setTimeout.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const t0 = setTimeout(tick, 0);
    const id = setInterval(tick, 60_000);
    return () => {
      clearTimeout(t0);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!sessionStorage.getItem("ryora_house_entered")) {
        setShowEntryTransition(true);
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Tanggal jadian: row user_settings tersinkron (pair-aware) menang atas
  // fallback APP_CONFIG (2024-10-29).
  const startDate = settings?.relationshipStartDate || APP_CONFIG.relationship.startDate;
  const startMs = new Date(startDate).getTime();
  const daysTogether =
    now === null || !Number.isFinite(startMs)
      ? 0
      : Math.max(0, Math.floor((now - startMs) / 86_400_000));

  const handleFinishEntry = () => {
    setShowEntryTransition(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ryora_house_entered", "true");
    }
  };

  const handleReenterDoor = () => {
    setShowEntryTransition(true);
  };

  const ownerName = APP_CONFIG.users.owner.username;
  const partnerName = APP_CONFIG.users.partner.username;

  const isOwner = user?.role === "owner";
  const myName = isOwner ? ownerName : partnerName;
  const partnerDisplayName = isOwner ? partnerName : ownerName;

  const myId = user?.id || (isOwner ? "user-1" : "user-2");
  const partnerDisplayId = partnerId || (isOwner ? "user-2" : "user-1");

  const myPresence = getPresenceForUser(presence, myId);
  const partnerPresence = getPresenceForUser(presence, partnerDisplayId || undefined);

  const myMood = getLatestMoodForUser(moods, myId);
  const partnerMood = getLatestMoodForUser(moods, partnerDisplayId || undefined);

  const myActivity = getLiveActivityForUser(activities, myId);
  const partnerActivity = getLiveActivityForUser(activities, partnerDisplayId || undefined);

  // Sama dengan layout: online = status "online" DAN lastSeen < 90 detik.
  const isPartnerOnline =
    now !== null &&
    partnerPresence?.status === "online" &&
    now - new Date(partnerPresence.lastSeen).getTime() < 90_000;

  const handleSendHeartPing = async () => {
    try {
      if (partnerDisplayId) {
        await sendRindu("rindu_banget", partnerDisplayId, `${myName} mengirimkan pelukan hangat di rumah! 💕`);
      }
    } catch {
      // Graceful fallback
    }
  };

  return (
    <div className="page-bg min-h-dvh pt-4">
      <h1 className="sr-only">Dashboard Rumah {APP_CONFIG.name}</h1>
      {showEntryTransition && (
        <HouseEntryTransition
          onEnter={handleFinishEntry}
          partnerName={partnerDisplayName}
          isPartnerOnline={isPartnerOnline}
        />
      )}

      <VirtualCozyHouse
        daysTogether={daysTogether}
        myName={myName}
        partnerName={partnerDisplayName}
        isOwner={isOwner}
        myPresence={myPresence}
        partnerPresence={partnerPresence}
        myMood={myMood}
        partnerMood={partnerMood}
        myActivity={myActivity}
        partnerActivity={partnerActivity}
        isPartnerOnline={isPartnerOnline}
        onSendHeartPing={handleSendHeartPing}
        onReenterDoor={handleReenterDoor}
      />
    </div>
  );
}

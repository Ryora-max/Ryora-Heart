"use client";

import { ROOM_SPOTS } from "./houseData";

export function PartnerAvatar({
  isOnline,
  roomIndex,
  activity,
  partnerEmoji,
  partnerName,
  statusEmoji,
}: {
  isOnline: boolean;
  roomIndex: number;
  activity: string;
  partnerEmoji: string;
  partnerName: string;
  statusEmoji: string;
}) {
  if (!isOnline) return null;

  const room = ROOM_SPOTS[roomIndex];
  if (!room) return null;

  const positions = [
    { top: "28%", left: "28%" },
    { top: "28%", left: "72%" },
    { top: "72%", left: "28%" },
    { top: "72%", left: "72%" },
  ];
  const pos = positions[roomIndex % positions.length];

  return (
    <div
      className="absolute z-20 transition-all duration-700 ease-in-out animate-partner-walk"
      style={{ top: pos.top, left: pos.left, transform: "translate(-50%, -50%)" }}
    >
      <div className="relative flex flex-col items-center">
        {/* Speech bubble — soft romantic */}
        <div className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-white/90 backdrop-blur-sm shadow-md text-[10px] sm:text-xs font-medium text-rose-600 animate-speech-pop border border-rose-100">
          {partnerName} {activity}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/90 rotate-45 border-r border-b border-rose-100" />
        </div>
        {/* Avatar circle — soft romantic */}
        <div className="relative">
          <div
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center animate-partner-bobble"
            style={{
              background: "radial-gradient(circle at 35% 30%, #FFF0F5, #FFD1DC 60%, #FFB6C1)",
              border: "2px solid rgba(255,255,255,0.8)",
              boxShadow: "0 4px 16px rgba(255,105,180,0.15), inset 0 1px 4px rgba(255,255,255,0.4)",
            }}
          >
            <span className="text-2xl sm:text-3xl">{partnerEmoji}</span>
          </div>
          {/* Status emoji badge — soft */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm border border-rose-100">
            <span className="text-xs sm:text-sm">{statusEmoji}</span>
          </div>
          {/* Heart pulse — soft */}
          <div className="absolute -top-1.5 -left-1.5 text-sm opacity-70 animate-pulse">💕</div>
        </div>
      </div>
    </div>
  );
}

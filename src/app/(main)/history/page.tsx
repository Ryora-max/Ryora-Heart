"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/stores";
import { useMoods, useActivities, usePartnerId } from "@/hooks/useDatabase";
import { APP_CONFIG } from "@/config";
import { cn } from "@/lib/utils";
import type { MoodType } from "@/types";

const MOOD_EMOJI: Record<MoodType, string> = {
  happy: "😊",
  love: "😍",
  miss: "🥺",
  excited: "🤩",
  calm: "😌",
  sad: "😢",
  busy: "🤓",
  sleepy: "😴",
};

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

type TimelineItem = {
  id: string;
  date: Date;
  kind: "mood" | "activity";
  emoji: string;
  title: string;
  detail?: string;
  byName: string;
  live?: boolean;
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function relativeDayLabel(d: Date, now: Date): string {
  const days = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / 86400000);
  if (days <= 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function HistoryPage() {
  const { user, token } = useAuthStore();
  const { moods } = useMoods(token || "");
  const { activities } = useActivities(token || "");
  const { partnerId } = usePartnerId(token || "", user?.id);

  const ownerName = APP_CONFIG.users.owner.username;
  const partnerName = APP_CONFIG.users.partner.username;

  const nameFor = useMemo(
    () => (uid?: string) => {
      if (!uid) return "?";
      if (uid === user?.id) return user?.role === "partner" ? partnerName : ownerName;
      if (uid === partnerId) return user?.role === "partner" ? ownerName : partnerName;
      return uid === "user-1" ? ownerName : uid === "user-2" ? partnerName : "?";
    },
    [user?.id, user?.role, partnerId, ownerName, partnerName]
  );

  // Bulan yang sedang dilihat (state — tidak boleh Date.now() saat render)
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [now] = useState(() => new Date());

  const items = useMemo<TimelineItem[]>(() => {
    const list: TimelineItem[] = [];
    for (const m of moods) {
      list.push({
        id: `mood-${m.id}`,
        date: new Date(m.createdAt),
        kind: "mood",
        emoji: MOOD_EMOJI[m.mood] || "💭",
        title: `Mood: ${m.mood}`,
        detail: m.note,
        byName: nameFor(m.userId),
      });
    }
    for (const a of activities) {
      list.push({
        id: `act-${a.id}`,
        date: new Date(a.startTime || a.date),
        kind: "activity",
        emoji: a.isLive ? "🔴" : a.completed ? "✅" : "📌",
        title: a.title,
        detail: a.description,
        byName: nameFor(a.createdBy),
        live: a.isLive,
      });
    }
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [moods, activities, nameFor]);

  // Map dayKey → items untuk dots di kalender
  const itemsByDay = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    for (const it of items) {
      const key = dayKey(it.date);
      const arr = map.get(key) || [];
      arr.push(it);
      map.set(key, arr);
    }
    return map;
  }, [items]);

  // Grid kalender bulan viewDate (mulai Senin)
  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = (first.getDay() + 6) % 7; // Senin=0
    const cells: { date: Date; inMonth: boolean }[] = [];
    for (let i = 0; i < leading; i++) {
      cells.push({ date: new Date(year, month, i - leading + 1), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
    }
    return cells;
  }, [viewDate]);

  const filteredItems = useMemo(
    () => (selectedDay ? items.filter((it) => dayKey(it.date) === selectedDay) : items),
    [items, selectedDay]
  );

  // Group timeline per hari
  const grouped = useMemo(() => {
    const groups: { label: string; items: TimelineItem[] }[] = [];
    for (const it of filteredItems) {
      const label = relativeDayLabel(it.date, now);
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.items.push(it);
      } else {
        groups.push({ label, items: [it] });
      }
    }
    return groups;
  }, [filteredItems, now]);

  const monthLabel = viewDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const todayKey = dayKey(now);

  const shiftMonth = (delta: number) => {
    setViewDate((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
    setSelectedDay(null);
  };

  return (
    <div className="page-bg min-h-dvh p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-5 text-center animate-fade-in-up">
          <h1 className="text-gradient-primary text-3xl font-bold mb-1">📜 Riwayat Kita</h1>
          <p className="text-sm text-body">Jejak mood &amp; aktivitas berdua</p>
        </div>

        {/* Kalender */}
        <div className="surface-card p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Bulan sebelumnya"
              className="touch-target p-2 rounded-xl hover:bg-surface-warm transition-colors cursor-pointer text-text-secondary"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-heading font-bold text-sm capitalize">{monthLabel}</h2>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Bulan berikutnya"
              className="touch-target p-2 rounded-xl hover:bg-surface-warm transition-colors cursor-pointer text-text-secondary"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-text-muted py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => {
              const key = dayKey(cell.date);
              const dayItems = itemsByDay.get(key);
              const isToday = key === todayKey;
              const isSelected = key === selectedDay;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!cell.inMonth}
                  onClick={() => setSelectedDay(isSelected ? null : key)}
                  aria-label={`${cell.date.toLocaleDateString("id-ID")}${dayItems ? `, ${dayItems.length} entri` : ""}`}
                  aria-pressed={isSelected}
                  className={cn(
                    "relative aspect-square rounded-xl text-xs font-medium flex flex-col items-center justify-center gap-0.5 transition-all",
                    !cell.inMonth && "opacity-25",
                    cell.inMonth && "hover:bg-surface-warm cursor-pointer",
                    isToday && "ring-2 ring-primary font-bold",
                    isSelected ? "bg-primary-soft text-primary" : "text-text-primary"
                  )}
                >
                  {cell.date.getDate()}
                  {dayItems && (
                    <span className="flex gap-0.5 h-1.5">
                      {dayItems.slice(0, 3).map((it, i) => (
                        <span
                          key={i}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            it.kind === "mood" ? "bg-rose-400" : "bg-secondary"
                          )}
                          aria-hidden="true"
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-[10px] text-text-muted">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Mood
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Aktivitas
            </span>
            {selectedDay && (
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="ml-auto text-primary font-semibold hover:underline cursor-pointer"
              >
                Tampilkan semua
              </button>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {grouped.length === 0 && (
            <div className="surface-card p-8 text-center">
              <div className="text-4xl mb-2">🌱</div>
              <p className="text-body text-sm">
                {selectedDay ? "Tidak ada entri di hari ini" : "Belum ada riwayat — mulai catat mood & aktivitas kalian!"}
              </p>
            </div>
          )}
          {grouped.map((group) => (
            <section key={group.label}>
              <h2 className="text-heading text-xs font-bold uppercase tracking-wider mb-2 px-1">
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.items.map((it) => (
                  <div
                    key={it.id}
                    className="surface-card p-3.5 flex items-start gap-3 animate-fade-in-soft"
                  >
                    <div className="text-xl flex-shrink-0 mt-0.5">{it.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-heading leading-snug">
                        {it.title}
                        {it.live && (
                          <span className="ml-1.5 text-[10px] font-bold text-rose-500">LIVE</span>
                        )}
                      </p>
                      {it.detail && (
                        <p className="text-xs text-body mt-0.5 break-words">{it.detail}</p>
                      )}
                      <p className="text-[11px] text-text-muted mt-1">
                        {it.byName} ·{" "}
                        {it.date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

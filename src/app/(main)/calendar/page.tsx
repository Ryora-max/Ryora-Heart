"use client";

import { useState, type ComponentType } from "react";
import { Video, Cake, Heart, Bell, ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { useCalendarEvents } from "@/hooks/useDatabase";
import { useAuthStore } from "@/stores";
import type { CalendarEvent } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/LoadingSkeleton";

const EVENT_TYPES: Record<string, { label: string; color: string; icon: ComponentType<{ size?: number }> }> = {
  vc: { label: "Video Call", color: "bg-blue-100 text-blue-600 border-blue-200", icon: Video },
  birthday: { label: "Birthday", color: "bg-pink-100 text-pink-600 border-pink-200", icon: Cake },
  anniversary: { label: "Anniversary", color: "bg-red-100 text-red-600 border-red-200", icon: Heart },
  reminder: { label: "Reminder", color: "bg-purple-100 text-purple-600 border-purple-200", icon: Bell },
};

type EventType = "vc" | "birthday" | "anniversary" | "reminder";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newType, setNewType] = useState<EventType>("vc");
  const [newDesc, setNewDesc] = useState("");
  const [addError, setAddError] = useState("");

  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState<EventType>("vc");
  const [editDesc, setEditDesc] = useState("");
  const [editError, setEditError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { token } = useAuthStore();
  const { events, loading, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent } = useCalendarEvents(token || "");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const getEventsForDate = (day: number) => {
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const days = [];
  for (let i = firstDay - 1; i >= 0; i--) days.push({ day: daysInPrevMonth - i, currentMonth: false });
  for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, currentMonth: true });
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) days.push({ day: i, currentMonth: false });
  }

  const openEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditDate(new Date(event.date).toISOString().split("T")[0]);
    setEditType(event.type);
    setEditDesc(event.description || "");
    setEditError("");
  };

  const handleUpdate = async () => {
    setEditError("");
    if (!editTitle.trim() || !editDate || !editingEvent) {
      setEditError("Title and date are required");
      return;
    }
    await updateCalendarEvent(editingEvent.id, {
      title: editTitle.trim(),
      date: new Date(editDate),
      type: editType,
      description: editDesc || undefined,
    });
    setEditingEvent(null);
  };

  const handleDelete = async (eventId: string) => {
    await deleteCalendarEvent(eventId);
    setDeleteConfirm(null);
  };

  return (
    <div className="page-bg p-3 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-gradient-primary text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
            📅 Calendar
          </h1>
          <p className="text-body">Your special dates together</p>
        </div>

        <LdrBanner tagline="Kalender LDR: merahnya hari ketemu, abu-abunya hari nunggu. 📅💞" />

        {showAddEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowAddEvent(false)}>
            <div className="surface-card p-6 max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-heading text-lg font-bold">Add Event 📅</h3>
                <button onClick={() => setShowAddEvent(false)} className="text-muted hover:text-primary p-2 touch-target flex items-center justify-center"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                 <input
                   type="text"
                   value={newTitle}
                   onChange={(e) => setNewTitle(e.target.value)}
                   placeholder="Event title..."
                   className="input-soft w-full px-4 py-2 text-sm"
                 />
                 {addError && <p className="text-red-500 text-xs mt-1">{addError}</p>}
                 <input
                   type="date"
                   value={newDate}
                   onChange={(e) => setNewDate(e.target.value)}
                   className="input-soft w-full px-4 py-2 text-sm"
                 />
                 {addError && <p className="text-red-500 text-xs mt-1">{addError}</p>}
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as EventType)}
                    className="input-soft w-full px-4 py-2 text-sm"
                  >
                  <option value="vc">Video Call</option>
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="reminder">Reminder</option>
                </select>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description (optional)..."
                  rows={3}
                  className="input-soft w-full px-4 py-2 text-sm resize-none"
                />
                <button
                  onClick={async () => {
                    setAddError("");
                    if (!newTitle.trim() || !newDate) {
                      setAddError("Title and date are required");
                      return;
                    }
                    await addCalendarEvent(newTitle.trim(), new Date(newDate), newType, newDesc || undefined);
                    setNewTitle("");
                    setNewDate("");
                    setNewType("vc");
                    setNewDesc("");
                    setShowAddEvent(false);
                  }}
                  disabled={!newTitle.trim() || !newDate}
                  className="touch-target touch-press w-full py-2.5 rounded-xl text-white font-bold disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(to right, var(--primary), var(--secondary))" }}
                >
                  Save Event
                </button>
              </div>
            </div>
          </div>
        )}

        {editingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setEditingEvent(null)}>
            <div className="surface-card p-6 max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-heading text-lg font-bold">Edit Event 📅</h3>
                <button onClick={() => setEditingEvent(null)} className="text-muted hover:text-primary p-2 touch-target flex items-center justify-center"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                 <input
                   type="text"
                   value={editTitle}
                   onChange={(e) => { setEditTitle(e.target.value); setEditError(""); }}
                   placeholder="Event title..."
                   className="input-soft w-full px-4 py-2 text-sm"
                 />
                 <input
                   type="date"
                   value={editDate}
                   onChange={(e) => { setEditDate(e.target.value); setEditError(""); }}
                   className="input-soft w-full px-4 py-2 text-sm"
                 />
                 {editError && <p className="text-red-500 text-xs">{editError}</p>}
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as EventType)}
                  className="input-soft w-full px-4 py-2 text-sm"
                >
                  <option value="vc">Video Call</option>
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="reminder">Reminder</option>
                </select>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Description (optional)..."
                  rows={3}
                  className="input-soft w-full px-4 py-2 text-sm resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    disabled={!editTitle.trim() || !editDate}
                    className="touch-target touch-press flex-1 py-2.5 rounded-xl text-white font-bold disabled:opacity-50 transition-all"
                    style={{ background: "linear-gradient(to right, var(--primary), var(--secondary))" }}
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setEditingEvent(null)}
                    className="touch-target touch-press px-4 py-2.5 rounded-xl border-border text-text-secondary font-bold hover:bg-surface-warm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDeleteConfirm(null)}>
            <div className="surface-card p-6 max-w-sm w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-heading text-lg font-bold mb-2">Delete Event? 🗑️</h3>
              <p className="text-body text-sm mb-4">This action cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="touch-target touch-press flex-1 py-2.5 rounded-xl text-white font-bold transition-all"
                  style={{ background: "linear-gradient(to right, #ef4444, #f43f5e)" }}
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="touch-target touch-press px-4 py-2.5 rounded-xl border-border text-text-secondary font-bold hover:bg-surface-warm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="surface-card lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading text-2xl font-bold">{monthName}</h2>
              <div className="flex gap-2">
                <MagneticButton>
                  <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="touch-target w-10 h-10 rounded-xl bg-surface-warm hover:bg-primary-soft flex items-center justify-center transition-all">
                    <ChevronLeft size={20} className="text-primary" />
                  </button>
                </MagneticButton>
                <MagneticButton>
                  <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="touch-target w-10 h-10 rounded-xl bg-surface-warm hover:bg-primary-soft flex items-center justify-center transition-all">
                    <ChevronRight size={20} className="text-primary" />
                  </button>
                </MagneticButton>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-muted text-center text-sm font-medium py-2">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map(({ day, currentMonth }, i) => {
                const dayEvents = currentMonth ? getEventsForDate(day) : [];
                const isToday = currentMonth && day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                return (
                   <div key={i} className={cn("calendar-day animate-scale-in aspect-square flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer active:scale-95", currentMonth ? "text-text-primary" : "text-text-muted", isToday && "bg-primary-soft ring-2 ring-primary")} style={{ animationDelay: `${i * 0.02}s` }}>
                     <span className="text-sm sm:text-base font-medium">{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div key={event.id} className={cn("w-1.5 h-1.5 rounded-full", EVENT_TYPES[event.type].color.split(" ")[0])} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-heading text-xl font-bold">Upcoming Events</h3>
               <MagneticButton>
                  <button onClick={() => setShowAddEvent(true)} className="touch-target w-9 h-9 rounded-lg bg-primary-soft hover:bg-primary-soft flex items-center justify-center transition-all">
                   <Plus size={18} className="text-primary" />
                 </button>
               </MagneticButton>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <ListItemSkeleton key={i} />)}
              </div>
             ) : events.length === 0 ? (
               <EmptyState emoji="💤" title="No events yet" description="Add your first special date!" />
             ) : (
                <div className="space-y-3">
                   {events.map((event, idx) => {
                     const EventIcon = EVENT_TYPES[event.type].icon;
                     return (
                       <div key={event.id} className="event-card animate-fade-in-left surface-card p-3 sm:p-4 rounded-xl" style={{ animationDelay: `${0.3 + idx * 0.1}s` }}>
                        <div className="flex items-start gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", EVENT_TYPES[event.type].color)}>
                            <EventIcon size={18} />
                          </div>
                         <div className="flex-1 min-w-0">
                           <h4 className="text-heading font-medium truncate">{event.title}</h4>
                           <p className="text-body text-sm">
                             {new Date(event.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                           </p>
                           {event.description && <p className="text-muted text-xs mt-1 line-clamp-2">{event.description}</p>}
                         </div>
                         <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => openEdit(event)} className="touch-target w-8 h-8 rounded-lg bg-surface-warm hover:bg-primary-soft flex items-center justify-center transition-all text-primary">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setDeleteConfirm(event.id)} className="touch-target w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all text-red-600">
                              <Trash2 size={14} />
                            </button>
                         </div>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Video, Cake, Heart, Bell, ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { useCalendarEvents } from "@/hooks/useDatabase";
import { useAuthStore } from "@/stores";
import type { CalendarEvent } from "@/types";

const EVENT_TYPES = {
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

  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState<EventType>("vc");
  const [editDesc, setEditDesc] = useState("");
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
  while (days.length % 7 !== 0) days.push({ day: days.length - daysInMonth - firstDay + 1, currentMonth: false });

  const openEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditDate(new Date(event.date).toISOString().split("T")[0]);
    setEditType(event.type);
    setEditDesc(event.description || "");
  };

  const handleUpdate = async () => {
    if (!editTitle.trim() || !editDate || !editingEvent) return;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 p-3 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent mb-2">
            📅 Calendar
          </h1>
          <p className="text-blue-600/70">Your special dates together</p>
        </div>

        <LdrBanner tagline="Kalender LDR: merahnya hari ketemu, abu-abunya hari nunggu. 📅💞" />

        {showAddEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowAddEvent(false)}>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-200 shadow-xl max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-900">Add Event 📅</h3>
                <button onClick={() => setShowAddEvent(false)} className="text-blue-400 hover:text-blue-600"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Event title..."
                  className="w-full px-4 py-2 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none text-blue-900 text-sm"
                />
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none text-blue-900 text-sm"
                />
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as EventType)}
                    className="w-full px-4 py-2 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none text-blue-900 text-sm"
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
                  className="w-full px-4 py-2 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none text-blue-900 text-sm resize-none"
                />
                <button
                  onClick={async () => {
                    if (!newTitle.trim() || !newDate) return;
                    await addCalendarEvent(newTitle.trim(), new Date(newDate), newType, newDesc || undefined);
                    setNewTitle("");
                    setNewDate("");
                    setNewType("vc");
                    setNewDesc("");
                    setShowAddEvent(false);
                  }}
                  disabled={!newTitle.trim() || !newDate}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 transition-all"
                >
                  Save Event
                </button>
              </div>
            </div>
          </div>
        )}

        {editingEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setEditingEvent(null)}>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-200 shadow-xl max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-900">Edit Event 📅</h3>
                <button onClick={() => setEditingEvent(null)} className="text-blue-400 hover:text-blue-600"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Event title..."
                  className="w-full px-4 py-2 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none text-blue-900 text-sm"
                />
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none text-blue-900 text-sm"
                />
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as EventType)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none text-blue-900 text-sm"
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
                  className="w-full px-4 py-2 rounded-xl border-2 border-blue-200 focus:border-blue-400 focus:outline-none text-blue-900 text-sm resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    disabled={!editTitle.trim() || !editDate}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 transition-all"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setEditingEvent(null)}
                    className="px-4 py-2.5 rounded-xl border-2 border-blue-200 text-blue-600 font-bold hover:bg-blue-50 transition-all"
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
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-red-200 shadow-xl max-w-sm w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-red-900 mb-2">Delete Event? 🗑️</h3>
              <p className="text-red-600/70 text-sm mb-4">This action cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold hover:from-red-600 hover:to-rose-600 transition-all"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-200 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue-900">{monthName}</h2>
              <div className="flex gap-2">
                <MagneticButton>
                  <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-all">
                    <ChevronLeft size={20} className="text-blue-600" />
                  </button>
                </MagneticButton>
                <MagneticButton>
                  <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-all">
                    <ChevronRight size={20} className="text-blue-600" />
                  </button>
                </MagneticButton>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-blue-400 text-sm font-medium py-2">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map(({ day, currentMonth }, i) => {
                const dayEvents = currentMonth ? getEventsForDate(day) : [];
                const isToday = currentMonth && day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                return (
                  <div key={i} className={cn("calendar-day animate-scale-in aspect-square flex flex-col items-center justify-center rounded-xl transition-all", currentMonth ? "text-blue-900" : "text-blue-300", isToday && "bg-blue-200 ring-2 ring-blue-400")} style={{ animationDelay: `${i * 0.02}s` }}>
                    <span className="text-sm font-medium">{day}</span>
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
              <h3 className="text-xl font-bold text-blue-900">Upcoming Events</h3>
               <MagneticButton>
                  <button onClick={() => setShowAddEvent(true)} className="w-9 h-9 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-all min-h-[44px] min-w-[44px]">
                   <Plus size={18} className="text-blue-600" />
                 </button>
               </MagneticButton>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
             ) : events.length === 0 ? (
               <p className="text-blue-600/70 text-center py-8">No events yet 💤</p>
             ) : (
               <div className="space-y-3">
                  {events.map((event, idx) => {
                     const EventIcon = EVENT_TYPES[event.type].icon;
                     return (
                       <div key={event.id} className="event-card animate-fade-in-left bg-white/80 backdrop-blur-sm p-3 sm:p-4 rounded-xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all" style={{ animationDelay: `${0.3 + idx * 0.1}s` }}>
                        <div className="flex items-start gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", EVENT_TYPES[event.type].color)}>
                            <EventIcon size={18} />
                          </div>
                         <div className="flex-1 min-w-0">
                           <h4 className="font-medium text-blue-900 truncate">{event.title}</h4>
                           <p className="text-blue-600/70 text-sm">
                             {new Date(event.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                           </p>
                           {event.description && <p className="text-blue-500 text-xs mt-1 line-clamp-2">{event.description}</p>}
                         </div>
                         <div className="flex items-center gap-1 flex-shrink-0">
                           <button onClick={() => openEdit(event)} className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-all text-blue-600">
                             <Pencil size={14} />
                           </button>
                           <button onClick={() => setDeleteConfirm(event.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all text-red-600">
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

"use client";

import { Flower2 } from "lucide-react";
import { useActivities } from "@/hooks/useDatabase";
import { useAuthStore } from "@/stores";

export default function GardenPage() {
  const { token } = useAuthStore();
  const { activities, loading } = useActivities(token || "");

  const milestones = activities
    .filter((a) => a.type === "milestone")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="garden-header animate-fade-in-up text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent mb-2">
            🌳 Garden
          </h1>
          <p className="text-green-600/70">Your relationship timeline, growing like a plant 🌱</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : milestones.length === 0 ? (
          <div className="text-center py-20">
            <Flower2 size={48} className="text-green-300 mx-auto mb-4" />
            <p className="text-green-600/70">No milestones yet. Add your first memory!</p>
          </div>
        ) : (
          <div className="timeline-container relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-green-300 via-emerald-300 to-teal-300 -translate-x-1/2" />

            <div className="space-y-8">
              {milestones.map((milestone, i) => (
                <div key={milestone.id} className="timeline-item animate-fade-in-up relative flex items-start gap-6 md:gap-12" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="hidden md:block md:w-1/2 text-right pr-8">
                    {i % 2 === 0 && (
                      <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-green-200 shadow-lg inline-block text-left hover:shadow-xl transition-all">
                        <h3 className="font-bold text-green-900 text-lg">{milestone.title}</h3>
                        <p className="text-green-600/70 text-sm">
                          {new Date(milestone.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        {milestone.description && <p className="text-green-700/80 mt-2">{milestone.description}</p>}
                      </div>
                    )}
                  </div>

                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 border-4 border-white shadow-lg z-10" />

                  <div className="md:w-1/2 pl-16 md:pl-8">
                    <div className="md:hidden bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-green-200 shadow-lg">
                      <h3 className="font-bold text-green-900 text-lg">{milestone.title}</h3>
                      <p className="text-green-600/70 text-sm">
                        {new Date(milestone.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      {milestone.description && <p className="text-green-700/80 mt-2">{milestone.description}</p>}
                    </div>
                    {i % 2 === 1 && (
                      <div className="hidden md:block bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-green-200 shadow-lg hover:shadow-xl transition-all">
                        <h3 className="font-bold text-green-900 text-lg">{milestone.title}</h3>
                        <p className="text-green-600/70 text-sm">
                          {new Date(milestone.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        {milestone.description && <p className="text-green-700/80 mt-2">{milestone.description}</p>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

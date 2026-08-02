"use client";

import { STATUS_PRESETS } from "./houseData";

export function StatusPicker({
  currentStatus,
  onPick,
  onClose,
}: {
  currentStatus: string;
  onPick: (status: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl p-5 w-full max-w-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-text-primary">Status Kamu</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => { onPick(preset.id); onClose(); }}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all active:scale-95 cursor-pointer ${preset.bg} ${currentStatus === preset.id ? "ring-2 ring-pink-300" : ""}`}
            >
              <span className="text-xl">{preset.emoji}</span>
              <span className={`text-xs font-semibold ${preset.color}`}>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

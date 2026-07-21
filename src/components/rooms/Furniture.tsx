"use client";

import { useState, type ReactNode } from "react";

interface FurnitureProps {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

export function Furniture({ children, label, onClick, className = "" }: FurnitureProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  return (
    <div
      className={`furniture-item absolute cursor-pointer group perspective-1000 ${className}`}
      onClick={onClick}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        setTilt({ x: -py * 18, y: px * 18 });
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
        transformStyle: "preserve-3d",
        transition: "transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
      }}
    >
      <div
        className="relative preserve-3d transition-transform duration-300"
        style={{ transform: "translateZ(24px)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-white/20 transition-all"
          style={{
            boxShadow: "0 12px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
        >
          {children}
        </div>

        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs text-white/60 bg-black/50 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

interface CushionProps {
  color?: string;
}

export function Cushion({ color = "from-pink-300 to-pink-400" }: CushionProps) {
  return (
    <div className={`w-8 h-8 bg-gradient-to-br ${color} rounded-lg shadow-md`} />
  );
}

interface LampProps {
  on?: boolean;
  onToggle?: () => void;
}

export function Lamp({ on = false, onToggle }: LampProps) {
  return (
    <div className="relative cursor-pointer perspective-1000" onClick={onToggle}>
      <div
        className="w-6 h-10 bg-gradient-to-t from-amber-100 to-amber-200 rounded-full border border-amber-300 flex items-start justify-center pt-1 transition-transform duration-300 hover:translate-z-[10px]"
        style={{ transformStyle: "preserve-3d" }}
      >
        {on && (
          <div className="w-3 h-4 bg-gradient-to-t from-orange-400 to-yellow-300 rounded-full blur-[1px]" />
        )}
      </div>
      {on && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-yellow-200/60 rounded-full blur-md" />
      )}
    </div>
  );
}

interface BedProps {
  onCozy?: () => void;
}

export function Bed({ onCozy }: BedProps) {
  return (
    <div className="relative cursor-pointer perspective-1000" onClick={onCozy} style={{ transformStyle: "preserve-3d" }}>
      <div className="w-40 h-24 bg-gradient-to-r from-amber-100 to-amber-200 rounded-2xl border-2 border-amber-300 shadow-lg transition-transform duration-300 hover:translate-z-[14px]">
        <div className="absolute top-2 left-2 right-2 h-16 bg-gradient-to-r from-pink-200 to-pink-300 rounded-xl flex items-center justify-center gap-2">
          <span className="text-xl">🧸</span>
          <span className="text-xl">💝</span>
          <span className="text-xl">🧸</span>
        </div>
      </div>
    </div>
  );
}

interface SofaProps {
  className?: string;
}

export function SofaFurniture({ className = "" }: SofaProps) {
  return (
    <div className={`relative perspective-1000 ${className}`} style={{ transformStyle: "preserve-3d" }}>
      <div className="w-40 h-28 bg-gradient-to-r from-amber-100 to-amber-200 rounded-2xl border-2 border-amber-300 shadow-lg transition-transform duration-300 hover:translate-z-[14px]">
        <div className="absolute top-2 left-2 right-2 h-16 bg-gradient-to-r from-orange-200 to-orange-300 rounded-xl flex items-center justify-center gap-2">
          <div className="w-7 h-7 bg-orange-300 rounded-lg" />
          <div className="w-7 h-7 bg-orange-300 rounded-lg" />
          <div className="w-7 h-7 bg-orange-300 rounded-lg" />
        </div>
      </div>
      <div className="absolute -left-4 top-4 w-6 h-20 bg-amber-200 rounded-l-lg border-2 border-amber-300 border-r-0" />
      <div className="absolute -right-4 top-4 w-6 h-20 bg-amber-200 rounded-r-lg border-2 border-amber-300 border-l-0" />
    </div>
  );
}

interface TvProps {
  on?: boolean;
  onToggle?: () => void;
}

export function TvFurniture({ on = false, onToggle }: TvProps) {
  return (
    <div className="relative cursor-pointer perspective-1000" onClick={onToggle} style={{ transformStyle: "preserve-3d" }}>
      <div className={`w-36 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-4 border-gray-700 shadow-2xl transition-all duration-300 hover:translate-z-[12px] ${on ? "brightness-110" : "brightness-75"}`}>
        {on && (
          <div className="absolute inset-2 bg-gradient-to-br from-white/90 to-gray-200 rounded overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        )}
      </div>
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-2 bg-gray-700 rounded-b-lg" />
    </div>
  );
}

interface FireplaceProps {
  on?: boolean;
  onToggle?: () => void;
}

export function Fireplace({ on = false, onToggle }: FireplaceProps) {
  return (
    <div className="relative cursor-pointer perspective-1000" onClick={onToggle} style={{ transformStyle: "preserve-3d" }}>
      <div className="w-28 h-32 bg-gradient-to-b from-stone-400 to-stone-600 rounded-t-2xl border-2 border-stone-500 shadow-lg flex flex-col items-center justify-end pb-2">
        <div className="w-20 h-16 bg-gradient-to-t from-orange-900 to-orange-700 rounded-t-xl relative overflow-hidden">
          {on && (
            <>
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="absolute bottom-0 w-3 h-8 bg-gradient-to-t from-orange-400 via-orange-300 to-yellow-200 rounded-full blur-[1px]"
                  style={{ left: `${10 + i * 14}%`, opacity: 0.7 }}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-orange-500/30 to-transparent" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface WindowProps {
  open?: boolean;
  onToggle?: () => void;
}

export function WindowFurniture({ open = false, onToggle }: WindowProps) {
  return (
    <div className="relative cursor-pointer perspective-1000" onClick={onToggle} style={{ transformStyle: "preserve-3d" }}>
      <div className={`w-24 h-28 bg-gradient-to-b from-sky-300 to-sky-400 rounded-lg border-4 border-amber-100 shadow-lg transition-all duration-500 hover:translate-z-[12px] ${open ? "scale-110" : ""}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-3xl">🌙</div>
        </div>
      </div>
      <div className={`absolute -left-4 top-0 w-6 h-full bg-gradient-to-r from-pink-300 to-pink-400 rounded-l-lg transition-all duration-500 ${open ? "-translate-x-2" : ""}`} />
      <div className={`absolute -right-4 top-0 w-6 h-full bg-gradient-to-l from-pink-300 to-pink-400 rounded-r-lg transition-all duration-500 ${open ? "translate-x-2" : ""}`} />
    </div>
  );
}

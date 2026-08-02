"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePresence } from "@/hooks/useDatabase";

interface PresenceEntry {
  userId: string;
  status: string;
  lastSeen: string;
}

interface PresenceContextValue {
  presence: PresenceEntry[];
  updatePresence: (status: string) => void;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

export function PresenceProvider({ token, children }: { token: string; children: ReactNode }) {
  const { presence, updatePresence } = usePresence(token);

  return (
    <PresenceContext.Provider value={{ presence, updatePresence }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresenceContext(): PresenceContextValue | null {
  return useContext(PresenceContext);
}

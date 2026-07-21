/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: "ryora-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

interface MoodState {
  moods: any[];
  addMood: (mood: any) => void;
}

export const useMoodStore = create<MoodState>()(
  persist(
    (set) => ({
      moods: [],
      addMood: (mood) =>
        set((state) => ({
          moods: [mood, ...state.moods].slice(0, 100),
        })),
    }),
    {
      name: "ryora-moods",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tab = "tap" | "rush" | "pit" | "shop" | "you";

interface GameState {
  tab: Tab;
  coins: number;
  gems: number;
  xp: number;
  prestige: number;
  sound: boolean;
  tapPower: number;
  setTab: (t: Tab) => void;
  toggleSound: () => void;
  tap: () => void;
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      tab: "tap",
      coins: 0,
      gems: 0,
      xp: 0,
      prestige: 0,
      sound: true,
      tapPower: 1,
      setTab: (tab) => set({ tab }),
      toggleSound: () => set({ sound: !get().sound }),
      tap: () => {
        const power = get().tapPower;
        set((s) => ({
          coins: s.coins + power,
          xp: s.xp + power,
        }));
      },
    }),
    {
      name: "tap-rush-v4",
    }
  )
);

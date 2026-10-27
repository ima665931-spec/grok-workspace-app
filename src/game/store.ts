import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tab = "tap" | "rush" | "pit" | "shop" | "you";

interface GameState {
  tab: Tab;
  booted: boolean;
  coins: number;
  gems: number;
  xp: number;
  prestige: number;
  sound: boolean;
  tapPower: number;
  setTab: (t: Tab) => void;
  finishLoad: () => void;
  toggleSound: () => void;
  tap: () => void;
  tick: (dt: number) => void;
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      tab: "tap",
      booted: false,
      coins: 0,
      gems: 0,
      xp: 0,
      prestige: 0,
      sound: true,
      tapPower: 1,
      setTab: (tab) => set({ tab }),
      finishLoad: () => set({ booted: true }),
      toggleSound: () => set({ sound: !get().sound }),
      tap: () => {
        const power = get().tapPower;
        set((s) => ({
          coins: s.coins + power,
          xp: s.xp + power,
        }));
      },
      tick: () => {},
    }),
    {
      name: "tap-rush-v3",
      partialize: (s) => ({
        coins: s.coins,
        gems: s.gems,
        xp: s.xp,
        prestige: s.prestige,
        sound: s.sound,
        tapPower: s.tapPower,
        tab: s.tab,
      }),
    }
  )
);

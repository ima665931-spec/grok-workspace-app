import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tab = "tap" | "rush" | "pit" | "shop" | "you";

interface GameState {
  tab: Tab;
  booted: boolean;
  coins: number;
  setTab: (t: Tab) => void;
  tick: (dt: number) => void;
  finishLoad: () => void;
  addCoins: (n: number) => void;
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      tab: "tap",
      booted: false,
      coins: 0,
      setTab: (tab) => set({ tab }),
      tick: () => {},
      finishLoad: () => set({ booted: true }),
      addCoins: (n) => set({ coins: get().coins + n }),
    }),
    { name: "tap-rush-v1" }
  )
);

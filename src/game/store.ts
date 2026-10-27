import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tab = "tap" | "rush" | "pit" | "shop" | "you";

interface GameState {
  tab: Tab;
  coins: number;
  setTab: (t: Tab) => void;
  addCoins: (n: number) => void;
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      tab: "tap",
      coins: 0,
      setTab: (tab) => set({ tab }),
      addCoins: (n) => set({ coins: get().coins + n }),
    }),
    { name: "tap-rush-v2" }
  )
);

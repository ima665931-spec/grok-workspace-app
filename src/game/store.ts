import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tab = "lobby" | "crash" | "dice" | "mines" | "coinflip" | "wallet" | "history" | "profile";

export interface BetRecord {
  id: string;
  game: string;
  amount: number;
  multiplier?: number;
  payout: number;
  won: boolean;
  time: number;
}

interface GameState {
  tab: Tab;
  balance: number;
  history: BetRecord[];
  setTab: (t: Tab) => void;
  placeBet: (game: string, amount: number, multiplier: number, won: boolean) => void;
  addBalance: (amount: number) => void;
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      tab: "lobby",
      balance: 10000, // starting balance
      history: [],
      setTab: (tab) => set({ tab }),
      placeBet: (game, amount, multiplier, won) => {
        const payout = won ? Math.floor(amount * multiplier) : 0;
        const record: BetRecord = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          game,
          amount,
          multiplier: won ? multiplier : 0,
          payout,
          won,
          time: Date.now(),
        };
        set((s) => ({
          balance: s.balance - amount + payout,
          history: [record, ...s.history].slice(0, 50),
        }));
      },
      addBalance: (amount) => set((s) => ({ balance: s.balance + amount })),
    }),
    { name: "betting-app-v1" }
  )
);

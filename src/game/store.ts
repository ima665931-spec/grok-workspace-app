import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tab =
  | "lobby"
  | "wingo"
  | "rocket"
  | "crash"
  | "dice"
  | "mines"
  | "coinflip"
  | "ludo"
  | "snake"
  | "wallet"
  | "history"
  | "profile";

export interface BetRecord {
  id: string;
  game: string;
  amount: number;
  multiplier?: number;
  payout: number;
  won: boolean;
  detail?: string;
  time: number;
}

interface GameState {
  tab: Tab;
  balance: number;
  history: BetRecord[];
  setTab: (t: Tab) => void;
  /** Deduct stake first; if not enough balance returns false */
  tryPlaceStake: (amount: number) => boolean;
  /** Credit winnings (stake already deducted) */
  creditWin: (payout: number) => void;
  /** Full bet record helper */
  recordBet: (game: string, amount: number, multiplier: number, won: boolean, detail?: string) => void;
  addBalance: (amount: number) => void;
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      tab: "lobby",
      balance: 10000,
      history: [],
      setTab: (tab) => set({ tab }),
      tryPlaceStake: (amount) => {
        const { balance } = get();
        if (amount <= 0 || amount > balance) return false;
        set({ balance: balance - amount });
        return true;
      },
      creditWin: (payout) => {
        if (payout > 0) set((s) => ({ balance: s.balance + payout }));
      },
      recordBet: (game, amount, multiplier, won, detail) => {
        const payout = won ? Math.floor(amount * multiplier) : 0;
        const record: BetRecord = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
          game,
          amount,
          multiplier: won ? multiplier : 0,
          payout,
          won,
          detail,
          time: Date.now(),
        };
        set((s) => ({
          history: [record, ...s.history].slice(0, 80),
        }));
      },
      addBalance: (amount) => set((s) => ({ balance: s.balance + amount })),
    }),
    { name: "betrush-v2" }
  )
);

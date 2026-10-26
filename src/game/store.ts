import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Tab = 'tap' | 'rush' | 'pit' | 'shop' | 'you';

interface GameState {
  tab: Tab;
  booted: boolean;
  tick: (dt: number) => void;
  finishLoad: () => void;
  setTab: (t: Tab) => void;
}

export const useGame = create<GameState>()(
  persist(
    (set) => ({
      tab: 'tap',
      booted: false,
      tick: () => {},
      finishLoad: () => set({ booted: true }),
      setTab: (tab) => set({ tab }),
    }),
    { name: 'game-storage' }
  )
);

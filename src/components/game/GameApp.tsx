import { useEffect } from "react";
import { Coins, Dices, Gem, Store, Timer, UserRound, Volume2, VolumeX, Zap } from "lucide-react";
import {
  formatCoins,
  formatLeft,
  levelOf,
  levelStart,
  prestigeMult,
} from "@/game/logic";
import { useGame, type Tab } from "@/game/store";
import { PitPanel } from "./PitPanel";
import { RushPanel } from "./RushPanel";
import { ShopPanel } from "./ShopPanel";
import { TapStage } from "./TapStage";
import { YouPanel } from "./YouPanel";

const NAV: { id: Tab; label: string; icon: typeof Zap }[] = [
  { id: "tap", label: "Core", icon: Zap },
  { id: "rush", label: "Rush", icon: Timer },
  { id: "pit", label: "Pit", icon: Dices },
  { id: "shop", label: "Shop", icon: Store },
  { id: "you", label: "You", icon: UserRound },
];

export function GameApp() {
  const tab = useGame((s) => s.tab);
  const booted = useGame((s) => s.booted);
  const setTab = useGame((s) => s.setTab);
  const sound = useGame((s) => s.sound);
  const toggleSound = useGame((s) => s.toggleSound);
  const coins = useGame((s) => s.coins);
  const gems = useGame((s) => s.gems);
  const xp = useGame((s) => s.xp);
  const prestige = useGame((s) => s.prestige);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(4 * 3600, (t - last) / 1000);
      last = t;
      useGame.getState().tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const unsub = useGame.persist.onFinishHydration(() => {
      if (!useGame.getState().booted) useGame.getState().finishLoad();
    });
    if (useGame.persist.hasHydrated() && !useGame.getState().booted) {
      useGame.getState().finishLoad();
    }
    // Force boot fallback
    const t = setTimeout(() => {
      if (!useGame.getState().booted) useGame.getState().finishLoad();
    }, 500);
    return () => {
      cancelAnimationFrame(raf);
      unsub();
      clearTimeout(t);
    };
  }, []);

  if (!booted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-4xl animate-pulse">⚡</div>
          <p className="text-muted-foreground">Loading Tap Rush...</p>
        </div>
      </div>
    );
  }

  const level = levelOf(xp);
  const nextLevelXp = levelStart(level + 1);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-lg mx-auto">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg font-bold tracking-tight shrink-0">Tap Rush</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
            <span className="flex items-center gap-1"><Coins className="size-3.5 text-yellow-500" />{formatCoins(coins)}</span>
            <span className="flex items-center gap-1"><Gem className="size-3.5 text-cyan-400" />{gems}</span>
          </div>
        </div>
        <button onClick={toggleSound} className="p-2 rounded-lg hover:bg-muted transition">
          {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        {tab === "tap" && <TapStage />}
        {tab === "rush" && <RushPanel />}
        {tab === "pit" && <PitPanel />}
        {tab === "shop" && <ShopPanel />}
        {tab === "you" && <YouPanel />}
      </main>

      <nav className="sticky bottom-0 z-20 bg-background/95 backdrop-blur border-t border-border flex justify-around py-2 px-1 safe-area-pb">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition min-w-[3.5rem] ${
              tab === id
                ? "text-yellow-400 bg-yellow-400/10"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

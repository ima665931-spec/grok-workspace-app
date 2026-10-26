import { useEffect } from "react";
import { Coins, Dices, Gem, Store, Timer, UserRound, Volume2, VolumeX, Zap } from "lucide-react";
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
    return () => {
      cancelAnimationFrame(raf);
      unsub();
    };
  }, []);

  if (!booted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="p-4 border-b border-white/10 flex items-center justify-between">
        <h1 className="text-xl font-bold">Tap Rush</h1>
      </header>
      <main className="flex-1 overflow-auto p-4">
        {tab === "tap" && <TapStage />}
        {tab === "rush" && <RushPanel />}
        {tab === "pit" && <PitPanel />}
        {tab === "shop" && <ShopPanel />}
        {tab === "you" && <YouPanel />}
      </main>
      <nav className="border-t border-white/10 flex justify-around p-2 bg-black/90">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${tab === id ? "text-yellow-400" : "text-white/60"}`}
          >
            <Icon size={20} />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

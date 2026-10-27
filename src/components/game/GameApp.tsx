import { useEffect } from "react";
import { Zap, Timer, Dices, Store, UserRound } from "lucide-react";
import { useGame, type Tab } from "@/game/store";
import { TapStage } from "./TapStage";
import { RushPanel } from "./RushPanel";
import { PitPanel } from "./PitPanel";
import { ShopPanel } from "./ShopPanel";
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
    // Force boot after a short delay so we never stay on Loading forever
    const t = setTimeout(() => {
      if (!useGame.getState().booted) {
        useGame.getState().finishLoad();
      }
    }, 300);
    return () => clearTimeout(t);
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
      <nav className="border-t border-white/10 flex justify-around p-2 bg-black/90 safe-area-bottom">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${
              tab === id ? "text-yellow-400" : "text-white/60"
            }`}
          >
            <Icon size={20} />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

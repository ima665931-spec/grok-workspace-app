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
  const setTab = useGame((s) => s.setTab);

  // No more loading gate. Always show the UI.
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="p-4 border-b border-white/10 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Tap Rush</h1>
      </header>

      <main className="flex-1 overflow-auto p-4">
        {tab === "tap" && <TapStage />}
        {tab === "rush" && <RushPanel />}
        {tab === "pit" && <PitPanel />}
        {tab === "shop" && <ShopPanel />}
        {tab === "you" && <YouPanel />}
      </main>

      <nav className="border-t border-white/10 flex justify-around p-2 bg-black/95">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition ${
              tab === id ? "text-yellow-400" : "text-white/50"
            }`}
          >
            <Icon size={22} />
            <span className="text-[11px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

import { Coins, Dices, Gem, Store, Timer, UserRound, Volume2, VolumeX, Zap } from "lucide-react";
import { formatCoins, levelOf } from "@/game/logic";
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
  const setTab = useGame((s) => s.setTab);
  const sound = useGame((s) => s.sound);
  const toggleSound = useGame((s) => s.toggleSound);
  const coins = useGame((s) => s.coins);
  const gems = useGame((s) => s.gems);
  const xp = useGame((s) => s.xp);
  const level = levelOf(xp);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0b", color: "#fafafa", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(10,10,11,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #27272a", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>Tap Rush</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#a1a1aa" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Coins size={14} color="#facc15" /> {formatCoins(coins)}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Gem size={14} color="#22d3ee" /> {gems}
            </span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>Lv.{level}</span>
          </div>
        </div>
        <button onClick={toggleSound} style={{ padding: 8, borderRadius: 8 }}>
          {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </header>

      {/* Content */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        {tab === "tap" && <TapStage />}
        {tab === "rush" && <RushPanel />}
        {tab === "pit" && <PitPanel />}
        {tab === "shop" && <ShopPanel />}
        {tab === "you" && <YouPanel />}
      </main>

      {/* Bottom Nav */}
      <nav style={{ position: "sticky", bottom: 0, zIndex: 20, background: "rgba(10,10,11,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid #27272a", display: "flex", justifyContent: "space-around", padding: "8px 4px" }}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "6px 12px",
                borderRadius: 12,
                minWidth: 56,
                color: active ? "#facc15" : "#71717a",
                background: active ? "rgba(250,204,21,0.1)" : "transparent",
                transition: "all 0.15s",
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

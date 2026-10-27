import { useGame } from "@/game/store";
import { formatCoins, levelOf } from "@/game/logic";

export function YouPanel() {
  const coins = useGame((s) => s.coins);
  const gems = useGame((s) => s.gems);
  const xp = useGame((s) => s.xp);
  const prestige = useGame((s) => s.prestige);
  const level = levelOf(xp);

  const card = {
    background: "#141416",
    borderRadius: 16,
    padding: 16,
    border: "1px solid #27272a",
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Player</h2>
        <p style={{ color: "#a1a1aa", fontSize: 14, margin: 0 }}>Level {level}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={card}>
          <p style={{ color: "#a1a1aa", fontSize: 12, margin: "0 0 4px" }}>Coins</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#facc15", margin: 0 }}>{formatCoins(coins)}</p>
        </div>
        <div style={card}>
          <p style={{ color: "#a1a1aa", fontSize: 12, margin: "0 0 4px" }}>Gems</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#22d3ee", margin: 0 }}>{gems}</p>
        </div>
        <div style={card}>
          <p style={{ color: "#a1a1aa", fontSize: 12, margin: "0 0 4px" }}>XP</p>
          <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{formatCoins(xp)}</p>
        </div>
        <div style={card}>
          <p style={{ color: "#a1a1aa", fontSize: 12, margin: "0 0 4px" }}>Prestige</p>
          <p style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{prestige}</p>
        </div>
      </div>
    </div>
  );
}

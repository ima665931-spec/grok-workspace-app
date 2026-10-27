import { useGame } from "@/game/store";

const GAMES = [
  { id: "crash" as const, name: "Crash", emoji: "📈", desc: "Multiply & Cashout", color: "#f6465d" },
  { id: "dice" as const, name: "Dice", emoji: "🎲", desc: "Over / Under", color: "#0ecb81" },
  { id: "mines" as const, name: "Mines", emoji: "💣", desc: "Avoid the bombs", color: "#f0b90b" },
  { id: "coinflip" as const, name: "Coin Flip", emoji: "🪙", desc: "Heads or Tails", color: "#3b82f6" },
];

export function Lobby() {
  const setTab = useGame((s) => s.setTab);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "8px 0 16px" }}>Popular Games</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {GAMES.map((g) => (
          <button
            key={g.id}
            onClick={() => setTab(g.id)}
            style={{
              background: "#1e2329",
              border: "1px solid #2b3139",
              borderRadius: 16,
              padding: "20px 12px",
              textAlign: "center",
              cursor: "pointer",
              color: "#eaecef"
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>{g.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{g.name}</div>
            <div style={{ fontSize: 12, color: "#848e9c", marginTop: 4 }}>{g.desc}</div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 28 }}>
        <button
          onClick={() => setTab("history")}
          style={{
            width: "100%",
            background: "#1e2329",
            border: "1px solid #2b3139",
            borderRadius: 12,
            padding: "14px",
            color: "#eaecef",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          📜 Bet History
        </button>
      </div>
    </div>
  );
}

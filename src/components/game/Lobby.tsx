import { TrendingUp, Dices, Bomb, Coins, History, User, ChevronRight } from "lucide-react";

type Tab = "lobby" | "crash" | "dice" | "mines" | "coinflip" | "wallet" | "history" | "profile";

const GAMES = [
  { id: "crash" as const, name: "Crash", desc: "Multiply & Cashout", icon: TrendingUp, gradient: "linear-gradient(135deg, #f6465d22, #f6465d08)", iconColor: "#f6465d", border: "rgba(246,70,93,0.2)" },
  { id: "dice" as const, name: "Dice", desc: "Over / Under", icon: Dices, gradient: "linear-gradient(135deg, #0ecb8122, #0ecb8108)", iconColor: "#0ecb81", border: "rgba(14,203,129,0.2)" },
  { id: "mines" as const, name: "Mines", desc: "Avoid the bombs", icon: Bomb, gradient: "linear-gradient(135deg, #f0b90b22, #f0b90b08)", iconColor: "#f0b90b", border: "rgba(240,185,11,0.2)" },
  { id: "coinflip" as const, name: "Coin Flip", desc: "Heads or Tails", icon: Coins, gradient: "linear-gradient(135deg, #3b82f622, #3b82f608)", iconColor: "#3b82f6", border: "rgba(59,130,246,0.2)" },
];

export function Lobby({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>Popular Games</h2>
        <p style={{ color: "#6e7681", fontSize: 13, margin: "4px 0 0" }}>Pick a game and start winning</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {GAMES.map((g) => {
          const Icon = g.icon;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => onNavigate(g.id)}
              style={{
                background: g.gradient,
                border: `1px solid ${g.border}`,
                borderRadius: 18,
                padding: "22px 14px 18px",
                textAlign: "center",
                cursor: "pointer",
                color: "#e6edf3",
                transition: "transform 0.12s, border-color 0.12s",
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14, margin: "0 auto 12px",
                background: `${g.iconColor}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={26} color={g.iconColor} strokeWidth={2} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{g.name}</div>
              <div style={{ fontSize: 12, color: "#6e7681" }}>{g.desc}</div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          type="button"
          onClick={() => onNavigate("history")}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: "14px 16px",
            color: "#e6edf3",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <History size={18} color="#8b949e" /> Bet History
          </span>
          <ChevronRight size={18} color="#6e7681" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("profile")}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14,
            padding: "14px 16px",
            color: "#e6edf3",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <User size={18} color="#8b949e" /> Profile
          </span>
          <ChevronRight size={18} color="#6e7681" />
        </button>
      </div>
    </div>
  );
}

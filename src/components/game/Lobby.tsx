import {
  TrendingUp, Dices, Bomb, Coins, History, User, ChevronRight,
  Palette, Rocket, LayoutGrid, GitBranch, Car,
} from "lucide-react";

type Tab =
  | "lobby" | "wingo" | "rocket" | "crash" | "dice" | "mines"
  | "coinflip" | "ludo" | "snake" | "carrace" | "wallet" | "history" | "profile";

const GAMES = [
  { id: "wingo" as const, name: "WinGo", desc: "Color Prediction", icon: Palette, color: "#a855f7" },
  { id: "rocket" as const, name: "Rocket", desc: "Fly & Cashout", icon: Rocket, color: "#0ecb81" },
  { id: "crash" as const, name: "Crash", desc: "Multiplier", icon: TrendingUp, color: "#f6465d" },
  { id: "mines" as const, name: "Mines", desc: "Avoid bombs", icon: Bomb, color: "#f0b90b" },
  { id: "ludo" as const, name: "Ludo", desc: "vs CPU · 1.9x", icon: LayoutGrid, color: "#22c55e" },
  { id: "snake" as const, name: "Snake", desc: "& Ladder · 1.9x", icon: GitBranch, color: "#eab308" },
  { id: "carrace" as const, name: "Car Race", desc: "Pick winner · 3.5x", icon: Car, color: "#ef4444" },
  { id: "dice" as const, name: "Dice", desc: "Over / Under", icon: Dices, color: "#3b82f6" },
  { id: "coinflip" as const, name: "Coin Flip", desc: "Heads or Tails", icon: Coins, color: "#22d3ee" },
];

export function Lobby({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>All Games</h2>
        <p style={{ color: "#6e7681", fontSize: 13, margin: "4px 0 0" }}>
          WinGo · Rocket · Ludo · Snake · Car Race
        </p>
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
                background: `linear-gradient(135deg, ${g.color}18, ${g.color}08)`,
                border: `1px solid ${g.color}33`,
                borderRadius: 18,
                padding: "20px 12px 16px",
                textAlign: "center",
                cursor: "pointer",
                color: "#e6edf3",
              }}
            >
              <div style={
                {
                  width: 46, height: 46, borderRadius: 14, margin: "0 auto 10px",
                  background: `${g.color}20`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }
              }>
                <Icon size={24} color={g.color} strokeWidth={2} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{g.name}</div>
              <div style={{ fontSize: 11, color: "#6e7681", marginTop: 2 }}>{g.desc}</div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <button type="button" onClick={() => onNavigate("history")} style={menuBtn}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <History size={18} color="#8b949e" /> Bet History
          </span>
          <ChevronRight size={18} color="#6e7681" />
        </button>
        <button type="button" onClick={() => onNavigate("profile")} style={menuBtn}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <User size={18} color="#8b949e" /> Profile
          </span>
          <ChevronRight size={18} color="#6e7681" />
        </button>
      </div>
    </div>
  );
}

const menuBtn: React.CSSProperties = {
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
};

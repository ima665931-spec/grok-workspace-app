"use client";

import { TrendingUp, Dices, Bomb, Coins, History, User } from "lucide-react";

type Tab = "lobby" | "crash" | "dice" | "mines" | "coinflip" | "wallet" | "history" | "profile";

const GAMES = [
  { id: "crash" as const, name: "Crash", desc: "Multiply & Cashout", icon: TrendingUp, color: "#f6465d" },
  { id: "dice" as const, name: "Dice", desc: "Over / Under", icon: Dices, color: "#0ecb81" },
  { id: "mines" as const, name: "Mines", desc: "Avoid the bombs", icon: Bomb, color: "#f0b90b" },
  { id: "coinflip" as const, name: "Coin Flip", desc: "Heads or Tails", icon: Coins, color: "#3b82f6" },
];

export function Lobby({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: "8px 0 16px" }}>Popular Games</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {GAMES.map((g) => {
          const Icon = g.icon;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                console.log("Lobby navigate to", g.id);
                onNavigate(g.id);
              }}
              style={{
                background: "#1e2329",
                border: "1px solid #2b3139",
                borderRadius: 16,
                padding: "22px 12px",
                textAlign: "center",
                cursor: "pointer",
                color: "#eaecef",
              }}
            >
              <div style={{ marginBottom: 10, display: "flex", justifyContent: "center" }}>
                <Icon size={32} color={g.color} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{g.name}</div>
              <div style={{ fontSize: 12, color: "#848e9c", marginTop: 4 }}>{g.desc}</div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          type="button"
          onClick={() => onNavigate("history")}
          style={{
            width: "100%",
            background: "#1e2329",
            border: "1px solid #2b3139",
            borderRadius: 12,
            padding: "14px",
            color: "#eaecef",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <History size={18} /> Bet History
        </button>

        <button
          type="button"
          onClick={() => onNavigate("profile")}
          style={{
            width: "100%",
            background: "#1e2329",
            border: "1px solid #2b3139",
            borderRadius: 12,
            padding: "14px",
            color: "#eaecef",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <User size={18} /> Profile
        </button>
      </div>
    </div>
  );
}

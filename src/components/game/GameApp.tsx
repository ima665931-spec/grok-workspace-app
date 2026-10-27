import { useState } from "react";
import {
  Gamepad2,
  TrendingUp,
  Dices,
  Bomb,
  Wallet,
  Coins,
  Palette,
  Rocket,
} from "lucide-react";
import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";
import { Lobby } from "./Lobby";
import { WinGoGame } from "./WinGoGame";
import { RocketGame } from "./RocketGame";
import { CrashGame } from "./CrashGame";
import { DiceGame } from "./DiceGame";
import { MinesGame } from "./MinesGame";
import { CoinFlipGame } from "./CoinFlipGame";
import { WalletPanel } from "./WalletPanel";
import { HistoryPanel } from "./HistoryPanel";
import { ProfilePanel } from "./ProfilePanel";

type Tab =
  | "lobby"
  | "wingo"
  | "rocket"
  | "crash"
  | "dice"
  | "mines"
  | "coinflip"
  | "ludo"
  | "snake"
  | "wallet"
  | "history"
  | "profile";

const NAV: { id: Tab; label: string; icon: any }[] = [
  { id: "lobby", label: "Games", icon: Gamepad2 },
  { id: "wingo", label: "WinGo", icon: Palette },
  { id: "rocket", label: "Rocket", icon: Rocket },
  { id: "mines", label: "Mines", icon: Bomb },
  { id: "wallet", label: "Wallet", icon: Wallet },
];

export function GameApp() {
  const [tab, setTab] = useState<Tab>("lobby");
  const balance = useGame((s) => s.balance);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0a0c10 0%, #0d1117 40%, #0a0c10 100%)",
        color: "#e6edf3",
        display: "flex",
        flexDirection: "column",
        maxWidth: 480,
        margin: "0 auto",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "rgba(10, 12, 16, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #f0b90b, #fcd535)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <TrendingUp size={16} color="#0a0c10" strokeWidth={2.5} />
          </div>
          <span style={{
            background: "linear-gradient(90deg, #f0b90b, #fcd535)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>BetRush</span>
        </div>

        <div style={{
          background: "linear-gradient(135deg, rgba(240,185,11,0.15), rgba(240,185,11,0.05))",
          border: "1px solid rgba(240,185,11,0.25)",
          padding: "7px 14px",
          borderRadius: 24,
          fontSize: 14,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: "#f0b90b",
        }}>
          <Coins size={15} />
          ₹{formatCoins(balance)}
        </div>
      </header>

      <main style={{ flex: 1, overflowY: "auto", paddingBottom: 88 }}>
        {tab === "lobby" && <Lobby onNavigate={setTab} />}
        {tab === "wingo" && <WinGoGame />}
        {tab === "rocket" && <RocketGame />}
        {tab === "crash" && <CrashGame />}
        {tab === "dice" && <DiceGame />}
        {tab === "mines" && <MinesGame />}
        {tab === "coinflip" && <CoinFlipGame />}
        {tab === "ludo" && <ComingSoon name="Ludo" />}
        {tab === "snake" && <ComingSoon name="Snake & Ladder" />}
        {tab === "wallet" && <WalletPanel onNavigate={setTab} />}
        {tab === "history" && <HistoryPanel />}
        {tab === "profile" && <ProfilePanel />}
      </main>

      <nav style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        background: "rgba(13, 17, 23, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "space-around",
        padding: "10px 0 14px",
        zIndex: 50,
      }}>
        {NAV.map((item) => {
          const active = tab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                background: "transparent",
                border: "none",
                color: active ? "#f0b90b" : "#6e7681",
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              <div style={{
                width: 40, height: 28, borderRadius: 14,
                background: active ? "rgba(240,185,11,0.12)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              </div>
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function ComingSoon({ name }: { name: string }) {
  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{name}</h2>
      <p style={{ color: "#6e7681", fontSize: 14 }}>
        Full board game + multiplayer coming next.
        <br />WinGo, Rocket, Mines are live now.
      </p>
    </div>
  );
}

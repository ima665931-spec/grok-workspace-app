import {
  Gamepad2,
  TrendingUp,
  Dices,
  Bomb,
  Wallet,
  History,
  User,
  Coins,
} from "lucide-react";
import { useGame, type Tab } from "@/game/store";
import { formatCoins } from "@/game/logic";
import { Lobby } from "./Lobby";
import { CrashGame } from "./CrashGame";
import { DiceGame } from "./DiceGame";
import { MinesGame } from "./MinesGame";
import { CoinFlipGame } from "./CoinFlipGame";
import { WalletPanel } from "./WalletPanel";
import { HistoryPanel } from "./HistoryPanel";
import { ProfilePanel } from "./ProfilePanel";

const NAV: { id: Tab; label: string; icon: any }[] = [
  { id: "lobby", label: "Games", icon: Gamepad2 },
  { id: "crash", label: "Crash", icon: TrendingUp },
  { id: "dice", label: "Dice", icon: Dices },
  { id: "mines", label: "Mines", icon: Bomb },
  { id: "wallet", label: "Wallet", icon: Wallet },
];

export function GameApp() {
  const tab = useGame((s) => s.tab);
  const setTab = useGame((s) => s.setTab);
  const balance = useGame((s) => s.balance);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0e11",
        color: "#eaecef",
        display: "flex",
        flexDirection: "column",
        maxWidth: 480,
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "rgba(11,14,17,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #1e2329",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 17, display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={20} color="#f0b90b" />
          BetRush
        </div>

        <div
          style={{
            background: "#1e2329",
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 14,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Coins size={15} color="#f0b90b" />
          {formatCoins(balance)}
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        {tab === "lobby" && <Lobby />}
        {tab === "crash" && <CrashGame />}
        {tab === "dice" && <DiceGame />}
        {tab === "mines" && <MinesGame />}
        {tab === "coinflip" && <CoinFlipGame />}
        {tab === "wallet" && <WalletPanel />}
        {tab === "history" && <HistoryPanel />}
        {tab === "profile" && <ProfilePanel />}
      </main>

      {/* Bottom Nav */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 480,
          background: "#12151a",
          borderTop: "1px solid #1e2329",
          display: "flex",
          justifyContent: "space-around",
          padding: "8px 0 12px",
          zIndex: 40,
        }}
      >
        {NAV.map((item) => {
          const active = tab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                background: "transparent",
                border: "none",
                color: active ? "#f0b90b" : "#848e9c",
                fontSize: 11,
                fontWeight: active ? 600 : 400,
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

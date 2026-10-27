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

const NAV: { id: Tab; label: string; emoji: string }[] = [
  { id: "lobby", label: "Games", emoji: "🎮" },
  { id: "crash", label: "Crash", emoji: "📈" },
  { id: "dice", label: "Dice", emoji: "🎲" },
  { id: "mines", label: "Mines", emoji: "💣" },
  { id: "wallet", label: "Wallet", emoji: "💰" },
];

export function GameApp() {
  const tab = useGame((s) => s.tab);
  const setTab = useGame((s) => s.setTab);
  const balance = useGame((s) => s.balance);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b0e11",
      color: "#eaecef",
      display: "flex",
      flexDirection: "column",
      maxWidth: 480,
      margin: "0 auto",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      {/* Top Bar */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "rgba(11,14,17,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1e2329",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ fontWeight: 700, fontSize: 17 }}>⚡ BetRush</div>
        <div style={{
          background: "#1e2329",
          padding: "6px 12px",
          borderRadius: 20,
          fontSize: 14,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6
        }}>
          <span style={{ color: "#f0b90b" }}>₹</span>
          {formatCoins(balance)}
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: "auto", paddingBottom: 70 }}>
        {tab === "lobby" && <Lobby />}
        {tab === "crash" && <CrashGame />}
        {tab === "dice" && <DiceGame />}
        {tab === "mines" && <MinesGame />}
        {tab === "coinflip" && <CoinFlipGame />}
        {tab === "wallet" && <WalletPanel />}
        {tab === "history" && <HistoryPanel />}
        {tab === "profile" && <ProfilePanel />}
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: 480,
        margin: "0 auto",
        background: "#12151a",
        borderTop: "1px solid #1e2329",
        display: "flex",
        justifyContent: "space-around",
        padding: "8px 0 10px",
        zIndex: 40
      }}>
        {NAV.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                background: "none",
                border: "none",
                color: active ? "#f0b90b" : "#848e9c",
                fontSize: 11,
                fontWeight: active ? 600 : 400,
                padding: "4px 8px",
                cursor: "pointer"
              }}
            >
              <span style={{ fontSize: 20 }}>{item.emoji}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

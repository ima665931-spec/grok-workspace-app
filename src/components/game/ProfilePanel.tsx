import { useGame } from "@/game/store";
import { formatCoins } from "@/game/logic";

export function ProfilePanel() {
  const balance = useGame((s) => s.balance);
  const history = useGame((s) => s.history);

  const totalBets = history.length;
  const wins = history.filter((h) => h.won).length;
  const winRate = totalBets > 0 ? Math.round((wins / totalBets) * 100) : 0;

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>👤 Profile</h2>

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#1e2329", border: "2px solid #f0b90b",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, margin: "0 auto 12px"
        }}>⚡</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Player</div>
        <div style={{ color: "#848e9c", fontSize: 13 }}>Demo Account</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "#1e2329", borderRadius: 12, padding: 16, border: "1px solid #2b3139" }}>
          <div style={{ color: "#848e9c", fontSize: 12 }}>Balance</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f0b90b" }}>₹{formatCoins(balance)}</div>
        </div>
        <div style={{ background: "#1e2329", borderRadius: 12, padding: 16, border: "1px solid #2b3139" }}>
          <div style={{ color: "#848e9c", fontSize: 12 }}>Total Bets</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{totalBets}</div>
        </div>
        <div style={{ background: "#1e2329", borderRadius: 12, padding: 16, border: "1px solid #2b3139" }}>
          <div style={{ color: "#848e9c", fontSize: 12 }}>Wins</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#0ecb81" }}>{wins}</div>
        </div>
        <div style={{ background: "#1e2329", borderRadius: 12, padding: 16, border: "1px solid #2b3139" }}>
          <div style={{ color: "#848e9c", fontSize: 12 }}>Win Rate</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{winRate}%</div>
        </div>
      </div>
    </div>
  );
}

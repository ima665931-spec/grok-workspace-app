import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";

export function ProfilePanel() {
  const balance = useGame((s) => s.balance);
  const history = useGame((s) => s.history);

  const totalBets = history.length;
  const wins = history.filter((h) => h.won).length;
  const winRate = totalBets > 0 ? Math.round((wins / totalBets) * 100) : 0;

  const cards = [
    { label: "Balance", value: `₹${formatCoins(balance)}`, color: "#f0b90b" },
    { label: "Total Bets", value: String(totalBets), color: "#e6edf3" },
    { label: "Wins", value: String(wins), color: "#0ecb81" },
    { label: "Win Rate", value: `${winRate}%`, color: "#3b82f6" },
  ];

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px", letterSpacing: "-0.02em" }}>Profile</h2>

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", margin: "0 auto 12px",
          background: "linear-gradient(135deg, #f0b90b, #fcd535)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, fontWeight: 900, color: "#0a0c10",
        }}>B</div>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Player</div>
        <div style={{ color: "#6e7681", fontSize: 13, marginTop: 2 }}>Demo Account</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {cards.map((c) => (
          <div key={c.label} style={{
            background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 16,
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ color: "#6e7681", fontSize: 12, marginBottom: 4, fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

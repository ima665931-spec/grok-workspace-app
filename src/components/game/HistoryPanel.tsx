import { useGame } from "@/game/store";
import { formatCoins, formatTime } from "@/game/logic";

export function HistoryPanel() {
  const history = useGame((s) => s.history);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>📜 Bet History</h2>

      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#848e9c" }}>
          No bets yet. Go play!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((bet) => (
            <div
              key={bet.id}
              style={{
                background: "#1e2329",
                borderRadius: 12,
                padding: "12px 14px",
                border: "1px solid #2b3139",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{bet.game}</div>
                <div style={{ fontSize: 12, color: "#848e9c" }}>{formatTime(bet.time)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontWeight: 700,
                  color: bet.won ? "#0ecb81" : "#f6465d"
                }}>
                  {bet.won ? "+" : "-"}₹{formatCoins(bet.won ? bet.payout : bet.amount)}
                </div>
                {bet.won && bet.multiplier ? (
                  <div style={{ fontSize: 11, color: "#848e9c" }}>{bet.multiplier}x</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

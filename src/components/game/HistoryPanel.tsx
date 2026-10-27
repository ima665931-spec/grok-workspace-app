import { useGame } from "../../game/store";
import { formatCoins, formatTime } from "../../game/logic";

export function HistoryPanel() {
  const history = useGame((s) => s.history);

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.02em" }}>Bet History</h2>

      {history.length === 0 ? (
        <div style={{
          textAlign: "center", padding: 48, color: "#6e7681",
          background: "rgba(255,255,255,0.02)", borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.04)",
        }}>
          No bets yet. Go play!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((bet) => (
            <div
              key={bet.id}
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 14, padding: "14px 16px",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{bet.game}</div>
                <div style={{ fontSize: 12, color: "#6e7681", marginTop: 2 }}>{formatTime(bet.time)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: bet.won ? "#0ecb81" : "#f6465d" }}>
                  {bet.won ? "+" : "-"}₹{formatCoins(bet.won ? bet.payout : bet.amount)}
                </div>
                {bet.won && bet.multiplier ? (
                  <div style={{ fontSize: 11, color: "#6e7681", marginTop: 2 }}>{bet.multiplier}x</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

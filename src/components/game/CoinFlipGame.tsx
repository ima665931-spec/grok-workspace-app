import { useState } from "react";
import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";

export function CoinFlipGame() {
  const balance = useGame((s) => s.balance);
  const tryPlaceStake = useGame((s) => s.tryPlaceStake);
  const creditWin = useGame((s) => s.creditWin);
  const recordBet = useGame((s) => s.recordBet);

  const [betAmount, setBetAmount] = useState(100);
  const [choice, setChoice] = useState<"heads" | "tails">("heads");
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [flipping, setFlipping] = useState(false);

  const flip = () => {
    if (betAmount <= 0 || betAmount > balance || flipping) return;
    if (!tryPlaceStake(betAmount)) return;
    setFlipping(true);
    setResult(null);
    setTimeout(() => {
      const res = Math.random() < 0.5 ? "heads" : "tails";
      setResult(res);
      const won = res === choice;
      if (won) {
        const payout = Math.floor(betAmount * 1.95);
        creditWin(payout);
        recordBet("CoinFlip", betAmount, 1.95, true);
      } else {
        recordBet("CoinFlip", betAmount, 0, false);
      }
      setFlipping(false);
    }, 900);
  };

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px" }}>Coin Flip</h2>
      <div style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
        borderRadius: 20, height: 160, display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20, border: "1px solid rgba(255,255,255,0.06)", fontSize: 56,
      }}>
        {flipping ? "🌀" : result === "heads" ? "🟢" : result === "tails" ? "🔴" : "🪙"}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["heads", "tails"] as const).map((c) => (
          <button key={c} type="button" onClick={() => setChoice(c)}
            style={{
              flex: 1, padding: 14, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer",
              border: choice === c ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.08)",
              background: choice === c ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
              color: choice === c ? "#3b82f6" : "#e6edf3", textTransform: "capitalize",
            }}>{c}</button>
        ))}
      </div>

      <input type="number" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))}
        style={{
          width: "100%", padding: "14px 16px", borderRadius: 12, marginBottom: 14,
          border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
          color: "#e6edf3", fontSize: 16, fontWeight: 600, outline: "none",
        }}
      />

      <button type="button" onClick={flip} disabled={flipping || betAmount <= 0 || betAmount > balance}
        style={{
          width: "100%", padding: 16, borderRadius: 14, border: "none",
          background: flipping ? "#21262d" : "linear-gradient(135deg, #3b82f6, #2563eb)",
          color: flipping ? "#6e7681" : "#fff", fontWeight: 800, fontSize: 16,
          cursor: flipping ? "not-allowed" : "pointer",
        }}
      >{flipping ? "Flipping..." : `Flip · Win ₹${formatCoins(Math.floor(betAmount * 1.95))}`}</button>
    </div>
  );
}

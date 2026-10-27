import { useState } from "react";
import { useGame } from "@/game/store";
import { formatCoins } from "@/game/logic";

export function CoinFlipGame() {
  const balance = useGame((s) => s.balance);
  const placeBet = useGame((s) => s.placeBet);

  const [betAmount, setBetAmount] = useState(100);
  const [choice, setChoice] = useState<"heads" | "tails">("heads");
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [flipping, setFlipping] = useState(false);

  const flip = () => {
    if (betAmount <= 0 || betAmount > balance || flipping) return;
    setFlipping(true);
    setResult(null);

    setTimeout(() => {
      const res = Math.random() < 0.5 ? "heads" : "tails";
      setResult(res);
      const won = res === choice;
      placeBet("CoinFlip", betAmount, won ? 1.95 : 0, won);
      setFlipping(false);
    }, 800);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>🪙 Coin Flip</h2>

      <div style={{
        background: "#1e2329",
        borderRadius: 16,
        height: 160,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        border: "1px solid #2b3139",
        fontSize: 64
      }}>
        {flipping ? "🌀" : result === "heads" ? "🟢" : result === "tails" ? "🔴" : "🪙"}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setChoice("heads")}
          style={{
            flex: 1, padding: 14, borderRadius: 10,
            border: choice === "heads" ? "1px solid #0ecb81" : "1px solid #2b3139",
            background: choice === "heads" ? "rgba(14,203,129,0.15)" : "#1e2329",
            color: "#eaecef", fontWeight: 600, cursor: "pointer"
          }}
        >
          Heads
        </button>
        <button
          onClick={() => setChoice("tails")}
          style={{
            flex: 1, padding: 14, borderRadius: 10,
            border: choice === "tails" ? "1px solid #0ecb81" : "1px solid #2b3139",
            background: choice === "tails" ? "rgba(14,203,129,0.15)" : "#1e2329",
            color: "#eaecef", fontWeight: 600, cursor: "pointer"
          }}
        >
          Tails
        </button>
      </div>

      <input
        type="number"
        value={betAmount}
        onChange={(e) => setBetAmount(Number(e.target.value))}
        style={{
          width: "100%", padding: 14, borderRadius: 10, border: "1px solid #2b3139",
          background: "#1e2329", color: "#eaecef", fontSize: 16, marginBottom: 12, boxSizing: "border-box"
        }}
      />

      <button
        onClick={flip}
        disabled={flipping || betAmount <= 0 || betAmount > balance}
        style={{
          width: "100%", padding: 16, borderRadius: 12, border: "none",
          background: "#0ecb81", color: "#000", fontWeight: 700, fontSize: 16,
          cursor: flipping ? "not-allowed" : "pointer"
        }}
      >
        {flipping ? "Flipping..." : `Flip • Win ₹${formatCoins(Math.floor(betAmount * 1.95))}`}
      </button>
    </div>
  );
}

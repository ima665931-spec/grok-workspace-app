import { useState } from "react";
import { useGame } from "@/game/store";
import { formatCoins } from "@/game/logic";

export function DiceGame() {
  const balance = useGame((s) => s.balance);
  const placeBet = useGame((s) => s.placeBet);

  const [betAmount, setBetAmount] = useState(100);
  const [target, setTarget] = useState(50);
  const [isOver, setIsOver] = useState(true);
  const [result, setResult] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<boolean | null>(null);

  const multiplier = isOver
    ? Number((99 / (99 - target)).toFixed(2))
    : Number((99 / target).toFixed(2));

  const roll = () => {
    if (betAmount <= 0 || betAmount > balance) return;

    const rollValue = Math.floor(Math.random() * 100) + 1; // 1-100
    setResult(rollValue);

    const won = isOver ? rollValue > target : rollValue < target;
    setLastWin(won);
    placeBet("Dice", betAmount, won ? multiplier : 0, won);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>🎲 Dice</h2>

      <div style={{
        background: "#1e2329",
        borderRadius: 16,
        padding: 24,
        textAlign: "center",
        marginBottom: 20,
        border: "1px solid #2b3139"
      }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: lastWin === null ? "#eaecef" : lastWin ? "#0ecb81" : "#f6465d" }}>
          {result !== null ? result : "—"}
        </div>
        <div style={{ color: "#848e9c", fontSize: 13, marginTop: 4 }}>
          {result === null ? "Roll the dice" : lastWin ? `Won ${multiplier}x` : "Lost"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setIsOver(false)}
          style={{
            flex: 1, padding: 12, borderRadius: 10,
            border: !isOver ? "1px solid #0ecb81" : "1px solid #2b3139",
            background: !isOver ? "rgba(14,203,129,0.15)" : "#1e2329",
            color: "#eaecef", fontWeight: 600, cursor: "pointer"
          }}
        >
          Under
        </button>
        <button
          onClick={() => setIsOver(true)}
          style={{
            flex: 1, padding: 12, borderRadius: 10,
            border: isOver ? "1px solid #0ecb81" : "1px solid #2b3139",
            background: isOver ? "rgba(14,203,129,0.15)" : "#1e2329",
            color: "#eaecef", fontWeight: 600, cursor: "pointer"
          }}
        >
          Over
        </button>
      </div>

      <div style={{ marginBottom: 8, color: "#848e9c", fontSize: 13 }}>
        Target: {target} • Multiplier: {multiplier}x
      </div>
      <input
        type="range"
        min={5}
        max={95}
        value={target}
        onChange={(e) => setTarget(Number(e.target.value))}
        style={{ width: "100%", marginBottom: 16 }}
      />

      <input
        type="number"
        value={betAmount}
        onChange={(e) => setBetAmount(Number(e.target.value))}
        style={{
          width: "100%", padding: 14, borderRadius: 10,
          border: "1px solid #2b3139", background: "#1e2329",
          color: "#eaecef", fontSize: 16, marginBottom: 12, boxSizing: "border-box"
        }}
      />

      <button
        onClick={roll}
        disabled={betAmount <= 0 || betAmount > balance}
        style={{
          width: "100%", padding: 16, borderRadius: 12, border: "none",
          background: betAmount > balance ? "#2b3139" : "#0ecb81",
          color: "#000", fontWeight: 700, fontSize: 16,
          cursor: betAmount > balance ? "not-allowed" : "pointer"
        }}
      >
        Roll • Possible Win ₹{formatCoins(Math.floor(betAmount * multiplier))}
      </button>
    </div>
  );
}

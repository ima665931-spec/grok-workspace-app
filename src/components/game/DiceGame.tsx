import { useState } from "react";
import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";

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
    const rollValue = Math.floor(Math.random() * 100) + 1;
    setResult(rollValue);
    const won = isOver ? rollValue > target : rollValue < target;
    setLastWin(won);
    placeBet("Dice", betAmount, won ? multiplier : 0, won);
  };

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.02em" }}>Dice</h2>

      <div style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
        borderRadius: 20, padding: 28, textAlign: "center", marginBottom: 20,
        border: `1px solid ${lastWin === null ? "rgba(255,255,255,0.06)" : lastWin ? "rgba(14,203,129,0.25)" : "rgba(246,70,93,0.25)"}`,
      }}>
        <div style={{
          fontSize: 56, fontWeight: 900, letterSpacing: "-0.03em",
          color: lastWin === null ? "#e6edf3" : lastWin ? "#0ecb81" : "#f6465d",
        }}>
          {result !== null ? result : "—"}
        </div>
        <div style={{ color: "#8b949e", fontSize: 13, marginTop: 6, fontWeight: 500 }}>
          {result === null ? "Roll the dice" : lastWin ? `Won ${multiplier}x` : "Lost"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Under", val: false },
          { label: "Over", val: true },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => setIsOver(opt.val)}
            style={{
              flex: 1, padding: 13, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer",
              border: isOver === opt.val ? "1px solid #0ecb81" : "1px solid rgba(255,255,255,0.08)",
              background: isOver === opt.val ? "rgba(14,203,129,0.12)" : "rgba(255,255,255,0.03)",
              color: isOver === opt.val ? "#0ecb81" : "#e6edf3",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: "#8b949e" }}>
        <span>Target: <b style={{ color: "#e6edf3" }}>{target}</b></span>
        <span>Multiplier: <b style={{ color: "#f0b90b" }}>{multiplier}x</b></span>
      </div>
      <input
        type="range" min={5} max={95} value={target}
        onChange={(e) => setTarget(Number(e.target.value))}
        style={{ width: "100%", marginBottom: 16, accentColor: "#0ecb81" }}
      />

      <input
        type="number" value={betAmount}
        onChange={(e) => setBetAmount(Number(e.target.value))}
        style={{
          width: "100%", padding: "14px 16px", borderRadius: 12, marginBottom: 14,
          border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
          color: "#e6edf3", fontSize: 16, fontWeight: 600, outline: "none",
        }}
      />

      <button
        type="button" onClick={roll}
        disabled={betAmount <= 0 || betAmount > balance}
        style={{
          width: "100%", padding: 16, borderRadius: 14, border: "none",
          background: betAmount > balance ? "#21262d" : "linear-gradient(135deg, #0ecb81, #0ba86a)",
          color: betAmount > balance ? "#6e7681" : "#fff",
          fontWeight: 800, fontSize: 16,
          cursor: betAmount > balance ? "not-allowed" : "pointer",
          boxShadow: betAmount > balance ? "none" : "0 4px 20px rgba(14,203,129,0.3)",
        }}
      >
        Roll • Win ₹{formatCoins(Math.floor(betAmount * multiplier))}
      </button>
    </div>
  );
}

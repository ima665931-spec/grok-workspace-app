import { useState } from "react";
import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";

/** Simplified Ludo: race to 50. You vs CPU. Dice 1-6. */
export function LudoGame() {
  const balance = useGame((s) => s.balance);
  const tryPlaceStake = useGame((s) => s.tryPlaceStake);
  const creditWin = useGame((s) => s.creditWin);
  const recordBet = useGame((s) => s.recordBet);

  const GOAL = 50;
  const [betAmount, setBetAmount] = useState(100);
  const [stake, setStake] = useState(0);
  const [you, setYou] = useState(0);
  const [cpu, setCpu] = useState(0);
  const [dice, setDice] = useState<number | null>(null);
  const [turn, setTurn] = useState<"you" | "cpu" | "idle" | "over">("idle");
  const [msg, setMsg] = useState("Place bet & start");
  const [winner, setWinner] = useState<"you" | "cpu" | null>(null);

  const start = () => {
    if (betAmount <= 0 || betAmount > balance) return;
    if (!tryPlaceStake(betAmount)) return;
    setStake(betAmount);
    setYou(0);
    setCpu(0);
    setDice(null);
    setWinner(null);
    setTurn("you");
    setMsg("Your turn — roll dice");
  };

  const roll = () => {
    if (turn !== "you") return;
    const d = Math.floor(Math.random() * 6) + 1;
    setDice(d);
    const next = Math.min(GOAL, you + d);
    setYou(next);
    if (next >= GOAL) {
      setWinner("you");
      setTurn("over");
      setMsg("You won!");
      const payout = Math.floor(stake * 1.9);
      creditWin(payout);
      recordBet("Ludo", stake, 1.9, true);
      return;
    }
    setMsg(`You rolled ${d}. CPU turn...`);
    setTurn("cpu");
    setTimeout(() => {
      const cd = Math.floor(Math.random() * 6) + 1;
      setDice(cd);
      setCpu((c) => {
        const n = Math.min(GOAL, c + cd);
        if (n >= GOAL) {
          setWinner("cpu");
          setTurn("over");
          setMsg("CPU won!");
          recordBet("Ludo", stake, 0, false);
          return n;
        }
        setMsg(`CPU rolled ${cd}. Your turn`);
        setTurn("you");
        return n;
      });
    }, 800);
  };

  const bar = (pos: number, color: string) => (
    <div style={{ height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 8, overflow: "hidden", marginBottom: 6 }}>
      <div style={{ width: `${(pos / GOAL) * 100}%`, height: "100%", background: color, borderRadius: 8, transition: "width 0.3s" }} />
    </div>
  );

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px" }}>Ludo</h2>
      <p style={{ color: "#6e7681", fontSize: 12, margin: "-8px 0 16px" }}>Race to {GOAL} · vs CPU · Win 1.9x</p>

      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16, marginBottom: 16,
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
          <span style={{ color: "#0ecb81", fontWeight: 700 }}>You: {you}</span>
          <span style={{ color: "#f6465d", fontWeight: 700 }}>CPU: {cpu}</span>
        </div>
        {bar(you, "#0ecb81")}
        {bar(cpu, "#f6465d")}

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <div style={{
            width: 64, height: 64, margin: "0 auto 8px", borderRadius: 14,
            background: "linear-gradient(135deg, #1e293b, #0f172a)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 900,
          }}>{dice ?? "🎲"}</div>
          <div style={{ color: "#8b949e", fontSize: 13 }}>{msg}</div>
        </div>
      </div>

      {turn === "idle" || turn === "over" ? (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[50, 100, 500, 1000].map((v) => (
              <button key={v} type="button" onClick={() => setBetAmount(v)}
                style={chip(betAmount === v)}>{v}</button>
            ))}
          </div>
          <button type="button" onClick={start} disabled={betAmount > balance}
            style={primaryBtn(betAmount > balance)}>
            {turn === "over" ? "Play Again" : "Start"} · ₹{formatCoins(betAmount)}
          </button>
        </>
      ) : (
        <button type="button" onClick={roll} disabled={turn !== "you"}
          style={primaryBtn(turn !== "you")}>
          {turn === "you" ? "Roll Dice" : "CPU thinking..."}
        </button>
      )}
    </div>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: 10, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
    border: active ? "1px solid #f0b90b" : "1px solid rgba(255,255,255,0.08)",
    background: active ? "rgba(240,185,11,0.12)" : "rgba(255,255,255,0.03)",
    color: active ? "#f0b90b" : "#e6edf3",
  };
}
function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    width: "100%", padding: 16, borderRadius: 14, border: "none",
    background: disabled ? "#21262d" : "linear-gradient(135deg, #0ecb81, #0ba86a)",
    color: disabled ? "#6e7681" : "#fff", fontWeight: 800, fontSize: 16,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

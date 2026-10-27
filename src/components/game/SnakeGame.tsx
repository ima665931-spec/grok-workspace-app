import { useState } from "react";
import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";

const SNAKES: Record<number, number> = { 16: 6, 47: 26, 49: 11, 56: 53, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 78 };
const LADDERS: Record<number, number> = { 1: 38, 4: 14, 9: 31, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 80: 100 };

function applyBoard(pos: number) {
  if (SNAKES[pos]) return SNAKES[pos];
  if (LADDERS[pos]) return LADDERS[pos];
  return pos;
}

export function SnakeGame() {
  const balance = useGame((s) => s.balance);
  const tryPlaceStake = useGame((s) => s.tryPlaceStake);
  const creditWin = useGame((s) => s.creditWin);
  const recordBet = useGame((s) => s.recordBet);

  const [betAmount, setBetAmount] = useState(100);
  const [stake, setStake] = useState(0);
  const [you, setYou] = useState(0);
  const [cpu, setCpu] = useState(0);
  const [dice, setDice] = useState<number | null>(null);
  const [turn, setTurn] = useState<"you" | "cpu" | "idle" | "over">("idle");
  const [msg, setMsg] = useState("Bet & start — first to 100");
  const [log, setLog] = useState("");

  const start = () => {
    if (betAmount <= 0 || betAmount > balance) return;
    if (!tryPlaceStake(betAmount)) return;
    setStake(betAmount);
    setYou(0);
    setCpu(0);
    setDice(null);
    setLog("");
    setTurn("you");
    setMsg("Your turn");
  };

  const move = (from: number, d: number) => {
    let next = from + d;
    if (next > 100) return from;
    const after = applyBoard(next);
    return after;
  };

  const roll = () => {
    if (turn !== "you") return;
    const d = Math.floor(Math.random() * 6) + 1;
    setDice(d);
    const next = move(you, d);
    const event = next < you + d && next !== you + d
      ? (SNAKES[you + d] ? " Snake!" : " Ladder!")
      : "";
    setYou(next);
    setLog(`You: ${d}${event} → ${next}`);
    if (next >= 100) {
      setTurn("over");
      setMsg("You reached 100!");
      creditWin(Math.floor(stake * 1.9));
      recordBet("Snake", stake, 1.9, true);
      return;
    }
    setTurn("cpu");
    setMsg("CPU turn...");
    setTimeout(() => {
      const cd = Math.floor(Math.random() * 6) + 1;
      setDice(cd);
      setCpu((c) => {
        const n = move(c, cd);
        setLog(`CPU: ${cd} → ${n}`);
        if (n >= 100) {
          setTurn("over");
          setMsg("CPU won!");
          recordBet("Snake", stake, 0, false);
          return n;
        }
        setTurn("you");
        setMsg("Your turn");
        return n;
      });
    }, 700);
  };

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>Snake & Ladder</h2>
      <p style={{ color: "#6e7681", fontSize: 12, margin: "0 0 16px" }}>Classic board · vs CPU · Win 1.9x</p>

      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16, marginBottom: 16,
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div style={{ textAlign: "center", padding: 12, borderRadius: 12, background: "rgba(14,203,129,0.1)" }}>
            <div style={{ fontSize: 11, color: "#8b949e" }}>You</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#0ecb81" }}>{you}</div>
          </div>
          <div style={{ textAlign: "center", padding: 12, borderRadius: 12, background: "rgba(246,70,93,0.1)" }}>
            <div style={{ fontSize: 11, color: "#8b949e" }}>CPU</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#f6465d" }}>{cpu}</div>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, margin: "0 auto 8px", borderRadius: 12,
            background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 900,
          }}>{dice ?? "🎲"}</div>
          <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>{msg}</div>
          {log && <div style={{ color: "#6e7681", fontSize: 12, marginTop: 4 }}>{log}</div>}
        </div>
      </div>

      {turn === "idle" || turn === "over" ? (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[50, 100, 500, 1000].map((v) => (
              <button key={v} type="button" onClick={() => setBetAmount(v)}
                style={{
                  flex: 1, padding: 10, borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer",
                  border: betAmount === v ? "1px solid #f0b90b" : "1px solid rgba(255,255,255,0.08)",
                  background: betAmount === v ? "rgba(240,185,11,0.12)" : "rgba(255,255,255,0.03)",
                  color: betAmount === v ? "#f0b90b" : "#e6edf3",
                }}>{v}</button>
            ))}
          </div>
          <button type="button" onClick={start} disabled={betAmount > balance}
            style={{
              width: "100%", padding: 16, borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #0ecb81, #0ba86a)", color: "#fff",
              fontWeight: 800, fontSize: 16, cursor: "pointer",
            }}
          >{turn === "over" ? "Play Again" : "Start"} · ₹{formatCoins(betAmount)}</button>
        </>
      ) : (
        <button type="button" onClick={roll} disabled={turn !== "you"}
          style={{
            width: "100%", padding: 16, borderRadius: 14, border: "none",
            background: turn !== "you" ? "#21262d" : "linear-gradient(135deg, #f0b90b, #e5a800)",
            color: turn !== "you" ? "#6e7681" : "#0a0c10", fontWeight: 800, fontSize: 16,
            cursor: turn !== "you" ? "not-allowed" : "pointer",
          }}
        >{turn === "you" ? "Roll Dice" : "CPU..."}</button>
      )}
    </div>
  );
}

import { useState } from "react";
import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";
import { LudoMultiplayer } from "./LudoMultiplayer";

export function LudoGame() {
  const [mode, setMode] = useState<"pick" | "cpu" | "online">("pick");

  if (mode === "online") {
    return <LudoMultiplayer onBack={() => setMode("pick")} />;
  }

  if (mode === "cpu") {
    return <LudoCpu onBack={() => setMode("pick")} />;
  }

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>Ludo</h2>
      <p style={{ color: "#6e7681", fontSize: 13, margin: "0 0 20px" }}>Choose mode</p>

      <button type="button" onClick={() => setMode("online")} style={bigBtn("#0ecb81")}>
        🌐 Online Multiplayer
        <span style={sub}>Create / Join room with friends</span>
      </button>

      <button type="button" onClick={() => setMode("cpu")} style={{ ...bigBtn("#3b82f6"), marginTop: 12 }}>
        🤖 vs CPU
        <span style={sub}>Practice offline · 1.9x stake</span>
      </button>
    </div>
  );
}

function bigBtn(color: string): React.CSSProperties {
  return {
    width: "100%",
    textAlign: "left",
    padding: "18px 16px",
    borderRadius: 16,
    border: `1px solid ${color}44`,
    background: `linear-gradient(135deg, ${color}22, ${color}08)`,
    color: "#e6edf3",
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
  };
}

const sub: React.CSSProperties = {
  display: "block",
  fontWeight: 500,
  fontSize: 12,
  color: "#8b949e",
  marginTop: 4,
};

function LudoCpu({ onBack }: { onBack: () => void }) {
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

  const start = () => {
    if (betAmount <= 0 || betAmount > balance) return;
    if (!tryPlaceStake(betAmount)) return;
    setStake(betAmount);
    setYou(0);
    setCpu(0);
    setDice(null);
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
      setTurn("over");
      setMsg("You won!");
      creditWin(Math.floor(stake * 1.9));
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

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Ludo vs CPU</h2>
        <button type="button" onClick={onBack} style={{ background: "none", border: "none", color: "#8b949e", cursor: "pointer" }}>← Back</button>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16, marginBottom: 16,
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: "#0ecb81", fontWeight: 700 }}>You: {you}</span>
          <span style={{ color: "#f6465d", fontWeight: 700 }}>CPU: {cpu}</span>
        </div>
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <div style={{
            width: 64, height: 64, margin: "0 auto 8px", borderRadius: 14,
            background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center",
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
        >{turn === "you" ? "Roll Dice" : "CPU thinking..."}</button>
      )}
    </div>
  );
}

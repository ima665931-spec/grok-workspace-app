import { useState, useEffect, useRef } from "react";
import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";

type Color = "green" | "red" | "violet";

const ROUND_SEC = 30;
const PAYOUT: Record<Color, number> = { green: 2, red: 2, violet: 4.5 };

function randomResult(): { color: Color; number: number } {
  const number = Math.floor(Math.random() * 10);
  // 0 = violet+red-ish, 5 = violet+green-ish in many apps; simplify:
  if (number === 0 || number === 5) return { color: "violet", number };
  if (number % 2 === 0) return { color: "red", number };
  return { color: "green", number };
}

export function WinGoGame() {
  const balance = useGame((s) => s.balance);
  const tryPlaceStake = useGame((s) => s.tryPlaceStake);
  const creditWin = useGame((s) => s.creditWin);
  const recordBet = useGame((s) => s.recordBet);

  const [seconds, setSeconds] = useState(ROUND_SEC);
  const [phase, setPhase] = useState<"betting" | "result">("betting");
  const [betAmount, setBetAmount] = useState(100);
  const [selected, setSelected] = useState<Color | null>(null);
  const [lockedBet, setLockedBet] = useState<{ color: Color; amount: number } | null>(null);
  const [lastResult, setLastResult] = useState<{ color: Color; number: number } | null>(null);
  const [history, setHistory] = useState<{ color: Color; number: number }[]>([]);
  const tickRef = useRef<number | null>(null);

  // Round clock
  useEffect(() => {
    tickRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          // end of betting → resolve
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // When timer hits 0, resolve round
  useEffect(() => {
    if (seconds !== 0 || phase !== "betting") return;

    setPhase("result");
    const result = randomResult();
    setLastResult(result);
    setHistory((h) => [result, ...h].slice(0, 12));

    if (lockedBet) {
      const won = lockedBet.color === result.color;
      const mult = PAYOUT[lockedBet.color];
      if (won) {
        const payout = Math.floor(lockedBet.amount * mult);
        creditWin(payout);
        recordBet("WinGo", lockedBet.amount, mult, true, result.color + " " + result.number);
      } else {
        recordBet("WinGo", lockedBet.amount, 0, false, result.color + " " + result.number);
      }
    }

    // Show result 4s then next round
    const t = setTimeout(() => {
      setLockedBet(null);
      setSelected(null);
      setPhase("betting");
      setSeconds(ROUND_SEC);
    }, 4000);
    return () => clearTimeout(t);
  }, [seconds, phase, lockedBet, creditWin, recordBet]);

  const placeColorBet = (color: Color) => {
    if (phase !== "betting" || seconds < 3) return;
    if (lockedBet) return; // one bet per round for simplicity
    if (!tryPlaceStake(betAmount)) return;
    setSelected(color);
    setLockedBet({ color, amount: betAmount });
  };

  const colorBtn = (color: Color, label: string, bg: string, border: string) => {
    const active = selected === color || lockedBet?.color === color;
    return (
      <button
        type="button"
        onClick={() => placeColorBet(color)}
        disabled={phase !== "betting" || seconds < 3 || !!lockedBet}
        style={{
          flex: 1,
          padding: "18px 8px",
          borderRadius: 14,
          border: active ? `2px solid ${border}` : "1px solid rgba(255,255,255,0.08)",
          background: active ? bg : "rgba(255,255,255,0.03)",
          color: "#fff",
          fontWeight: 800,
          fontSize: 15,
          cursor: phase === "betting" && seconds >= 3 && !lockedBet ? "pointer" : "not-allowed",
          opacity: phase !== "betting" || seconds < 3 ? 0.5 : 1,
        }}
      >
        <div>{label}</div>
        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85, marginTop: 4 }}>
          {PAYOUT[color]}x
        </div>
      </button>
    );
  };

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>WinGo</h2>
        <div style={{
          background: phase === "result" ? "rgba(240,185,11,0.15)" : "rgba(14,203,129,0.12)",
          border: `1px solid ${phase === "result" ? "rgba(240,185,11,0.3)" : "rgba(14,203,129,0.25)"}`,
          borderRadius: 20, padding: "6px 14px", fontWeight: 800, fontSize: 14,
          color: phase === "result" ? "#f0b90b" : "#0ecb81",
        }}>
          {phase === "result" ? "RESULT" : `${seconds}s`}
        </div>
      </div>

      {/* Result board */}
      <div style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
        borderRadius: 20, padding: 24, textAlign: "center", marginBottom: 16,
        border: "1px solid rgba(255,255,255,0.06)", minHeight: 120,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        {phase === "result" && lastResult ? (
          <>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", marginBottom: 10,
              background: lastResult.color === "green" ? "#0ecb81" : lastResult.color === "red" ? "#f6465d" : "#a855f7",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 900, color: "#fff",
              boxShadow: "0 0 30px rgba(255,255,255,0.15)",
            }}>
              {lastResult.number}
            </div>
            <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: 16 }}>
              {lastResult.color}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#f0b90b" }}>{seconds}</div>
            <div style={{ color: "#8b949e", fontSize: 13, marginTop: 4 }}>
              {lockedBet ? `Bet locked: ${lockedBet.color} ₹${lockedBet.amount}` : "Select a color to bet"}
            </div>
          </>
        )}
      </div>

      {/* Recent */}
      {history.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
          {history.map((h, i) => (
            <div key={i} style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: h.color === "green" ? "#0ecb81" : h.color === "red" ? "#f6465d" : "#a855f7",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "#fff",
            }}>{h.number}</div>
          ))}
        </div>
      )}

      {/* Color buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {colorBtn("green", "Green", "rgba(14,203,129,0.2)", "#0ecb81")}
        {colorBtn("violet", "Violet", "rgba(168,85,247,0.2)", "#a855f7")}
        {colorBtn("red", "Red", "rgba(246,70,93,0.2)", "#f6465d")}
      </div>

      {/* Amount */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[10, 50, 100, 500, 1000].map((v) => (
          <button
            key={v} type="button" onClick={() => setBetAmount(v)}
            disabled={!!lockedBet}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 10, fontWeight: 700, fontSize: 12,
              border: betAmount === v ? "1px solid #f0b90b" : "1px solid rgba(255,255,255,0.08)",
              background: betAmount === v ? "rgba(240,185,11,0.12)" : "rgba(255,255,255,0.03)",
              color: betAmount === v ? "#f0b90b" : "#e6edf3", cursor: "pointer",
            }}
          >{v}</button>
        ))}
      </div>

      <div style={{ color: "#6e7681", fontSize: 12, textAlign: "center" }}>
        Balance: ₹{formatCoins(balance)} · One bet per round
      </div>
    </div>
  );
}

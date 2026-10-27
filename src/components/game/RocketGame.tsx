import { useState, useEffect, useRef } from "react";
import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";

export function RocketGame() {
  const balance = useGame((s) => s.balance);
  const tryPlaceStake = useGame((s) => s.tryPlaceStake);
  const creditWin = useGame((s) => s.creditWin);
  const recordBet = useGame((s) => s.recordBet);

  const [betAmount, setBetAmount] = useState(100);
  const [multiplier, setMultiplier] = useState(1);
  const [status, setStatus] = useState<"idle" | "flying" | "crashed">("idle");
  const [cashedOut, setCashedOut] = useState(false);
  const [crashAt, setCrashAt] = useState(0);
  const cashedRef = useRef(false);
  const intervalRef = useRef<number | null>(null);
  const stakeRef = useRef(0);

  const start = () => {
    if (betAmount <= 0 || betAmount > balance) return;
    if (!tryPlaceStake(betAmount)) return;

    stakeRef.current = betAmount;
    setStatus("flying");
    setMultiplier(1);
    setCashedOut(false);
    cashedRef.current = false;

    const r = Math.random();
    const point = r < 0.5 ? 1.05 + Math.random() * 1.5 : 1.2 + Math.random() * 8;
    setCrashAt(Number(point.toFixed(2)));

    let current = 1;
    intervalRef.current = window.setInterval(() => {
      current += 0.012 + current * 0.015;
      const m = Number(current.toFixed(2));
      setMultiplier(m);
      if (m >= point) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setStatus("crashed");
        setMultiplier(point);
        if (!cashedRef.current) {
          recordBet("Rocket", stakeRef.current, 0, false, `Crashed @ ${point}x`);
        }
      }
    }, 50);
  };

  const cashOut = () => {
    if (status !== "flying" || cashedRef.current) return;
    cashedRef.current = true;
    setCashedOut(true);
    const payout = Math.floor(stakeRef.current * multiplier);
    creditWin(payout);
    recordBet("Rocket", stakeRef.current, multiplier, true, `Cashout @ ${multiplier}x`);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus("idle");
  };

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const heightPct = Math.min(85, (Math.log(multiplier) / Math.log(10)) * 55);

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px" }}>Rocket</h2>

      <div style={{
        background: "linear-gradient(180deg, #0d1b2a 0%, #0a0c10 100%)",
        borderRadius: 20, height: 220, marginBottom: 16,
        border: "1px solid rgba(255,255,255,0.06)",
        position: "relative", overflow: "hidden",
      }}>
        {/* sky glow */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: `${heightPct}%`,
          background: status === "crashed"
            ? "linear-gradient(to top, rgba(246,70,93,0.25), transparent)"
            : "linear-gradient(to top, rgba(14,203,129,0.2), transparent)",
          transition: "height 0.05s linear",
        }} />
        <div style={{
          position: "absolute",
          left: "50%",
          bottom: `${8 + heightPct * 0.85}%`,
          transform: "translateX(-50%)",
          fontSize: 36,
          transition: "bottom 0.05s linear",
        }}>
          {status === "crashed" ? "💥" : "🚀"}
        </div>
        <div style={{
          position: "absolute", top: 24, left: 0, right: 0, textAlign: "center",
          fontSize: 48, fontWeight: 900,
          color: status === "crashed" ? "#f6465d" : "#0ecb81",
          textShadow: status === "crashed" ? "0 0 24px rgba(246,70,93,0.5)" : "0 0 24px rgba(14,203,129,0.4)",
        }}>
          {multiplier.toFixed(2)}x
        </div>
        <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center", color: "#8b949e", fontSize: 12 }}>
          {status === "idle" && "Place bet & launch"}
          {status === "flying" && (cashedOut ? "Cashed out!" : "Flying... cash out!")}
          {status === "crashed" && `Crashed at ${crashAt.toFixed(2)}x`}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[100, 500, 1000, 2000].map((v) => (
          <button key={v} type="button" onClick={() => setBetAmount(v)}
            disabled={status === "flying"}
            style={{
              flex: 1, padding: 11, borderRadius: 12, fontWeight: 700, fontSize: 13,
              border: betAmount === v ? "1px solid #f0b90b" : "1px solid rgba(255,255,255,0.08)",
              background: betAmount === v ? "rgba(240,185,11,0.12)" : "rgba(255,255,255,0.03)",
              color: betAmount === v ? "#f0b90b" : "#e6edf3", cursor: "pointer",
            }}>{v}</button>
        ))}
      </div>

      <input type="number" value={betAmount} disabled={status === "flying"}
        onChange={(e) => setBetAmount(Number(e.target.value))}
        style={{
          width: "100%", padding: "14px 16px", borderRadius: 12, marginBottom: 14,
          border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
          color: "#e6edf3", fontSize: 16, fontWeight: 600, outline: "none",
        }}
      />

      {status === "idle" || status === "crashed" ? (
        <button type="button" onClick={start}
          disabled={betAmount <= 0 || betAmount > balance}
          style={{
            width: "100%", padding: 16, borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #0ecb81, #0ba86a)",
            color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer",
            boxShadow: "0 4px 20px rgba(14,203,129,0.3)",
          }}
        >Launch · ₹{formatCoins(betAmount)}</button>
      ) : (
        <button type="button" onClick={cashOut} disabled={cashedOut}
          style={{
            width: "100%", padding: 16, borderRadius: 14, border: "none",
            background: cashedOut ? "#21262d" : "linear-gradient(135deg, #f0b90b, #e5a800)",
            color: cashedOut ? "#6e7681" : "#0a0c10", fontWeight: 800, fontSize: 16,
            cursor: cashedOut ? "not-allowed" : "pointer",
            boxShadow: cashedOut ? "none" : "0 4px 20px rgba(240,185,11,0.35)",
          }}
        >
          {cashedOut ? "Cashed Out" : `Cash Out ₹${formatCoins(Math.floor(betAmount * multiplier))}`}
        </button>
      )}
    </div>
  );
}

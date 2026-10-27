import { useState, useEffect, useRef } from "react";
import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";

export function CrashGame() {
  const balance = useGame((s) => s.balance);
  const placeBet = useGame((s) => s.placeBet);

  const [betAmount, setBetAmount] = useState(100);
  const [multiplier, setMultiplier] = useState(1);
  const [status, setStatus] = useState<"waiting" | "running" | "crashed">("waiting");
  const [cashedOut, setCashedOut] = useState(false);
  const [crashPoint, setCrashPoint] = useState(0);
  const cashedOutRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

  const startRound = () => {
    if (betAmount <= 0 || betAmount > balance) return;

    setStatus("running");
    setMultiplier(1);
    setCashedOut(false);
    cashedOutRef.current = false;

    const r = Math.random();
    const point = r < 0.55 ? 1 + Math.random() * 1.8 : 1 + Math.random() * 9;
    setCrashPoint(Number(point.toFixed(2)));

    let current = 1;
    intervalRef.current = window.setInterval(() => {
      current += 0.01 + current * 0.014;
      const m = Number(current.toFixed(2));
      setMultiplier(m);

      if (m >= point) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setStatus("crashed");
        setMultiplier(point);
        if (!cashedOutRef.current) {
          placeBet("Crash", betAmount, 0, false);
        }
      }
    }, 50);
  };

  const cashOut = () => {
    if (status !== "running" || cashedOutRef.current) return;
    cashedOutRef.current = true;
    setCashedOut(true);
    placeBet("Crash", betAmount, multiplier, true);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStatus("waiting");
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const isGreen = status !== "crashed";

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 16px", letterSpacing: "-0.02em" }}>Crash</h2>

      {/* Multiplier Display */}
      <div style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
        borderRadius: 20,
        height: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        border: `1px solid ${status === "crashed" ? "rgba(246,70,93,0.3)" : "rgba(14,203,129,0.15)"}`,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.12,
          background: status === "crashed"
            ? "radial-gradient(circle at center, #f6465d, transparent 70%)"
            : "radial-gradient(circle at center, #0ecb81, transparent 70%)",
        }} />
        <div style={{
          fontSize: 64,
          fontWeight: 900,
          color: isGreen ? "#0ecb81" : "#f6465d",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.04em",
          textShadow: isGreen ? "0 0 40px rgba(14,203,129,0.4)" : "0 0 40px rgba(246,70,93,0.4)",
          position: "relative",
        }}>
          {multiplier.toFixed(2)}x
        </div>
        <div style={{ color: "#8b949e", fontSize: 13, marginTop: 6, fontWeight: 500, position: "relative" }}>
          {status === "waiting" && "Place your bet"}
          {status === "running" && (cashedOut ? "Cashed out!" : "Running...")}
          {status === "crashed" && `Crashed at ${crashPoint.toFixed(2)}x`}
        </div>
      </div>

      {/* Amount chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[100, 500, 1000, 2000].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setBetAmount(v)}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 12,
              border: betAmount === v ? "1px solid #f0b90b" : "1px solid rgba(255,255,255,0.08)",
              background: betAmount === v ? "rgba(240,185,11,0.12)" : "rgba(255,255,255,0.03)",
              color: betAmount === v ? "#f0b90b" : "#e6edf3",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {v}
          </button>
        ))}
      </div>

      <input
        type="number"
        value={betAmount}
        onChange={(e) => setBetAmount(Number(e.target.value))}
        style={{
          width: "100%",
          padding: "14px 16px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          color: "#e6edf3",
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 14,
          outline: "none",
        }}
      />

      {status === "waiting" || status === "crashed" ? (
        <button
          type="button"
          onClick={startRound}
          disabled={betAmount <= 0 || betAmount > balance}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 14,
            border: "none",
            background: betAmount > balance ? "#21262d" : "linear-gradient(135deg, #0ecb81, #0ba86a)",
            color: betAmount > balance ? "#6e7681" : "#fff",
            fontWeight: 800,
            fontSize: 16,
            cursor: betAmount > balance ? "not-allowed" : "pointer",
            boxShadow: betAmount > balance ? "none" : "0 4px 20px rgba(14,203,129,0.3)",
          }}
        >
          Bet ₹{formatCoins(betAmount)}
        </button>
      ) : (
        <button
          type="button"
          onClick={cashOut}
          disabled={cashedOut}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 14,
            border: "none",
            background: cashedOut ? "#21262d" : "linear-gradient(135deg, #f0b90b, #e5a800)",
            color: cashedOut ? "#6e7681" : "#0a0c10",
            fontWeight: 800,
            fontSize: 16,
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

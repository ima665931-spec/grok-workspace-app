import { useState, useEffect, useRef } from "react";
import { useGame } from "@/game/store";
import { formatCoins } from "@/game/logic";

export function CrashGame() {
  const balance = useGame((s) => s.balance);
  const placeBet = useGame((s) => s.placeBet);

  const [betAmount, setBetAmount] = useState(100);
  const [multiplier, setMultiplier] = useState(1);
  const [status, setStatus] = useState<"waiting" | "running" | "crashed">("waiting");
  const [cashedOut, setCashedOut] = useState(false);
  const [crashPoint, setCrashPoint] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const startRound = () => {
    if (betAmount <= 0 || betAmount > balance) return;

    setStatus("running");
    setMultiplier(1);
    setCashedOut(false);

    // Random crash between 1.00x - 10x (weighted towards lower)
    const r = Math.random();
    const point = r < 0.5 ? 1 + Math.random() * 1.5 : 1 + Math.random() * 8;
    setCrashPoint(Number(point.toFixed(2)));

    let current = 1;
    intervalRef.current = window.setInterval(() => {
      current += 0.01 + current * 0.012;
      const m = Number(current.toFixed(2));
      setMultiplier(m);

      if (m >= point) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setStatus("crashed");
        setMultiplier(point);
        // If not cashed out → lose
        if (!cashedOut) {
          placeBet("Crash", betAmount, 0, false);
        }
      }
    }, 50);
  };

  const cashOut = () => {
    if (status !== "running" || cashedOut) return;
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

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>📈 Crash</h2>

      {/* Multiplier Display */}
      <div style={{
        background: "#1e2329",
        borderRadius: 16,
        height: 180,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        border: "1px solid #2b3139"
      }}>
        <div style={{
          fontSize: 56,
          fontWeight: 900,
          color: status === "crashed" ? "#f6465d" : "#0ecb81",
          fontVariantNumeric: "tabular-nums"
        }}>
          {multiplier.toFixed(2)}x
        </div>
        <div style={{ color: "#848e9c", fontSize: 13, marginTop: 4 }}>
          {status === "waiting" && "Place your bet"}
          {status === "running" && (cashedOut ? "Cashed out!" : "Running...")}
          {status === "crashed" && `Crashed at ${crashPoint.toFixed(2)}x`}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[100, 500, 1000, 2000].map((v) => (
          <button
            key={v}
            onClick={() => setBetAmount(v)}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              border: betAmount === v ? "1px solid #f0b90b" : "1px solid #2b3139",
              background: betAmount === v ? "rgba(240,185,11,0.15)" : "#1e2329",
              color: "#eaecef",
              fontWeight: 600,
              cursor: "pointer"
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
          padding: "14px",
          borderRadius: 10,
          border: "1px solid #2b3139",
          background: "#1e2329",
          color: "#eaecef",
          fontSize: 16,
          marginBottom: 12,
          boxSizing: "border-box"
        }}
      />

      {status === "waiting" || status === "crashed" ? (
        <button
          onClick={startRound}
          disabled={betAmount <= 0 || betAmount > balance}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 12,
            border: "none",
            background: betAmount > balance ? "#2b3139" : "#0ecb81",
            color: "#000",
            fontWeight: 700,
            fontSize: 16,
            cursor: betAmount > balance ? "not-allowed" : "pointer"
          }}
        >
          Bet ₹{formatCoins(betAmount)}
        </button>
      ) : (
        <button
          onClick={cashOut}
          disabled={cashedOut}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 12,
            border: "none",
            background: cashedOut ? "#2b3139" : "#f0b90b",
            color: "#000",
            fontWeight: 700,
            fontSize: 16,
            cursor: cashedOut ? "not-allowed" : "pointer"
          }}
        >
          {cashedOut ? "Cashed Out" : `Cash Out ₹${formatCoins(Math.floor(betAmount * multiplier))}`}
        </button>
      )}
    </div>
  );
}

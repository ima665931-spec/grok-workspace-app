import { useState, useEffect, useRef } from "react";
import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";

const CARS = [
  { id: 0, name: "Red Bolt", emoji: "🏎️", color: "#f6465d" },
  { id: 1, name: "Blue Flash", emoji: "🚙", color: "#3b82f6" },
  { id: 2, name: "Green Max", emoji: "🏎️", color: "#0ecb81" },
  { id: 3, name: "Gold Rush", emoji: "🏁", color: "#f0b90b" },
];

export function CarRaceGame() {
  const balance = useGame((s) => s.balance);
  const tryPlaceStake = useGame((s) => s.tryPlaceStake);
  const creditWin = useGame((s) => s.creditWin);
  const recordBet = useGame((s) => s.recordBet);

  const [betAmount, setBetAmount] = useState(100);
  const [pick, setPick] = useState(0);
  const [status, setStatus] = useState<"idle" | "racing" | "done">("idle");
  const [progress, setProgress] = useState([0, 0, 0, 0]);
  const [winner, setWinner] = useState<number | null>(null);
  const stakeRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const startRace = () => {
    if (betAmount <= 0 || betAmount > balance) return;
    if (!tryPlaceStake(betAmount)) return;
    stakeRef.current = betAmount;
    setStatus("racing");
    setProgress([0, 0, 0, 0]);
    setWinner(null);

    // Random speeds — one will finish first
    const speeds = CARS.map(() => 0.4 + Math.random() * 0.9);
    let p = [0, 0, 0, 0];

    const tick = () => {
      p = p.map((v, i) => Math.min(100, v + speeds[i] * (0.8 + Math.random() * 0.5)));
      setProgress([...p]);
      const done = p.findIndex((v) => v >= 100);
      if (done >= 0) {
        setWinner(done);
        setStatus("done");
        const won = done === pick;
        if (won) {
          const payout = Math.floor(stakeRef.current * 3.5);
          creditWin(payout);
          recordBet("CarRace", stakeRef.current, 3.5, true, CARS[done].name);
        } else {
          recordBet("CarRace", stakeRef.current, 0, false, CARS[done].name);
        }
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>Car Race</h2>
      <p style={{ color: "#6e7681", fontSize: 12, margin: "0 0 16px" }}>Pick a car · Winner pays 3.5x</p>

      <div style={{
        background: "linear-gradient(180deg, #0d1b2a, #0a0c10)",
        borderRadius: 16, padding: 14, marginBottom: 16,
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        {CARS.map((car, i) => (
          <div key={car.id} style={{ marginBottom: i < 3 ? 12 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4, color: "#8b949e" }}>
              <span style={{ color: car.color, fontWeight: 700 }}>{car.emoji} {car.name}</span>
              {winner === i && <span style={{ color: "#f0b90b", fontWeight: 800 }}>WINNER</span>}
            </div>
            <div style={{ height: 22, background: "rgba(255,255,255,0.06)", borderRadius: 8, position: "relative", overflow: "hidden" }}>
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${progress[i]}%`,
                background: `linear-gradient(90deg, ${car.color}55, ${car.color})`,
                borderRadius: 8,
                transition: status === "racing" ? "none" : "width 0.2s",
              }} />
              <span style={{
                position: "absolute",
                left: `calc(${Math.min(progress[i], 92)}% - 4px)`,
                top: 1,
                fontSize: 14,
              }}>{car.emoji}</span>
            </div>
          </div>
        ))}
      </div>

      {status !== "racing" && (
        <>
          <div style={{ fontSize: 13, color: "#8b949e", marginBottom: 8, fontWeight: 600 }}>Select your car</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
            {CARS.map((car) => (
              <button key={car.id} type="button" onClick={() => setPick(car.id)}
                disabled={status === "racing"}
                style={{
                  padding: 12, borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer",
                  border: pick === car.id ? `1px solid ${car.color}` : "1px solid rgba(255,255,255,0.08)",
                  background: pick === car.id ? `${car.color}22` : "rgba(255,255,255,0.03)",
                  color: pick === car.id ? car.color : "#e6edf3",
                }}
              >{car.emoji} {car.name}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[100, 500, 1000, 2000].map((v) => (
              <button key={v} type="button" onClick={() => setBetAmount(v)}
                style={{
                  flex: 1, padding: 10, borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: "pointer",
                  border: betAmount === v ? "1px solid #f0b90b" : "1px solid rgba(255,255,255,0.08)",
                  background: betAmount === v ? "rgba(240,185,11,0.12)" : "rgba(255,255,255,0.03)",
                  color: betAmount === v ? "#f0b90b" : "#e6edf3",
                }}>{v}</button>
            ))}
          </div>

          <button type="button" onClick={startRace} disabled={betAmount > balance}
            style={{
              width: "100%", padding: 16, borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #f6465d, #e11d48)", color: "#fff",
              fontWeight: 800, fontSize: 16, cursor: "pointer",
            }}
          >{status === "done" ? "Race Again" : "Start Race"} · ₹{formatCoins(betAmount)}</button>

          {status === "done" && winner !== null && (
            <div style={{
              marginTop: 12, textAlign: "center", fontWeight: 700, fontSize: 14,
              color: winner === pick ? "#0ecb81" : "#f6465d",
            }}>
              {winner === pick ? `You won! +₹${formatCoins(Math.floor(stakeRef.current * 3.5))}` : `${CARS[winner].name} won — better luck`}
            </div>
          )}
        </>
      )}

      {status === "racing" && (
        <div style={{ textAlign: "center", color: "#f0b90b", fontWeight: 700, padding: 16 }}>
          Racing...
        </div>
      )}
    </div>
  );
}

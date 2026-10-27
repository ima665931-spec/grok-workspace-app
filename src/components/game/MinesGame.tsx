import { useState } from "react";
import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";

const GRID = 25;

export function MinesGame() {
  const balance = useGame((s) => s.balance);
  const tryPlaceStake = useGame((s) => s.tryPlaceStake);
  const creditWin = useGame((s) => s.creditWin);
  const recordBet = useGame((s) => s.recordBet);

  const [betAmount, setBetAmount] = useState(100);
  const [minesCount, setMinesCount] = useState(3);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [stake, setStake] = useState(0);

  const safeTiles = GRID - minesCount;
  const multiplier = Number((Math.pow(1.08, revealed.length) * (1 + minesCount * 0.15)).toFixed(2));

  const startGame = () => {
    if (betAmount <= 0 || betAmount > balance) return;
    if (!tryPlaceStake(betAmount)) return;
    setStake(betAmount);
    const positions: number[] = [];
    while (positions.length < minesCount) {
      const p = Math.floor(Math.random() * GRID);
      if (!positions.includes(p)) positions.push(p);
    }
    setMinePositions(positions);
    setRevealed([]);
    setGameOver(false);
    setStarted(true);
  };

  const reveal = (index: number) => {
    if (!started || gameOver || revealed.includes(index)) return;
    if (minePositions.includes(index)) {
      setRevealed([...revealed, index]);
      setGameOver(true);
      setStarted(false);
      recordBet("Mines", stake, 0, false);
    } else {
      const newRevealed = [...revealed, index];
      setRevealed(newRevealed);
      if (newRevealed.length === safeTiles) {
        setGameOver(true);
        setStarted(false);
        const payout = Math.floor(stake * multiplier);
        creditWin(payout);
        recordBet("Mines", stake, multiplier, true);
      }
    }
  };

  const cashOut = () => {
    if (!started || revealed.length === 0) return;
    setGameOver(true);
    setStarted(false);
    const payout = Math.floor(stake * multiplier);
    creditWin(payout);
    recordBet("Mines", stake, multiplier, true);
  };

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 14px" }}>Mines</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[1, 3, 5, 10].map((n) => (
          <button key={n} type="button" onClick={() => !started && setMinesCount(n)}
            style={{
              flex: 1, padding: 10, borderRadius: 10, fontWeight: 700, fontSize: 12,
              cursor: started ? "not-allowed" : "pointer",
              border: minesCount === n ? "1px solid #f0b90b" : "1px solid rgba(255,255,255,0.08)",
              background: minesCount === n ? "rgba(240,185,11,0.12)" : "rgba(255,255,255,0.03)",
              color: minesCount === n ? "#f0b90b" : "#e6edf3",
            }}>{n} Mines</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 14 }}>
        {Array.from({ length: GRID }).map((_, i) => {
          const isRevealed = revealed.includes(i);
          const isMine = minePositions.includes(i);
          const showMine = (gameOver || isRevealed) && isMine;
          return (
            <button key={i} type="button" onClick={() => reveal(i)}
              style={{
                aspectRatio: "1", borderRadius: 10, border: "none", fontSize: 16,
                background: showMine ? "linear-gradient(135deg, #f6465d, #d93a4e)"
                  : isRevealed ? "linear-gradient(135deg, #0ecb81, #0ba86a)"
                  : "rgba(255,255,255,0.04)",
                color: "#fff",
                cursor: started && !isRevealed ? "pointer" : "default",
              }}
            >{showMine ? "💣" : isRevealed ? "💎" : ""}</button>
          );
        })}
      </div>

      <div style={{ textAlign: "center", marginBottom: 14, fontSize: 13, color: "#8b949e" }}>
        Multiplier: <span style={{ color: "#f0b90b", fontWeight: 800 }}>{multiplier}x</span>
        {revealed.length > 0 && ` · Safe: ${revealed.length}`}
      </div>

      {!started ? (
        <>
          <input type="number" value={betAmount} onChange={(e) => setBetAmount(Number(e.target.value))}
            style={{
              width: "100%", padding: "14px 16px", borderRadius: 12, marginBottom: 12,
              border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
              color: "#e6edf3", fontSize: 16, fontWeight: 600, outline: "none",
            }}
          />
          <button type="button" onClick={startGame} disabled={betAmount <= 0 || betAmount > balance}
            style={{
              width: "100%", padding: 16, borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #0ecb81, #0ba86a)", color: "#fff",
              fontWeight: 800, fontSize: 16, cursor: "pointer",
            }}
          >Start · ₹{formatCoins(betAmount)}</button>
        </>
      ) : (
        <button type="button" onClick={cashOut} disabled={revealed.length === 0}
          style={{
            width: "100%", padding: 16, borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #f0b90b, #e5a800)", color: "#0a0c10",
            fontWeight: 800, fontSize: 16, cursor: "pointer",
          }}
        >Cash Out ₹{formatCoins(Math.floor(stake * multiplier))}</button>
      )}
    </div>
  );
}

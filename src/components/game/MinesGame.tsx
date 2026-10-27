import { useState } from "react";
import { useGame } from "@/game/store";
import { formatCoins } from "@/game/logic";

const GRID = 25; // 5x5

export function MinesGame() {
  const balance = useGame((s) => s.balance);
  const placeBet = useGame((s) => s.placeBet);

  const [betAmount, setBetAmount] = useState(100);
  const [minesCount, setMinesCount] = useState(3);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);

  const safeTiles = GRID - minesCount;
  const multiplier = Number((Math.pow(1.08, revealed.length) * (1 + minesCount * 0.15)).toFixed(2));

  const startGame = () => {
    if (betAmount <= 0 || betAmount > balance) return;
    const positions: number[] = [];
    while (positions.length < minesCount) {
      const p = Math.floor(Math.random() * GRID);
      if (!positions.includes(p)) positions.push(p);
    }
    setMinePositions(positions);
    setRevealed([]);
    setGameOver(false);
    setWon(false);
    setStarted(true);
  };

  const reveal = (index: number) => {
    if (!started || gameOver || revealed.includes(index)) return;

    if (minePositions.includes(index)) {
      // Hit mine
      setRevealed([...revealed, index]);
      setGameOver(true);
      setStarted(false);
      placeBet("Mines", betAmount, 0, false);
    } else {
      const newRevealed = [...revealed, index];
      setRevealed(newRevealed);
      if (newRevealed.length === safeTiles) {
        // Cleared all
        setWon(true);
        setGameOver(true);
        setStarted(false);
        placeBet("Mines", betAmount, multiplier, true);
      }
    }
  };

  const cashOut = () => {
    if (!started || revealed.length === 0) return;
    setWon(true);
    setGameOver(true);
    setStarted(false);
    placeBet("Mines", betAmount, multiplier, true);
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>💣 Mines</h2>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[1, 3, 5, 10].map((n) => (
          <button
            key={n}
            onClick={() => !started && setMinesCount(n)}
            style={{
              flex: 1, padding: 10, borderRadius: 8,
              border: minesCount === n ? "1px solid #f0b90b" : "1px solid #2b3139",
              background: minesCount === n ? "rgba(240,185,11,0.15)" : "#1e2329",
              color: "#eaecef", fontWeight: 600, cursor: started ? "not-allowed" : "pointer"
            }}
          >
            {n} Mines
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 6,
        marginBottom: 16
      }}>
        {Array.from({ length: GRID }).map((_, i) => {
          const isRevealed = revealed.includes(i);
          const isMine = minePositions.includes(i);
          const showMine = (gameOver || isRevealed) && isMine;

          return (
            <button
              key={i}
              onClick={() => reveal(i)}
              style={{
                aspectRatio: "1",
                borderRadius: 8,
                border: "none",
                background: showMine ? "#f6465d" : isRevealed ? "#0ecb81" : "#1e2329",
                color: "#fff",
                fontSize: 18,
                cursor: started && !isRevealed ? "pointer" : "default"
              }}
            >
              {showMine ? "💣" : isRevealed ? "💎" : ""}
            </button>
          );
        })}
      </div>

      <div style={{ textAlign: "center", marginBottom: 12, color: "#848e9c", fontSize: 13 }}>
        Multiplier: <span style={{ color: "#f0b90b", fontWeight: 700 }}>{multiplier}x</span>
        {revealed.length > 0 && ` • Safe: ${revealed.length}`}
      </div>

      {!started ? (
        <>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            style={{
              width: "100%", padding: 14, borderRadius: 10, border: "1px solid #2b3139",
              background: "#1e2329", color: "#eaecef", fontSize: 16, marginBottom: 12, boxSizing: "border-box"
            }}
          />
          <button
            onClick={startGame}
            disabled={betAmount <= 0 || betAmount > balance}
            style={{
              width: "100%", padding: 16, borderRadius: 12, border: "none",
              background: "#0ecb81", color: "#000", fontWeight: 700, fontSize: 16, cursor: "pointer"
            }}
          >
            Start Game • ₹{formatCoins(betAmount)}
          </button>
        </>
      ) : (
        <button
          onClick={cashOut}
          disabled={revealed.length === 0}
          style={{
            width: "100%", padding: 16, borderRadius: 12, border: "none",
            background: "#f0b90b", color: "#000", fontWeight: 700, fontSize: 16, cursor: "pointer"
          }}
        >
          Cash Out ₹{formatCoins(Math.floor(betAmount * multiplier))}
        </button>
      )}
    </div>
  );
}

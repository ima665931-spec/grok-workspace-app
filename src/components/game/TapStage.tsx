import { useGame } from "@/game/store";
import { formatCoins } from "@/game/logic";

export function TapStage() {
  const coins = useGame((s) => s.coins);
  const tapPower = useGame((s) => s.tapPower);
  const tap = useGame((s) => s.tap);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 16px", gap: 32 }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#a1a1aa", fontSize: 13, margin: "0 0 4px" }}>Your coins</p>
        <p style={{ fontSize: 48, fontWeight: 900, margin: 0, color: "#facc15", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
          {formatCoins(coins)}
        </p>
        <p style={{ color: "#71717a", fontSize: 12, margin: "6px 0 0" }}>+{tapPower} per tap</p>
      </div>

      <button
        onClick={tap}
        style={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "linear-gradient(180deg, #facc15 0%, #eab308 100%)",
          color: "#000",
          fontSize: 28,
          fontWeight: 900,
          boxShadow: "0 12px 40px rgba(250,204,21,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          userSelect: "none",
          WebkitUserSelect: "none",
          transition: "transform 0.1s",
        }}
        onTouchStart={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)"; }}
        onTouchEnd={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.92)"; }}
        onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      >
        TAP
      </button>

      <p style={{ color: "#71717a", fontSize: 13, textAlign: "center", maxWidth: 240, margin: 0 }}>
        Keep tapping to earn coins and level up!
      </p>
    </div>
  );
}

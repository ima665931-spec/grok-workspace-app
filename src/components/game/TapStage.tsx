import { useGame } from "@/game/store";
import { formatCoins } from "@/game/logic";

export function TapStage() {
  const coins = useGame((s) => s.coins);
  const tapPower = useGame((s) => s.tapPower);
  const tap = useGame((s) => s.tap);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 gap-8">
      <div className="text-center space-y-1">
        <p className="text-muted-foreground text-sm">Your coins</p>
        <p className="text-5xl font-black tabular-nums tracking-tight text-yellow-400">
          {formatCoins(coins)}
        </p>
        <p className="text-xs text-muted-foreground">+{tapPower} per tap</p>
      </div>

      <button
        onClick={tap}
        className="relative w-48 h-48 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 shadow-2xl shadow-yellow-500/30 active:scale-95 transition-transform flex items-center justify-center text-black font-black text-3xl select-none touch-manipulation"
      >
        TAP
      </button>

      <p className="text-muted-foreground text-sm text-center max-w-[240px]">
        Keep tapping to earn coins and level up!
      </p>
    </div>
  );
}

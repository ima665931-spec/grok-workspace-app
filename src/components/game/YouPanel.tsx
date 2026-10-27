import { useGame } from "@/game/store";
import { formatCoins, levelOf } from "@/game/logic";

export function YouPanel() {
  const coins = useGame((s) => s.coins);
  const gems = useGame((s) => s.gems);
  const xp = useGame((s) => s.xp);
  const prestige = useGame((s) => s.prestige);
  const level = levelOf(xp);

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-1">
        <div className="text-5xl">👤</div>
        <h2 className="text-xl font-bold">Player</h2>
        <p className="text-muted-foreground text-sm">Level {level}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">Coins</p>
          <p className="text-2xl font-bold text-yellow-400">{formatCoins(coins)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">Gems</p>
          <p className="text-2xl font-bold text-cyan-400">{gems}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">XP</p>
          <p className="text-2xl font-bold">{formatCoins(xp)}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground">Prestige</p>
          <p className="text-2xl font-bold">{prestige}</p>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { useGame } from "@/game/store";

export function GameApp() {
  const tab = useGame((s) => s.tab);
  const booted = useGame((s) => s.booted);

  useEffect(() => {
    if (!booted) useGame.getState().finishLoad();
  }, [booted]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4">Tap Rush Game</h1>
      <p className="text-lg">Tab: {tab}</p>
      <p className="mt-4 text-sm opacity-70">Full game loading... (source push in progress)</p>
    </div>
  );
}

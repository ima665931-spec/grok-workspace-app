import { useAuth } from "./game/auth";
import { Landing } from "./components/Landing";
import { GameApp } from "./components/game/GameApp";

export default function App() {
  const user = useAuth((s) => s.user);

  if (!user) {
    return <Landing />;
  }

  return <GameApp />;
}

import { useGame } from "@/game/store";
import { formatCoins } from "@/game/logic";
import { History } from "lucide-react";

type Tab = "lobby" | "crash" | "dice" | "mines" | "coinflip" | "wallet" | "history" | "profile";

export function WalletPanel({ onNavigate }: { onNavigate?: (tab: Tab) => void }) {
  const balance = useGame((s) => s.balance);
  const addBalance = useGame((s) => s.addBalance);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Wallet</h2>

      <div style={{
        background: "linear-gradient(135deg, #1e2329, #2b3139)",
        borderRadius: 16,
        padding: 24,
        textAlign: "center",
        marginBottom: 24,
        border: "1px solid #3a4149"
      }}>
        <div style={{ color: "#848e9c", fontSize: 13, marginBottom: 6 }}>Available Balance</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: "#f0b90b" }}>
          ₹{formatCoins(balance)}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[500, 1000, 2000, 5000].map((amt) => (
          <button
            key={amt}
            onClick={() => addBalance(amt)}
            style={{
              padding: 16,
              borderRadius: 12,
              border: "1px solid #2b3139",
              background: "#1e2329",
              color: "#eaecef",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            + ₹{amt}
          </button>
        ))}
      </div>

      {onNavigate && (
        <button
          onClick={() => onNavigate("history")}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "1px solid #2b3139",
            background: "#1e2329",
            color: "#eaecef",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8
          }}
        >
          <History size={18} /> View Bet History
        </button>
      )}

      <p style={{ color: "#848e9c", fontSize: 12, textAlign: "center", marginTop: 20 }}>
        Demo wallet — no real money
      </p>
    </div>
  );
}

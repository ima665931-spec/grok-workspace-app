import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";
import { History, Plus } from "lucide-react";

type Tab = "lobby" | "crash" | "dice" | "mines" | "coinflip" | "wallet" | "history" | "profile";

export function WalletPanel({ onNavigate }: { onNavigate?: (tab: Tab) => void }) {
  const balance = useGame((s) => s.balance);
  const addBalance = useGame((s) => s.addBalance);

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 20px", letterSpacing: "-0.02em" }}>Wallet</h2>

      <div style={{
        background: "linear-gradient(135deg, rgba(240,185,11,0.15), rgba(240,185,11,0.03))",
        borderRadius: 20, padding: 28, textAlign: "center", marginBottom: 24,
        border: "1px solid rgba(240,185,11,0.2)",
      }}>
        <div style={{ color: "#8b949e", fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Available Balance</div>
        <div style={{ fontSize: 40, fontWeight: 900, color: "#f0b90b", letterSpacing: "-0.03em" }}>
          ₹{formatCoins(balance)}
        </div>
      </div>

      <div style={{ fontSize: 13, color: "#8b949e", marginBottom: 10, fontWeight: 600 }}>Quick Add (Demo)</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[500, 1000, 2000, 5000].map((amt) => (
          <button
            key={amt} type="button" onClick={() => addBalance(amt)}
            style={{
              padding: 16, borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
              color: "#e6edf3", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Plus size={16} color="#0ecb81" /> ₹{amt}
          </button>
        ))}
      </div>

      {onNavigate && (
        <button
          type="button" onClick={() => onNavigate("history")}
          style={{
            width: "100%", padding: 14, borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)",
            color: "#e6edf3", fontWeight: 600, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <History size={18} /> View Bet History
        </button>
      )}

      <p style={{ color: "#6e7681", fontSize: 12, textAlign: "center", marginTop: 20 }}>
        Demo wallet — no real money involved
      </p>
    </div>
  );
}

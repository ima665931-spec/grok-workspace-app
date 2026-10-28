import { useState } from "react";
import { useAuth } from "../game/auth";

type Mode = "home" | "login" | "register";

export function Landing() {
  const login = useAuth((s) => s.login);
  const register = useAuth((s) => s.register);
  const [mode, setMode] = useState<Mode>("home");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setError("");
    setLoading(true);
    setTimeout(() => {
      const res =
        mode === "login"
          ? login(phone, password)
          : register(phone, password, name);
      if (!res.ok) setError(res.error || "Failed");
      setLoading(false);
    }, 400);
  };

  if (mode === "login" || mode === "register") {
    return (
      <div style={page}>
        <div style={card}>
          <button type="button" onClick={() => { setMode("home"); setError(""); }} style={backBtn}>
            ← Back
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 4px" }}>
            {mode === "login" ? "Login" : "Create Account"}
          </h1>
          <p style={{ color: "#8b949e", fontSize: 13, marginBottom: 20 }}>
            Demo only · no real OTP / money
          </p>

          {mode === "register" && (
            <input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={input}
            />
          )}
          <input
            placeholder="Mobile number"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={input}
          />
          <input
            type="password"
            placeholder="Password (min 4)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
          />

          {error && (
            <div style={{ color: "#f6465d", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <button type="button" onClick={submit} disabled={loading} style={primary}>
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Register & Play"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            style={linkBtn}
          >
            {mode === "login" ? "New user? Register" : "Already have account? Login"}
          </button>

          {mode === "login" && (
            <div style={{
              marginTop: 20, padding: 12, borderRadius: 12,
              background: "rgba(240,185,11,0.08)", border: "1px solid rgba(240,185,11,0.2)",
              fontSize: 12, color: "#8b949e", lineHeight: 1.5,
            }}>
              <b style={{ color: "#f0b90b" }}>Quick demo:</b><br />
              Mobile: 9999999999<br />
              Password: demo123
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(180deg, #e11d48 0%, #be123c 50%, #0a0c10 100%)",
        padding: "28px 20px 40px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.15)", borderRadius: 20,
          padding: "6px 14px", marginBottom: 20, fontWeight: 800, fontSize: 14,
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: "50%", background: "#fff",
            color: "#e11d48", display: "inline-flex", alignItems: "center",
            justifyContent: "center", fontSize: 12, fontWeight: 900,
          }}>B</span>
          BetRush
        </div>

        <div style={{
          width: 100, height: 100, margin: "0 auto 16px", borderRadius: 24,
          background: "linear-gradient(135deg, #f0b90b, #fcd535)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40, fontWeight: 900, color: "#0a0c10",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}>B</div>

        <h1 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 8px", letterSpacing: "-0.03em" }}>
          BetRush Club
        </h1>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, margin: "0 0 8px", fontWeight: 600 }}>
          WinGo · Rocket · Ludo · Mines & more
        </p>
        <p style={{
          color: "#fcd535", fontSize: 15, fontWeight: 800, margin: "0 0 24px",
        }}>
          ₹10,000 demo balance on signup
        </p>

        <button type="button" onClick={() => setMode("register")} style={{
          ...primary,
          background: "#fff", color: "#e11d48", marginBottom: 10,
        }}>
          Sign Up — Free
        </button>
        <button type="button" onClick={() => setMode("login")} style={{
          ...primary,
          background: "rgba(255,255,255,0.15)", color: "#fff",
          border: "1px solid rgba(255,255,255,0.25)",
          marginBottom: 10,
        }}>
          Login
        </button>
        <button
          type="button"
          onClick={() => alert("APK coming soon. Meanwhile open this site on phone & Add to Home Screen.")}
          style={{
            ...primary,
            background: "transparent",
            color: "#fff",
            border: "1px dashed rgba(255,255,255,0.35)",
            fontSize: 14,
          }}
        >
          Download APK (Soon)
        </button>
      </div>

      {/* Features */}
      <div style={{ padding: "28px 20px", maxWidth: 420, margin: "0 auto" }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>Why BetRush?</h2>
        {[
          ["🎯", "WinGo Color", "30s rounds · Red Green Violet"],
          ["🚀", "Rocket & Crash", "Cash out before it crashes"],
          ["🎲", "Ludo · Snake · Race", "Play vs CPU with real stakes"],
          ["💼", "Wallet & History", "Every bet tracked instantly"],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{
            display: "flex", gap: 14, alignItems: "center",
            padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontSize: 28 }}>{icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
              <div style={{ color: "#6e7681", fontSize: 12 }}>{desc}</div>
            </div>
          </div>
        ))}

        <p style={{ color: "#6e7681", fontSize: 11, textAlign: "center", marginTop: 24, lineHeight: 1.5 }}>
          Demo platform for entertainment only.
          <br />No real-money deposits or withdrawals.
        </p>
      </div>
    </div>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0a0c10",
  color: "#e6edf3",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  maxWidth: 480,
  margin: "0 auto",
};

const card: React.CSSProperties = {
  padding: "28px 20px",
  maxWidth: 400,
  margin: "0 auto",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "#e6edf3",
  fontSize: 16,
  marginBottom: 12,
  outline: "none",
  boxSizing: "border-box",
};

const primary: React.CSSProperties = {
  width: "100%",
  padding: "15px",
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(135deg, #e11d48, #be123c)",
  color: "#fff",
  fontWeight: 800,
  fontSize: 16,
  cursor: "pointer",
};

const backBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#8b949e",
  fontSize: 14,
  cursor: "pointer",
  padding: 0,
  marginBottom: 8,
};

const linkBtn: React.CSSProperties = {
  width: "100%",
  marginTop: 14,
  background: "none",
  border: "none",
  color: "#f0b90b",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

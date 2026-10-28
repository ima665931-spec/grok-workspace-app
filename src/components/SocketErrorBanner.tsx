import type { SocketError } from "../lib/socket";
import { socketErrorText } from "../hooks/useSocket";

export function SocketErrorBanner({
  error,
  onRetry,
  onDismiss,
}: {
  error: SocketError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  if (!error) return null;

  const isSoft = error.code === "DISCONNECT" || error.code === "CONNECT_ERROR";

  return (
    <div
      style={{
        background: isSoft
          ? "rgba(240,185,11,0.12)"
          : "rgba(246,70,93,0.12)",
        border: `1px solid ${isSoft ? "rgba(240,185,11,0.3)" : "rgba(246,70,93,0.3)"}`,
        borderRadius: 12,
        padding: "10px 12px",
        marginBottom: 12,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 12,
            color: isSoft ? "#f0b90b" : "#f6465d",
            marginBottom: 2,
          }}
        >
          {error.code.replace(/_/g, " ")}
        </div>
        <div style={{ fontSize: 12, color: "#e6edf3", lineHeight: 1.4 }}>
          {socketErrorText(error)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: "#f0b90b",
              fontWeight: 700,
              fontSize: 11,
              padding: "6px 10px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            style={{
              background: "transparent",
              border: "none",
              color: "#8b949e",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              padding: "4px 6px",
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

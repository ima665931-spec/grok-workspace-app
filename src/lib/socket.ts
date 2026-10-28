import { io, Socket } from "socket.io-client";

const URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://grok-workspace-app.onrender.com";

let socket: Socket | null = null;

const REJOIN_KEY = "betrush-rejoin";

export type RejoinInfo = { code: string; name: string; playerToken: string };

export type SocketError = {
  code:
    | "CONNECT_ERROR"
    | "TIMEOUT"
    | "DISCONNECT"
    | "EMIT_FAILED"
    | "SERVER_ERROR"
    | "NOT_CONNECTED"
    | "UNKNOWN";
  message: string;
  event?: string;
  at: number;
};

type ErrorListener = (err: SocketError) => void;
const errorListeners = new Set<ErrorListener>();

export function onSocketError(fn: ErrorListener) {
  errorListeners.add(fn);
  return () => errorListeners.delete(fn);
}

export function emitSocketError(err: Omit<SocketError, "at"> & { at?: number }) {
  const full: SocketError = { ...err, at: err.at ?? Date.now() };
  console.warn("[socket:error]", full.code, full.message, full.event || "");
  errorListeners.forEach((fn) => {
    try {
      fn(full);
    } catch (e) {
      console.error(e);
    }
  });
  return full;
}

export function setPendingRejoin(
  code: string | null,
  name?: string,
  playerToken?: string
) {
  if (!code || !playerToken) {
    localStorage.removeItem(REJOIN_KEY);
    return;
  }
  const data: RejoinInfo = {
    code,
    name: name || "Player",
    playerToken,
  };
  localStorage.setItem(REJOIN_KEY, JSON.stringify(data));
}

export function getPendingRejoin(): RejoinInfo | null {
  try {
    const raw = localStorage.getItem(REJOIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      randomizationFactor: 0.4,
      timeout: 15000,
    });

    socket.on("connect", () => {
      console.log("[socket] connected", socket?.id);
      const pending = getPendingRejoin();
      if (pending && socket) {
        safeEmit(
          "join_room",
          {
            code: pending.code,
            name: pending.name,
            playerToken: pending.playerToken,
          },
          (res) => {
            if (res?.ok) {
              console.log("[socket] rejoined", pending.code);
              if (res.playerToken) {
                setPendingRejoin(pending.code, pending.name, res.playerToken);
              }
              safeEmit("request_sync");
            } else {
              emitSocketError({
                code: "SERVER_ERROR",
                message: res?.error || "Rejoin failed",
                event: "join_room",
              });
            }
          }
        );
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected", reason);
      if (reason !== "io client disconnect") {
        emitSocketError({
          code: "DISCONNECT",
          message: `Disconnected: ${reason}`,
        });
      }
      if (reason === "io server disconnect") {
        socket?.connect();
      }
    });

    socket.on("connect_error", (err) => {
      emitSocketError({
        code: "CONNECT_ERROR",
        message: err?.message || "Failed to connect to server",
      });
    });

    socket.io.on("reconnect_attempt", (n) => {
      console.log("[socket] reconnect attempt", n);
    });

    socket.io.on("reconnect", (n) => {
      console.log("[socket] reconnected after", n, "attempts");
    });

    socket.io.on("reconnect_error", (err) => {
      emitSocketError({
        code: "CONNECT_ERROR",
        message: err?.message || "Reconnect failed",
      });
    });

    socket.io.on("reconnect_failed", () => {
      emitSocketError({
        code: "CONNECT_ERROR",
        message: "All reconnection attempts failed",
      });
    });

    // Server can push explicit errors
    socket.on("error", (payload: any) => {
      emitSocketError({
        code: "SERVER_ERROR",
        message:
          typeof payload === "string"
            ? payload
            : payload?.message || "Server error",
        event: payload?.event,
      });
    });
  }
  return socket;
}

export function getSocketUrl() {
  return URL;
}

export function forceReconnect() {
  const s = getSocket();
  if (s.connected) s.disconnect();
  setTimeout(() => s.connect(), 300);
}

/**
 * Safe emit with:
 * - not-connected guard
 * - ack timeout
 * - error normalization
 */
export function safeEmit(
  event: string,
  data?: unknown,
  ack?: (res: any) => void,
  timeoutMs = 10000
) {
  const s = getSocket();

  if (!s.connected) {
    const err = emitSocketError({
      code: "NOT_CONNECTED",
      message: "Not connected to server",
      event,
    });
    ack?.({ ok: false, error: err.message, code: err.code });
    return;
  }

  let settled = false;
  const timer = window.setTimeout(() => {
    if (settled) return;
    settled = true;
    const err = emitSocketError({
      code: "TIMEOUT",
      message: `No response for "${event}" (${timeoutMs}ms)`,
      event,
    });
    ack?.({ ok: false, error: err.message, code: err.code });
  }, timeoutMs);

  try {
    if (ack) {
      s.emit(event, data, (res: any) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (res && res.ok === false) {
          emitSocketError({
            code: "SERVER_ERROR",
            message: res.error || "Request failed",
            event,
          });
        }
        ack(res);
      });
    } else {
      s.emit(event, data);
      clearTimeout(timer);
      settled = true;
    }
  } catch (e: any) {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    const err = emitSocketError({
      code: "EMIT_FAILED",
      message: e?.message || "Emit failed",
      event,
    });
    ack?.({ ok: false, error: err.message, code: err.code });
  }
}

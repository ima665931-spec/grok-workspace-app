import { io, Socket } from "socket.io-client";

const URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://grok-workspace-app.onrender.com";

let socket: Socket | null = null;

/** Persist room + token so reconnect can rejoin mid-game */
const REJOIN_KEY = "betrush-rejoin";

export type RejoinInfo = { code: string; name: string; playerToken: string };

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
        socket.emit(
          "join_room",
          {
            code: pending.code,
            name: pending.name,
            playerToken: pending.playerToken,
          },
          (res: any) => {
            if (res?.ok) {
              console.log("[socket] rejoined room", pending.code);
              if (res.playerToken) {
                setPendingRejoin(pending.code, pending.name, res.playerToken);
              }
              socket?.emit("request_sync");
            } else {
              console.warn("[socket] rejoin failed", res?.error);
            }
          }
        );
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected", reason);
      if (reason === "io server disconnect") {
        socket?.connect();
      }
    });

    socket.on("connect_error", (err) => {
      console.warn("[socket] connect_error", err.message);
    });

    socket.io.on("reconnect_attempt", (n) => {
      console.log("[socket] reconnect attempt", n);
    });

    socket.io.on("reconnect", (n) => {
      console.log("[socket] reconnected after", n, "attempts");
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

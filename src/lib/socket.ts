import { io, Socket } from "socket.io-client";

const URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://grok-workspace-app.onrender.com";

let socket: Socket | null = null;

/** Last room credentials so we can rejoin after reconnect */
let pendingRejoin: { code: string; name: string } | null = null;

export function setPendingRejoin(code: string | null, name?: string) {
  if (!code) {
    pendingRejoin = null;
    return;
  }
  pendingRejoin = { code, name: name || "Player" };
}

export function getPendingRejoin() {
  return pendingRejoin;
}

export function getSocket(): Socket {
  if (!socket) {
    socket = io(URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      // --- reconnection ---
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
      randomizationFactor: 0.4,
      timeout: 15000,
    });

    socket.on("connect", () => {
      console.log("[socket] connected", socket?.id);
      // Auto rejoin room after reconnect
      if (pendingRejoin && socket) {
        const { code, name } = pendingRejoin;
        socket.emit("join_room", { code, name }, (res: any) => {
          if (res?.ok) {
            console.log("[socket] rejoined room", code);
            socket?.emit("request_sync");
          } else {
            console.warn("[socket] rejoin failed", res?.error);
          }
        });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected", reason);
      // If server kicked us, try manual reconnect
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

    socket.io.on("reconnect_error", (err) => {
      console.warn("[socket] reconnect_error", err.message);
    });
  }
  return socket;
}

export function getSocketUrl() {
  return URL;
}

/** Force a clean reconnect cycle */
export function forceReconnect() {
  const s = getSocket();
  if (s.connected) {
    s.disconnect();
  }
  setTimeout(() => s.connect(), 300);
}

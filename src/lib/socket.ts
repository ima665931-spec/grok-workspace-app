import { io, Socket } from "socket.io-client";

// Production multiplayer server (Render)
const URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://grok-workspace-app.onrender.com";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function getSocketUrl() {
  return URL;
}

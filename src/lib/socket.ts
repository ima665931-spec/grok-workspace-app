import { io, Socket } from "socket.io-client";

const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

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

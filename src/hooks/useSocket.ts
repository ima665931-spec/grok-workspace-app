import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import {
  getSocket,
  forceReconnect,
  getPendingRejoin,
  setPendingRejoin,
} from "../lib/socket";

export type ConnStatus = "connected" | "connecting" | "reconnecting" | "offline";

/**
 * React hook: WebSocket connection + auto-reconnection.
 *
 * - Connects on mount
 * - Auto-reconnect with backoff (configured in getSocket)
 * - Re-syncs room on reconnect / tab focus / browser online
 * - Exposes status for UI
 */
export function useSocket(options?: {
  /** called every time socket connects / reconnects */
  onConnect?: (socket: Socket) => void;
  /** poll request_sync while connected (ms). 0 = off */
  syncIntervalMs?: number;
}) {
  const { onConnect, syncIntervalMs = 10000 } = options || {};
  const [status, setStatus] = useState<ConnStatus>("connecting");
  const [attempt, setAttempt] = useState(0);
  const [socketId, setSocketId] = useState<string>("");
  const onConnectRef = useRef(onConnect);
  onConnectRef.current = onConnect;

  useEffect(() => {
    const s = getSocket();

    const handleConnect = () => {
      setStatus("connected");
      setAttempt(0);
      setSocketId(s.id || "");
      onConnectRef.current?.(s);
    };

    const handleDisconnect = (reason: string) => {
      // client intentionally closed
      if (reason === "io client disconnect") {
        setStatus("offline");
      } else {
        setStatus("reconnecting");
      }
    };

    const handleConnectError = () => {
      setStatus("reconnecting");
    };

    const handleReconnectAttempt = (n: number) => {
      setStatus("reconnecting");
      setAttempt(n);
    };

    const handleReconnect = () => {
      setStatus("connected");
      setAttempt(0);
      setSocketId(s.id || "");
      onConnectRef.current?.(s);
    };

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("connect_error", handleConnectError);
    s.io.on("reconnect_attempt", handleReconnectAttempt);
    s.io.on("reconnect", handleReconnect);

    // Tab visible again → ensure connected + let consumer sync
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!s.connected) {
        setStatus("reconnecting");
        s.connect();
      } else {
        onConnectRef.current?.(s);
      }
    };

    const onOnline = () => {
      setStatus("reconnecting");
      if (!s.connected) s.connect();
    };

    const onOffline = () => setStatus("offline");

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Periodic keep-alive / sync trigger
    const interval =
      syncIntervalMs > 0
        ? window.setInterval(() => {
            if (s.connected) {
              onConnectRef.current?.(s);
            } else if (typeof navigator !== "undefined" && navigator.onLine) {
              s.connect();
            }
          }, syncIntervalMs)
        : null;

    // Initial connect
    if (!s.connected) {
      setStatus("connecting");
      s.connect();
    } else {
      handleConnect();
    }

    return () => {
      s.off("connect", handleConnect);
      s.off("disconnect", handleDisconnect);
      s.off("connect_error", handleConnectError);
      s.io.off("reconnect_attempt", handleReconnectAttempt);
      s.io.off("reconnect", handleReconnect);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      if (interval) clearInterval(interval);
    };
  }, [syncIntervalMs]);

  const retry = useCallback(() => {
    setStatus("reconnecting");
    forceReconnect();
  }, []);

  const emit = useCallback(
    (event: string, data?: unknown, ack?: (res: any) => void) => {
      const s = getSocket();
      if (!s.connected) {
        ack?.({ ok: false, error: "Not connected" });
        return;
      }
      if (ack) s.emit(event, data, ack);
      else s.emit(event, data);
    },
    []
  );

  return {
    socket: getSocket(),
    status,
    attempt,
    socketId,
    connected: status === "connected",
    retry,
    emit,
    getPendingRejoin,
    setPendingRejoin,
  };
}

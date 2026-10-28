import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import {
  getSocket,
  forceReconnect,
  getPendingRejoin,
  setPendingRejoin,
  onSocketError,
  safeEmit,
  type SocketError,
} from "../lib/socket";

export type ConnStatus = "connected" | "connecting" | "reconnecting" | "offline";

export function useSocket(options?: {
  onConnect?: (socket: Socket) => void;
  onError?: (err: SocketError) => void;
  errorHistory?: number;
  syncIntervalMs?: number;
}) {
  const {
    onConnect,
    onError,
    errorHistory = 5,
    syncIntervalMs = 10000,
  } = options || {};

  const [status, setStatus] = useState<ConnStatus>("connecting");
  const [attempt, setAttempt] = useState(0);
  const [socketId, setSocketId] = useState("");
  const [lastError, setLastError] = useState<SocketError | null>(null);
  const [errors, setErrors] = useState<SocketError[]>([]);

  const onConnectRef = useRef(onConnect);
  const onErrorRef = useRef(onError);
  onConnectRef.current = onConnect;
  onErrorRef.current = onError;

  useEffect(() => {
    const s = getSocket();

    const handleConnect = () => {
      setStatus("connected");
      setAttempt(0);
      setSocketId(s.id || "");
      setLastError((prev) =>
        prev?.code === "CONNECT_ERROR" || prev?.code === "DISCONNECT"
          ? null
          : prev
      );
      onConnectRef.current?.(s);
    };

    const handleDisconnect = (reason: string) => {
      if (reason === "io client disconnect") setStatus("offline");
      else setStatus("reconnecting");
    };

    const handleConnectError = () => setStatus("reconnecting");

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

    const unsubError = onSocketError((err) => {
      setLastError(err);
      setErrors((prev) => [err, ...prev].slice(0, errorHistory));
      onErrorRef.current?.(err);
    });

    s.on("connect", handleConnect);
    s.on("disconnect", handleDisconnect);
    s.on("connect_error", handleConnectError);
    s.io.on("reconnect_attempt", handleReconnectAttempt);
    s.io.on("reconnect", handleReconnect);

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

    const interval =
      syncIntervalMs > 0
        ? window.setInterval(() => {
            if (s.connected) onConnectRef.current?.(s);
            else if (typeof navigator !== "undefined" && navigator.onLine) s.connect();
          }, syncIntervalMs)
        : null;

    if (!s.connected) {
      setStatus("connecting");
      s.connect();
    } else {
      handleConnect();
    }

    return () => {
      unsubError();
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
  }, [syncIntervalMs, errorHistory]);

  const retry = useCallback(() => {
    setStatus("reconnecting");
    setLastError(null);
    forceReconnect();
  }, []);

  const clearError = useCallback(() => setLastError(null), []);

  const emit = useCallback(
    (event: string, data?: unknown, ack?: (res: any) => void, timeoutMs?: number) => {
      safeEmit(event, data, ack, timeoutMs);
    },
    []
  );

  return {
    socket: getSocket(),
    status,
    attempt,
    socketId,
    connected: status === "connected",
    lastError,
    errors,
    clearError,
    retry,
    emit,
    getPendingRejoin,
    setPendingRejoin,
  };
}

/** Friendly English messages for UI banners */
export function socketErrorText(err: SocketError | null): string {
  if (!err) return "";
  switch (err.code) {
    case "CONNECT_ERROR":
      return "Cannot connect to server. Check your internet or try again.";
    case "TIMEOUT":
      return "Server is taking too long to respond. Please retry.";
    case "DISCONNECT":
      return "Connection lost. Reconnecting...";
    case "NOT_CONNECTED":
      return "Not connected to server. Please wait or tap Retry.";
    case "SERVER_ERROR":
      return err.message || "Server error";
    case "EMIT_FAILED":
      return "Failed to send request. Please try again.";
    default:
      return err.message || "Unknown socket error";
  }
}

import { useEffect, useState, useRef, useCallback } from "react";
import {
  getSocket,
  getSocketUrl,
  setPendingRejoin,
  forceReconnect,
} from "../../lib/socket";
import { useAuth } from "../../game/auth";
import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";

type Player = { id: string; name: string; pos: number };

type GameState = {
  code: string;
  stake: number;
  goal: number;
  status: "waiting" | "playing" | "finished";
  players: Player[];
  turn: number;
  turnPlayerId?: string | null;
  winner: string | null;
  lastDice: number | null;
  hostId: string;
  messages?: ChatMsg[];
  updatedAt?: number;
};

type ChatMsg = {
  id: string;
  userId: string;
  name: string;
  text: string;
  time: number;
  system?: boolean;
};

type ConnStatus = "connected" | "connecting" | "reconnecting" | "offline";

export function LudoMultiplayer({ onBack }: { onBack: () => void }) {
  const user = useAuth((s) => s.user);
  const balance = useGame((s) => s.balance);
  const tryPlaceStake = useGame((s) => s.tryPlaceStake);
  const creditWin = useGame((s) => s.creditWin);
  const recordBet = useGame((s) => s.recordBet);

  const [conn, setConn] = useState<ConnStatus>("connecting");
  const [reconnectTry, setReconnectTry] = useState(0);
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [stake, setStake] = useState(100);
  const [room, setRoom] = useState<GameState | null>(null);
  const [myId, setMyId] = useState("");
  const [rolling, setRolling] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatText, setChatText] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [lastSync, setLastSync] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const settledRef = useRef<string | null>(null);
  const roomCodeRef = useRef<string | null>(null);

  const applyState = useCallback((state: GameState) => {
    if (!state) return;
    setRoom(state);
    roomCodeRef.current = state.code;
    if (state.messages) setMessages(state.messages);
    if (state.updatedAt) setLastSync(state.updatedAt);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const s = getSocket();
    const playerName = user?.name || "Player";

    const onConnect = () => {
      setConn("connected");
      setReconnectTry(0);
      setMyId(s.id || "");
      setError("");
      s.emit("request_sync", (res: any) => {
        if (res?.ok && res.room) applyState(res.room);
      });
    };

    const onDisconnect = (reason: string) => {
      setConn(reason === "io client disconnect" ? "offline" : "reconnecting");
    };

    const onConnectError = () => {
      setConn("reconnecting");
    };

    const onReconnectAttempt = (n: number) => {
      setConn("reconnecting");
      setReconnectTry(n);
    };

    const onReconnect = () => {
      setConn("connected");
      setReconnectTry(0);
      // pending rejoin handled in socket.ts; also request sync
      setTimeout(() => s.emit("request_sync"), 200);
    };

    const onGameState = (state: GameState) => applyState(state);

    const onChat = (msg: ChatMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg].slice(-80);
      });
    };

    const onOver = ({ room: r, winnerId }: { room: GameState; winnerId: string }) => {
      applyState(r);
      if (!r || settledRef.current === r.code + winnerId) return;
      settledRef.current = r.code + winnerId;
      if (winnerId === s.id) {
        const payout = Math.floor((r.stake || 0) * 1.9);
        if (payout > 0) {
          creditWin(payout);
          recordBet("Ludo MP", r.stake, 1.9, true, r.code);
        }
      } else if (r.players.some((p) => p.id === s.id)) {
        recordBet("Ludo MP", r.stake, 0, false, r.code);
      }
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("connect_error", onConnectError);
    s.io.on("reconnect_attempt", onReconnectAttempt);
    s.io.on("reconnect", onReconnect);
    s.on("game_state", onGameState);
    s.on("room_update", onGameState);
    s.on("game_started", onGameState);
    s.on("game_over", onOver);
    s.on("chat_message", onChat);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        if (!s.connected) {
          setConn("reconnecting");
          s.connect();
        } else {
          s.emit("request_sync");
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    // Online/offline browser events
    const onOnline = () => {
      setConn("reconnecting");
      if (!s.connected) s.connect();
    };
    const onOffline = () => setConn("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const interval = window.setInterval(() => {
      if (s.connected) s.emit("request_sync");
      else if (navigator.onLine) s.connect();
    }, 10000);

    if (!s.connected) {
      setConn("connecting");
      s.connect();
    } else {
      onConnect();
    }

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);
      s.io.off("reconnect_attempt", onReconnectAttempt);
      s.io.off("reconnect", onReconnect);
      s.off("game_state", onGameState);
      s.off("room_update", onGameState);
      s.off("game_started", onGameState);
      s.off("game_over", onOver);
      s.off("chat_message", onChat);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(interval);
    };
  }, [applyState, creditWin, recordBet, user?.name]);

  const name = user?.name || "Player";

  const createRoom = () => {
    setError("");
    setMessages([]);
    settledRef.current = null;
    if (stake > 0 && stake > balance) {
      setError("Insufficient balance");
      return;
    }
    if (stake > 0 && !tryPlaceStake(stake)) {
      setError("Could not lock stake");
      return;
    }
    const s = getSocket();
    if (!s.connected) s.connect();
    s.emit("create_room", { name, stake }, (res: any) => {
      if (!res?.ok) {
        if (stake > 0) creditWin(stake);
        setError(res?.error || "Create failed");
        return;
      }
      setMyId(s.id || "");
      applyState(res.room);
      setPendingRejoin(res.room.code, name);
    });
  };

  const joinRoom = () => {
    setError("");
    setMessages([]);
    settledRef.current = null;
    const s = getSocket();
    if (!s.connected) s.connect();
    const code = joinCode.trim();
    s.emit("join_room", { code, name }, (res: any) => {
      if (!res?.ok) {
        setError(res?.error || "Join failed");
        return;
      }
      const r = res.room as GameState;
      if (r.stake > 0) {
        if (r.stake > balance || !tryPlaceStake(r.stake)) {
          setError("Need ₹" + r.stake + " to join");
          s.emit("leave_room");
          return;
        }
      }
      setMyId(s.id || "");
      applyState(r);
      setPendingRejoin(r.code, name);
    });
  };

  const startGame = () => {
    getSocket().emit("start_game", (res: any) => {
      if (!res?.ok) setError(res?.error || "Start failed");
    });
  };

  const roll = () => {
    if (rolling || conn !== "connected") return;
    setRolling(true);
    getSocket().emit("roll_dice", (res: any) => {
      setRolling(false);
      if (!res?.ok) setError(res?.error || "Roll failed");
      if (res?.state) applyState(res.state);
    });
  };

  const sendChat = () => {
    const text = chatText.trim();
    if (!text || conn !== "connected") return;
    setChatText("");
    getSocket().emit("chat_message", { text }, (res: any) => {
      if (!res?.ok) setError(res?.error || "Chat failed");
    });
  };

  const forceSync = () => {
    const s = getSocket();
    if (!s.connected) {
      forceReconnect();
      return;
    }
    s.emit("request_sync", (res: any) => {
      if (res?.ok && res.room) applyState(res.room);
    });
  };

  const leave = () => {
    setPendingRejoin(null);
    getSocket().emit("leave_room");
    setRoom(null);
    setMessages([]);
    roomCodeRef.current = null;
    onBack();
  };

  const isHost = room && room.hostId === myId;
  const turnId = room?.turnPlayerId || room?.players[room?.turn ?? 0]?.id;
  const myTurn = room && room.status === "playing" && turnId === myId;

  const statusColor =
    conn === "connected" ? "#0ecb81" :
    conn === "offline" ? "#f6465d" : "#f0b90b";

  const statusText =
    conn === "connected" ? "● Live" :
    conn === "offline" ? "● Offline" :
    conn === "reconnecting" ? `● Reconnecting${reconnectTry ? ` (${reconnectTry})` : "..."}` :
    "● Connecting...";

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Ludo Online</h2>
        <button type="button" onClick={leave} style={link}>← Back</button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: statusColor, fontWeight: 600 }}>{statusText}</div>
        <div style={{ display: "flex", gap: 10 }}>
          {conn !== "connected" && (
            <button type="button" onClick={() => forceReconnect()} style={{ ...link, fontSize: 11, color: "#f0b90b" }}>
              Retry
            </button>
          )}
          {room && (
            <button type="button" onClick={forceSync} style={{ ...link, fontSize: 11 }}>
              ↻ Sync
            </button>
          )}
        </div>
      </div>

      {conn === "reconnecting" && (
        <div style={{
          background: "rgba(240,185,11,0.1)", border: "1px solid rgba(240,185,11,0.25)",
          borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#f0b90b",
        }}>
          Connection lost — auto reconnecting. Room will restore when back online.
        </div>
      )}

      {error && (
        <div style={{ color: "#f6465d", fontSize: 13, marginBottom: 10, fontWeight: 600 }}>{error}</div>
      )}

      {!room && (
        <>
          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Create Room</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {[0, 100, 500, 1000].map((v) => (
                <button key={v} type="button" onClick={() => setStake(v)} style={chip(stake === v)}>
                  {v === 0 ? "Free" : v}
                </button>
              ))}
            </div>
            <button type="button" onClick={createRoom} style={primary} disabled={conn === "offline"}>
              Create Room
            </button>
          </div>

          <div style={{ ...card, marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Join Room</div>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Room code"
              style={input}
            />
            <button type="button" onClick={joinRoom} style={primary} disabled={conn === "offline"}>
              Join
            </button>
          </div>
        </>
      )}

      {room && (
        <>
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: "#8b949e" }}>Room</div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 2 }}>{room.code}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#8b949e" }}>Stake</div>
                <div style={{ fontWeight: 800, color: "#f0b90b" }}>
                  {room.stake ? `₹${formatCoins(room.stake)}` : "Free"}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              {room.players.map((p) => {
                const pct = Math.min(100, (p.pos / room.goal) * 100);
                const isMe = p.id === myId;
                const isTurn = turnId === p.id && room.status === "playing";
                return (
                  <div key={p.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: isMe ? "#0ecb81" : "#e6edf3" }}>
                        {isMe ? "You" : p.name}
                        {p.id === room.hostId ? " 👑" : ""}
                        {isTurn ? " ← turn" : ""}
                      </span>
                      <span style={{ fontWeight: 800 }}>{p.pos}/{room.goal}</span>
                    </div>
                    <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 6, overflow: "hidden" }}>
                      <div style={{
                        width: `${pct}%`, height: "100%", borderRadius: 6,
                        background: isMe ? "#0ecb81" : "#3b82f6",
                        transition: "width 0.35s ease",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {room.lastDice != null && (
              <div style={{ textAlign: "center", fontSize: 36, fontWeight: 900, marginBottom: 10 }}>
                🎲 {room.lastDice}
              </div>
            )}

            {room.status === "waiting" && isHost && (
              <button type="button" onClick={startGame} style={primary}
                disabled={room.players.length < 2 || conn !== "connected"}>
                {room.players.length < 2 ? "Waiting for players..." : "Start Game"}
              </button>
            )}
            {room.status === "waiting" && !isHost && (
              <div style={{ textAlign: "center", color: "#8b949e", fontSize: 13 }}>Waiting for host...</div>
            )}
            {room.status === "playing" && (
              <button type="button" onClick={roll}
                disabled={!myTurn || rolling || conn !== "connected"} style={primary}>
                {conn !== "connected" ? "Reconnecting..." :
                  !myTurn ? "Opponent turn" : rolling ? "Rolling..." : "Roll Dice"}
              </button>
            )}
            {room.status === "finished" && (
              <div style={{
                textAlign: "center", fontWeight: 800, fontSize: 16,
                color: room.winner === myId ? "#0ecb81" : "#f6465d",
              }}>
                {room.winner === myId ? "You won!" : "You lost"}
              </div>
            )}

            {lastSync > 0 && (
              <div style={{ textAlign: "center", fontSize: 10, color: "#6e7681", marginTop: 8 }}>
                Synced {new Date(lastSync).toLocaleTimeString()}
              </div>
            )}
          </div>

          <div style={{ ...card, marginTop: 12, padding: 0, overflow: "hidden" }}>
            <button type="button" onClick={() => setShowChat((v) => !v)} style={{
              width: "100%", padding: "12px 16px", border: "none",
              background: "rgba(255,255,255,0.03)", color: "#e6edf3",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
              display: "flex", justifyContent: "space-between",
            }}>
              <span>💬 Room Chat</span>
              <span style={{ color: "#6e7681" }}>{showChat ? "Hide" : "Show"}</span>
            </button>

            {showChat && (
              <>
                <div style={{
                  height: 180, overflowY: "auto", padding: "8px 12px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}>
                  {messages.length === 0 && (
                    <div style={{ color: "#6e7681", fontSize: 12, textAlign: "center", padding: 20 }}>
                      No messages yet
                    </div>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} style={{ marginBottom: 8 }}>
                      {m.system ? (
                        <div style={{ textAlign: "center", fontSize: 11, color: "#6e7681" }}>{m.text}</div>
                      ) : (
                        <div style={{
                          display: "flex", flexDirection: "column",
                          alignItems: m.userId === myId ? "flex-end" : "flex-start",
                        }}>
                          <span style={{ fontSize: 10, color: "#8b949e", marginBottom: 2 }}>
                            {m.userId === myId ? "You" : m.name}
                          </span>
                          <span style={{
                            maxWidth: "80%", padding: "8px 12px", borderRadius: 12,
                            fontSize: 13, fontWeight: 500,
                            background: m.userId === myId ? "rgba(14,203,129,0.2)" : "rgba(255,255,255,0.06)",
                            color: "#e6edf3",
                          }}>{m.text}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div style={{
                  display: "flex", gap: 8, padding: 10,
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <input
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    placeholder={conn === "connected" ? "Type a message..." : "Reconnecting..."}
                    disabled={conn !== "connected"}
                    maxLength={200}
                    style={
                      {
                        flex: 1, padding: "10px 12px", borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(255,255,255,0.04)", color: "#e6edf3",
                        fontSize: 14, outline: "none",
                      }
                    }
                  />
                  <button type="button" onClick={sendChat} disabled={conn !== "connected"} style={{
                    padding: "10px 16px", borderRadius: 10, border: "none",
                    background: conn === "connected" ? "#0ecb81" : "#21262d",
                    color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
                  }}>Send</button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 16,
  padding: 16,
};
const input: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "#e6edf3",
  fontSize: 16,
  marginBottom: 10,
  outline: "none",
  boxSizing: "border-box",
  letterSpacing: 2,
  fontWeight: 700,
};
const primary: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #0ecb81, #0ba86a)",
  color: "#fff",
  fontWeight: 800,
  fontSize: 15,
  cursor: "pointer",
};
const link: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#8b949e",
  fontSize: 13,
  cursor: "pointer",
};
function chip(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    border: active ? "1px solid #f0b90b" : "1px solid rgba(255,255,255,0.08)",
    background: active ? "rgba(240,185,11,0.12)" : "rgba(255,255,255,0.03)",
    color: active ? "#f0b90b" : "#e6edf3",
  };
}

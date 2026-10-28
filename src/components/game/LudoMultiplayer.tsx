import { useEffect, useState, useRef, useCallback } from "react";
import { setPendingRejoin, safeEmit, getSocket } from "../../lib/socket";
import { useSocket } from "../../hooks/useSocket";
import { SocketErrorBanner } from "../SocketErrorBanner";
import { useAuth } from "../../game/auth";
import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";

type Player = { id: string; name: string; pos: number; connected?: boolean };

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

function waitForConnect(maxMs = 30000): Promise<boolean> {
  const s = getSocket();
  if (s.connected) return Promise.resolve(true);
  s.connect();
  return new Promise((resolve) => {
    const t = setTimeout(() => {
      s.off("connect", onOk);
      resolve(!!s.connected);
    }, maxMs);
    const onOk = () => {
      clearTimeout(t);
      s.off("connect", onOk);
      resolve(true);
    };
    s.on("connect", onOk);
  });
}

export function LudoMultiplayer({ onBack }: { onBack: () => void }) {
  const user = useAuth((s) => s.user);
  const balance = useGame((s) => s.balance);
  const tryPlaceStake = useGame((s) => s.tryPlaceStake);
  const creditWin = useGame((s) => s.creditWin);
  const recordBet = useGame((s) => s.recordBet);

  const [localError, setLocalError] = useState("");
  const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [stake, setStake] = useState(100);
  const [room, setRoom] = useState<GameState | null>(null);
  const [myId, setMyId] = useState("");
  const [rolling, setRolling] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatText, setChatText] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [lastSync, setLastSync] = useState(0);
  const [tab, setTab] = useState<"create" | "join">("create");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const settledRef = useRef<string | null>(null);
  const inRoomRef = useRef(false);

  const applyState = useCallback((state: GameState) => {
    if (!state) return;
    setRoom(state);
    inRoomRef.current = true;
    if (state.messages) setMessages(state.messages);
    if (state.updatedAt) setLastSync(state.updatedAt);
  }, []);

  const {
    status: conn,
    attempt: reconnectTry,
    connected,
    socketId,
    lastError,
    clearError,
    retry,
    socket,
  } = useSocket({
    onConnect: (s) => {
      setMyId(s.id || "");
      // Only sync if already in a room
      if (inRoomRef.current) {
        safeEmit("request_sync", {}, (res: any) => {
          if (res?.ok && res.room) applyState(res.room);
        });
      }
    },
    syncIntervalMs: 12000,
  });

  useEffect(() => {
    if (socketId) setMyId(socketId);
  }, [socketId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const s = socket;

    const onGameState = (state: GameState) => {
      applyState(state);
      if (s.id) setMyId(s.id);
    };

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

    s.on("game_state", onGameState);
    s.on("room_update", onGameState);
    s.on("game_started", onGameState);
    s.on("game_over", onOver);
    s.on("chat_message", onChat);

    return () => {
      s.off("game_state", onGameState);
      s.off("room_update", onGameState);
      s.off("game_started", onGameState);
      s.off("game_over", onOver);
      s.off("chat_message", onChat);
    };
  }, [socket, applyState, creditWin, recordBet]);

  const name = user?.name || "Player";

  const createRoom = async () => {
    setLocalError("");
    clearError();
    setMessages([]);
    settledRef.current = null;

    if (stake > 0 && stake > balance) {
      setLocalError("Insufficient balance");
      return;
    }

    setBusy(true);

    try {
      const ok = await waitForConnect(30000);
      if (!ok) {
        setLocalError("Cannot reach server. Open render.com and make sure service is Live.");
        setBusy(false);
        return;
      }

      // Lock stake only after we know server is up
      if (stake > 0 && !tryPlaceStake(stake)) {
        setLocalError("Could not lock stake");
        setBusy(false);
        return;
      }

      safeEmit(
        "create_room",
        { name, stake },
        (res: any) => {
          setBusy(false);
          console.log("[create_room] response", res);
          if (!res?.ok) {
            if (stake > 0) creditWin(stake);
            setLocalError(res?.error || "Failed to create room");
            return;
          }
          if (!res.room) {
            if (stake > 0) creditWin(stake);
            setLocalError("Invalid server response");
            return;
          }
          setMyId(getSocket().id || "");
          applyState(res.room);
          setPendingRejoin(res.room.code, name, res.playerToken);
        },
        20000
      );
    } catch (e: any) {
      setBusy(false);
      setLocalError(e?.message || "Create room failed");
    }
  };

  const joinRoom = async () => {
    setLocalError("");
    clearError();
    setMessages([]);
    settledRef.current = null;
    const code = joinCode.trim();
    if (!code) {
      setLocalError("Enter a room code");
      return;
    }

    setBusy(true);
    const ok = await waitForConnect(30000);
    if (!ok) {
      setBusy(false);
      setLocalError("Cannot reach server. Make sure Render service is Live.");
      return;
    }

    safeEmit(
      "join_room",
      { code, name },
      (res: any) => {
        setBusy(false);
        if (!res?.ok) {
          setLocalError(res?.error || "Failed to join room");
          return;
        }
        const r = res.room as GameState;
        if (r.stake > 0) {
          if (r.stake > balance || !tryPlaceStake(r.stake)) {
            setLocalError("Need ₹" + r.stake + " to join");
            safeEmit("leave_room");
            return;
          }
        }
        setMyId(getSocket().id || "");
        applyState(r);
        setPendingRejoin(r.code, name, res.playerToken);
      },
      20000
    );
  };

  const startGame = () => {
    setLocalError("");
    safeEmit("start_game", {}, (res: any) => {
      if (!res?.ok) setLocalError(res?.error || "Failed to start game");
    });
  };

  const roll = () => {
    if (rolling || !connected) return;
    setRolling(true);
    setLocalError("");
    safeEmit("roll_dice", {}, (res: any) => {
      setRolling(false);
      if (!res?.ok) setLocalError(res?.error || "Roll failed");
      if (res?.state) applyState(res.state);
    });
  };

  const sendChat = () => {
    const text = chatText.trim();
    if (!text || !connected) return;
    setChatText("");
    safeEmit("chat_message", { text }, (res: any) => {
      if (!res?.ok) setLocalError(res?.error || "Failed to send message");
    });
  };

  const forceSync = () => {
    if (!connected) {
      retry();
      return;
    }
    safeEmit("request_sync", {}, (res: any) => {
      if (res?.ok && res.room) applyState(res.room);
    });
  };

  const leave = () => {
    setPendingRejoin(null);
    inRoomRef.current = false;
    safeEmit("leave_room");
    setRoom(null);
    setMessages([]);
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
            <button type="button" onClick={retry} style={{ ...link, fontSize: 11, color: "#f0b90b" }}>
              Retry
            </button>
          )}
          {room && (
            <button type="button" onClick={forceSync} style={{ ...link, fontSize: 11 }}>↻ Sync</button>
          )}
        </div>
      </div>

      <SocketErrorBanner error={lastError} onRetry={retry} onDismiss={clearError} />

      {localError && (
        <div style={
          {
            background: "rgba(246,70,93,0.12)", border: "1px solid rgba(246,70,93,0.3)",
            borderRadius: 10, padding: "8px 12px", marginBottom: 10,
            fontSize: 12, color: "#f6465d", fontWeight: 600,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }
        }>
          <span>{localError}</span>
          <button type="button" onClick={() => setLocalError("")} style={{
            background: "none", border: "none", color: "#8b949e", cursor: "pointer", fontWeight: 700,
          }}>✕</button>
        </div>
      )}

      {!room && (
        <div style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          overflow: "hidden",
        }}>
          <div style={{ display: "flex", padding: 6, gap: 6, background: "rgba(0,0,0,0.25)" }}>
            {([
              ["create", "Create Room"],
              ["join", "Join Room"],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => { setTab(id); setLocalError(""); }}
                style={{
                  flex: 1, padding: "12px 8px", borderRadius: 12, border: "none", cursor: "pointer",
                  fontWeight: 800, fontSize: 14,
                  background: tab === id ? "linear-gradient(135deg, #0ecb81, #0ba86a)" : "transparent",
                  color: tab === id ? "#fff" : "#8b949e",
                  boxShadow: tab === id ? "0 4px 16px rgba(14,203,129,0.25)" : "none",
                }}
              >{label}</button>
            ))}
          </div>

          <div style={{ padding: 20 }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 18, padding: "10px 14px", borderRadius: 12,
              background: "rgba(240,185,11,0.08)", border: "1px solid rgba(240,185,11,0.2)",
            }}>
              <span style={{ fontSize: 12, color: "#8b949e", fontWeight: 600 }}>Your balance</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#f0b90b" }}>₹{formatCoins(balance)}</span>
            </div>

            {tab === "create" && (
              <>
                <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#8b949e" }}>ENTRY STAKE</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
                  {[0, 100, 500, 1000].map((v) => {
                    const active = stake === v;
                    return (
                      <button key={v} type="button" onClick={() => setStake(v)} style={{
                        padding: "14px 4px", borderRadius: 12, cursor: "pointer", fontWeight: 800, fontSize: 14,
                        border: active ? "1px solid #f0b90b" : "1px solid rgba(255,255,255,0.08)",
                        background: active ? "linear-gradient(135deg, rgba(240,185,11,0.2), rgba(240,185,11,0.05))" : "rgba(255,255,255,0.03)",
                        color: active ? "#f0b90b" : "#e6edf3",
                      }}>{v === 0 ? "Free" : `₹${v}`}</button>
                    );
                  })}
                </div>

                <div style={{
                  marginBottom: 18, padding: 14, borderRadius: 12,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  fontSize: 12, color: "#8b949e", lineHeight: 1.55,
                }}>
                  <div style={{ color: "#e6edf3", fontWeight: 700, marginBottom: 6 }}>Room rules</div>
                  • Race to 50 points<br />
                  • 2–4 players · server dice<br />
                  • Winner gets 1.9× stake
                </div>

                <button type="button" onClick={createRoom} disabled={busy}
                  style={{
                    width: "100%", padding: 16, borderRadius: 14, border: "none",
                    cursor: busy ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 16, color: "#fff",
                    background: busy ? "#21262d" : "linear-gradient(135deg, #0ecb81, #0ba86a)",
                    boxShadow: busy ? "none" : "0 6px 24px rgba(14,203,129,0.3)",
                  }}
                >
                  {busy ? "Creating room..." : stake === 0 ? "Create Free Room" : `Create Room · ₹${stake}`}
                </button>

                <p style={{ marginTop: 12, fontSize: 11, color: "#6e7681", textAlign: "center" }}>
                  Status must be ● Live before creating. Server may take 30s to wake.
                </p>
              </>
            )}

            {tab === "join" && (
              <>
                <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#8b949e" }}>ROOM CODE</div>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                  placeholder="e.g. AB12CD"
                  maxLength={8}
                  style={{
                    width: "100%", padding: "18px 16px", borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.25)",
                    color: "#f0b90b", fontSize: 22, fontWeight: 900, letterSpacing: 6,
                    textAlign: "center", outline: "none", marginBottom: 14, boxSizing: "border-box",
                  }}
                />
                <button type="button" onClick={joinRoom} disabled={busy || joinCode.length < 4}
                  style={
                    {
                      width: "100%", padding: 16, borderRadius: 14, border: "none",
                      cursor: busy || joinCode.length < 4 ? "not-allowed" : "pointer",
                      fontWeight: 800, fontSize: 16, color: "#0a0c10",
                      background: busy || joinCode.length < 4 ? "#21262d" : "linear-gradient(135deg, #f0b90b, #e5a800)",
                    }
                  }
                >
                  {busy ? "Joining..." : "Join Room"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {room && (
        <>
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: 16,
          }}>
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
                const offline = p.connected === false;
                return (
                  <div key={p.id} style={{ marginBottom: 10, opacity: offline ? 0.5 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: isMe ? "#0ecb81" : "#e6edf3" }}>
                        {isMe ? "You" : p.name}
                        {p.id === room.hostId ? " 👑" : ""}
                        {offline ? " (away)" : ""}
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
                disabled={room.players.filter((p) => p.connected !== false).length < 2 || !connected}>
                {room.players.filter((p) => p.connected !== false).length < 2
                  ? "Waiting for players..."
                  : "Start Game"}
              </button>
            )}
            {room.status === "waiting" && !isHost && (
              <div style={{ textAlign: "center", color: "#8b949e", fontSize: 13 }}>Waiting for host...</div>
            )}
            {room.status === "playing" && (
              <button type="button" onClick={roll} disabled={!myTurn || rolling || !connected} style={primary}>
                {!connected ? "Reconnecting..." : !myTurn ? "Opponent turn" : rolling ? "Rolling..." : "Roll Dice"}
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
          </div>

          <div style={{
            marginTop: 12, background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden",
          }}>
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
                <div style={{ height: 160, overflowY: "auto", padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  {messages.map((m) => (
                    <div key={m.id} style={{ marginBottom: 8 }}>
                      {m.system ? (
                        <div style={{ textAlign: "center", fontSize: 11, color: "#6e7681" }}>{m.text}</div>
                      ) : (
                        <div style={{
                          display: "flex", flexDirection: "column",
                          alignItems: m.userId === myId ? "flex-end" : "flex-start",
                        }}>
                          <span style={{ fontSize: 10, color: "#8b949e" }}>{m.userId === myId ? "You" : m.name}</span>
                          <span style={{
                            maxWidth: "80%", padding: "8px 12px", borderRadius: 12, fontSize: 13,
                            background: m.userId === myId ? "rgba(14,203,129,0.2)" : "rgba(255,255,255,0.06)",
                            color: "#e6edf3",
                          }}>{m.text}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <input value={chatText} onChange={(e) => setChatText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChat()}
                    placeholder={connected ? "Type a message..." : "Reconnecting..."}
                    disabled={!connected} maxLength={200}
                    style={{
                      flex: 1, padding: "10px 12px", borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
                      color: "#e6edf3", fontSize: 14, outline: "none",
                    }}
                  />
                  <button type="button" onClick={sendChat} disabled={!connected} style={{
                    padding: "10px 16px", borderRadius: 10, border: "none",
                    background: connected ? "#0ecb81" : "#21262d", color: "#fff", fontWeight: 700, fontSize: 13,
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

const primary: React.CSSProperties = {
  width: "100%", padding: 14, borderRadius: 12, border: "none",
  background: "linear-gradient(135deg, #0ecb81, #0ba86a)",
  color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer",
};
const link: React.CSSProperties = {
  background: "none", border: "none", color: "#8b949e", fontSize: 13, cursor: "pointer",
};

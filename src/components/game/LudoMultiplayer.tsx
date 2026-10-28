import { useEffect, useState, useRef } from "react";
import { getSocket, getSocketUrl } from "../../lib/socket";
import { useAuth } from "../../game/auth";
import { useGame } from "../../game/store";
import { formatCoins } from "../../game/logic";

type Room = {
  code: string;
  stake: number;
  goal: number;
  status: "waiting" | "playing" | "finished";
  players: { id: string; name: string; pos: number }[];
  turn: number;
  winner: string | null;
  lastDice: number | null;
  hostId: string;
};

type ChatMsg = {
  id: string;
  userId: string;
  name: string;
  text: string;
  time: number;
  system?: boolean;
};

export function LudoMultiplayer({ onBack }: { onBack: () => void }) {
  const user = useAuth((s) => s.user);
  const balance = useGame((s) => s.balance);
  const tryPlaceStake = useGame((s) => s.tryPlaceStake);
  const creditWin = useGame((s) => s.creditWin);
  const recordBet = useGame((s) => s.recordBet);

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [stake, setStake] = useState(100);
  const [room, setRoom] = useState<Room | null>(null);
  const [myId, setMyId] = useState("");
  const [rolling, setRolling] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatText, setChatText] = useState("");
  const [showChat, setShowChat] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const s = getSocket();
    const onConnect = () => {
      setConnected(true);
      setMyId(s.id || "");
      setError("");
    };
    const onDisconnect = () => setConnected(false);
    const onUpdate = (r: Room) => setRoom(r);
    const onStarted = (r: Room) => setRoom(r);
    const onChat = (msg: ChatMsg) => {
      setMessages((prev) => [...prev, msg].slice(-80));
    };
    const onOver = ({ room: r, winnerId }: { room: Room; winnerId: string }) => {
      setRoom(r);
      if (!r) return;
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
    s.on("room_update", onUpdate);
    s.on("game_started", onStarted);
    s.on("game_over", onOver);
    s.on("chat_message", onChat);

    if (!s.connected) s.connect();
    else onConnect();

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("room_update", onUpdate);
      s.off("game_started", onStarted);
      s.off("game_over", onOver);
      s.off("chat_message", onChat);
    };
  }, [creditWin, recordBet]);

  const name = user?.name || "Player";

  const createRoom = () => {
    setError("");
    setMessages([]);
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
      setRoom(res.room);
      setMyId(s.id || "");
      setMessages([
        {
          id: "welcome",
          userId: "system",
          name: "System",
          text: "Room created. Share the code with friends.",
          time: Date.now(),
          system: true,
        },
      ]);
    });
  };

  const joinRoom = () => {
    setError("");
    setMessages([]);
    const s = getSocket();
    if (!s.connected) s.connect();
    s.emit("join_room", { code: joinCode.trim(), name }, (res: any) => {
      if (!res?.ok) {
        setError(res?.error || "Join failed");
        return;
      }
      const r = res.room as Room;
      if (r.stake > 0) {
        if (r.stake > balance || !tryPlaceStake(r.stake)) {
          setError("Need ₹" + r.stake + " to join");
          s.emit("leave_room");
          return;
        }
      }
      setRoom(r);
      setMyId(s.id || "");
    });
  };

  const startGame = () => {
    getSocket().emit("start_game", (res: any) => {
      if (!res?.ok) setError(res?.error || "Start failed");
    });
  };

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    getSocket().emit("roll_dice", (res: any) => {
      setRolling(false);
      if (!res?.ok) setError(res?.error || "Roll failed");
    });
  };

  const sendChat = () => {
    const text = chatText.trim();
    if (!text) return;
    setChatText("");
    getSocket().emit("chat_message", { text }, (res: any) => {
      if (!res?.ok) setError(res?.error || "Chat failed");
    });
  };

  const leave = () => {
    getSocket().emit("leave_room");
    setRoom(null);
    setMessages([]);
    onBack();
  };

  const isHost = room && room.hostId === myId;
  const myTurn =
    room &&
    room.status === "playing" &&
    room.players[room.turn]?.id === myId;

  return (
    <div style={{ padding: "16px 16px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Ludo Online</h2>
        <button type="button" onClick={leave} style={link}>← Back</button>
      </div>

      <div style={{ fontSize: 12, marginBottom: 12, color: connected ? "#0ecb81" : "#f6465d" }}>
        {connected ? "● Connected" : "● Connecting..."}
      </div>

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
            <button type="button" onClick={createRoom} style={primary}>Create Room</button>
          </div>

          <div style={{ ...card, marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Join Room</div>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Room code"
              style={input}
            />
            <button type="button" onClick={joinRoom} style={primary}>Join</button>
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

            <div style={{ marginBottom: 12 }}>
              {room.players.map((p) => (
                <div key={p.id} style={{
                  display: "flex", justifyContent: "space-between", padding: "8px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 14,
                }}>
                  <span>
                    {p.id === myId ? "You" : p.name}
                    {p.id === room.hostId ? " 👑" : ""}
                    {room.status === "playing" && room.players[room.turn]?.id === p.id ? " ← turn" : ""}
                  </span>
                  <span style={{ fontWeight: 800, color: p.id === myId ? "#0ecb81" : "#e6edf3" }}>
                    {p.pos}/{room.goal}
                  </span>
                </div>
              ))}
            </div>

            {room.lastDice != null && (
              <div style={{ textAlign: "center", fontSize: 32, fontWeight: 900, marginBottom: 10 }}>
                🎲 {room.lastDice}
              </div>
            )}

            {room.status === "waiting" && isHost && (
              <button type="button" onClick={startGame} style={primary} disabled={room.players.length < 2}>
                {room.players.length < 2 ? "Waiting for players..." : "Start Game"}
              </button>
            )}
            {room.status === "waiting" && !isHost && (
              <div style={{ textAlign: "center", color: "#8b949e", fontSize: 13 }}>Waiting for host...</div>
            )}
            {room.status === "playing" && (
              <button type="button" onClick={roll} disabled={!myTurn || rolling} style={primary}>
                {!myTurn ? "Opponent turn" : rolling ? "Rolling..." : "Roll Dice"}
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

          {/* Chat */}
          <div style={{ ...card, marginTop: 12, padding: 0, overflow: "hidden" }}>
            <button
              type="button"
              onClick={() => setShowChat((v) => !v)}
              style={{
                width: "100%", padding: "12px 16px", border: "none",
                background: "rgba(255,255,255,0.03)", color: "#e6edf3",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
                display: "flex", justifyContent: "space-between",
              }}
            >
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
                        <div style={{ textAlign: "center", fontSize: 11, color: "#6e7681" }}>
                          {m.text}
                        </div>
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
                          }}>
                            {m.text}
                          </span>
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
                    placeholder="Type a message..."
                    maxLength={200}
                    style={{
                      flex: 1, padding: "10px 12px", borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)", color: "#e6edf3",
                      fontSize: 14, outline: "none",
                    }}
                  />
                  <button type="button" onClick={sendChat} style={{
                    padding: "10px 16px", borderRadius: 10, border: "none",
                    background: "#0ecb81", color: "#fff", fontWeight: 700,
                    fontSize: 13, cursor: "pointer",
                  }}>
                    Send
                  </button>
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

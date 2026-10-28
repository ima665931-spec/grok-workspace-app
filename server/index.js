import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
app.get("/", (_, res) => {
  res.json({ ok: true, service: "BetRush Multiplayer", rooms: rooms.size });
});
app.get("/health", (_, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

/** @type {Map<string, any>} */
const rooms = new Map();

function code() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function publicRoom(room) {
  return {
    code: room.code,
    stake: room.stake,
    goal: room.goal,
    status: room.status,
    players: room.players,
    turn: room.turn,
    winner: room.winner,
    lastDice: room.lastDice,
    hostId: room.hostId,
  };
}

io.on("connection", (socket) => {
  console.log("connect", socket.id);

  socket.on("create_room", ({ name, stake }, cb) => {
    const roomCode = code();
    const player = { id: socket.id, name: name || "Player", pos: 0 };
    const room = {
      code: roomCode,
      stake: Math.max(0, Number(stake) || 0),
      goal: 50,
      status: "waiting",
      players: [player],
      turn: 0,
      winner: null,
      lastDice: null,
      hostId: socket.id,
      messages: [],
    };
    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerName = name || "Player";
    cb?.({ ok: true, room: publicRoom(room) });
  });

  socket.on("join_room", ({ code: roomCode, name }, cb) => {
    const key = String(roomCode || "").toUpperCase();
    const room = rooms.get(key);
    if (!room) return cb?.({ ok: false, error: "Room not found" });
    if (room.status !== "waiting") return cb?.({ ok: false, error: "Game already started" });
    if (room.players.length >= 4) return cb?.({ ok: false, error: "Room full" });
    if (room.players.some((p) => p.id === socket.id))
      return cb?.({ ok: true, room: publicRoom(room) });

    room.players.push({ id: socket.id, name: name || "Player", pos: 0 });
    socket.join(key);
    socket.data.roomCode = key;
    socket.data.playerName = name || "Player";

    // system message
    const joinMsg = {
      id: Date.now().toString(36),
      userId: "system",
      name: "System",
      text: `${name || "Player"} joined the room`,
      time: Date.now(),
      system: true,
    };
    room.messages = [...(room.messages || []), joinMsg].slice(-50);
    io.to(key).emit("chat_message", joinMsg);
    io.to(key).emit("room_update", publicRoom(room));
    cb?.({ ok: true, room: publicRoom(room) });
  });

  socket.on("chat_message", ({ text }, cb) => {
    const key = socket.data.roomCode;
    const room = rooms.get(key);
    if (!room) return cb?.({ ok: false, error: "Not in a room" });

    const clean = String(text || "").trim().slice(0, 200);
    if (!clean) return cb?.({ ok: false, error: "Empty message" });

    const msg = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      userId: socket.id,
      name: socket.data.playerName || "Player",
      text: clean,
      time: Date.now(),
      system: false,
    };
    room.messages = [...(room.messages || []), msg].slice(-50);
    io.to(key).emit("chat_message", msg);
    cb?.({ ok: true });
  });

  socket.on("start_game", (cb) => {
    const key = socket.data.roomCode;
    const room = rooms.get(key);
    if (!room) return cb?.({ ok: false, error: "No room" });
    if (room.hostId !== socket.id) return cb?.({ ok: false, error: "Only host can start" });
    if (room.players.length < 2) return cb?.({ ok: false, error: "Need at least 2 players" });

    room.status = "playing";
    room.turn = 0;
    room.winner = null;
    room.lastDice = null;
    room.players.forEach((p) => (p.pos = 0));

    const sys = {
      id: Date.now().toString(36),
      userId: "system",
      name: "System",
      text: "Game started! Good luck.",
      time: Date.now(),
      system: true,
    };
    room.messages = [...(room.messages || []), sys].slice(-50);
    io.to(key).emit("chat_message", sys);
    io.to(key).emit("room_update", publicRoom(room));
    io.to(key).emit("game_started", publicRoom(room));
    cb?.({ ok: true });
  });

  socket.on("roll_dice", (cb) => {
    const key = socket.data.roomCode;
    const room = rooms.get(key);
    if (!room || room.status !== "playing") return cb?.({ ok: false, error: "Not playing" });

    const current = room.players[room.turn];
    if (!current || current.id !== socket.id)
      return cb?.({ ok: false, error: "Not your turn" });

    const dice = Math.floor(Math.random() * 6) + 1;
    room.lastDice = dice;
    current.pos = Math.min(room.goal, current.pos + dice);

    if (current.pos >= room.goal) {
      room.status = "finished";
      room.winner = current.id;
      const sys = {
        id: Date.now().toString(36),
        userId: "system",
        name: "System",
        text: `${current.name} won the game!`,
        time: Date.now(),
        system: true,
      };
      room.messages = [...(room.messages || []), sys].slice(-50);
      io.to(key).emit("chat_message", sys);
      io.to(key).emit("room_update", publicRoom(room));
      io.to(key).emit("game_over", { winnerId: current.id, room: publicRoom(room) });
      cb?.({ ok: true, dice });
      return;
    }

    room.turn = (room.turn + 1) % room.players.length;
    io.to(key).emit("room_update", publicRoom(room));
    cb?.({ ok: true, dice });
  });

  socket.on("leave_room", () => {
    leaveRoom(socket);
  });

  socket.on("disconnect", () => {
    leaveRoom(socket);
  });
});

function leaveRoom(socket) {
  const key = socket.data.roomCode;
  if (!key) return;
  const room = rooms.get(key);
  if (!room) return;

  const leavingName = socket.data.playerName || "Player";
  room.players = room.players.filter((p) => p.id !== socket.id);
  socket.leave(key);
  socket.data.roomCode = null;

  if (room.players.length === 0) {
    rooms.delete(key);
    return;
  }

  const leaveMsg = {
    id: Date.now().toString(36),
    userId: "system",
    name: "System",
    text: `${leavingName} left the room`,
    time: Date.now(),
    system: true,
  };
  room.messages = [...(room.messages || []), leaveMsg].slice(-50);
  io.to(key).emit("chat_message", leaveMsg);

  if (room.hostId === socket.id) {
    room.hostId = room.players[0].id;
  }
  if (room.turn >= room.players.length) room.turn = 0;

  if (room.status === "playing" && room.players.length < 2) {
    room.status = "finished";
    room.winner = room.players[0]?.id || null;
    io.to(key).emit("game_over", { winnerId: room.winner, room: publicRoom(room) });
  }

  io.to(key).emit("room_update", publicRoom(room));
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`BetRush multiplayer on :${PORT}`);
});

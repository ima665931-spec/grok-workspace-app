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

function token() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function snapshot(room) {
  return {
    code: room.code,
    stake: room.stake,
    goal: room.goal,
    status: room.status,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      pos: p.pos,
      token: p.token,
      connected: p.connected !== false,
    })),
    turn: room.turn,
    turnPlayerId: room.players[room.turn]?.id || null,
    winner: room.winner,
    lastDice: room.lastDice,
    hostId: room.hostId,
    messages: (room.messages || []).slice(-40),
    updatedAt: Date.now(),
  };
}

function broadcastState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const state = snapshot(room);
  io.to(roomCode).emit("game_state", state);
  io.to(roomCode).emit("room_update", state);
}

io.on("connection", (socket) => {
  console.log("connect", socket.id);

  socket.on("create_room", ({ name, stake }, cb) => {
    const roomCode = code();
    const playerToken = token();
    const player = {
      id: socket.id,
      token: playerToken,
      name: name || "Player",
      pos: 0,
      connected: true,
    };
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
      messages: [
        {
          id: "welcome",
          userId: "system",
          name: "System",
          text: "Room created. Share the code with friends.",
          time: Date.now(),
          system: true,
        },
      ],
    };
    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerName = name || "Player";
    socket.data.playerToken = playerToken;
    const state = snapshot(room);
    cb?.({ ok: true, room: state, playerToken });
    socket.emit("game_state", state);
  });

  socket.on("join_room", ({ code: roomCode, name, playerToken }, cb) => {
    const key = String(roomCode || "").toUpperCase();
    const room = rooms.get(key);
    if (!room) return cb?.({ ok: false, error: "Room not found" });

    // --- Rejoin existing player by token (works mid-game) ---
    if (playerToken) {
      const existing = room.players.find((p) => p.token === playerToken);
      if (existing) {
        const oldId = existing.id;
        existing.id = socket.id;
        existing.connected = true;
        existing.name = name || existing.name;

        // fix host / turn references if socket id changed
        if (room.hostId === oldId) room.hostId = socket.id;
        if (room.winner === oldId) room.winner = socket.id;

        socket.join(key);
        socket.data.roomCode = key;
        socket.data.playerName = existing.name;
        socket.data.playerToken = playerToken;

        const state = snapshot(room);
        cb?.({ ok: true, room: state, playerToken });
        broadcastState(key);
        return;
      }
    }

    // --- New join only while waiting ---
    if (room.status !== "waiting") {
      return cb?.({ ok: false, error: "Game already started" });
    }
    if (room.players.length >= 4) return cb?.({ ok: false, error: "Room full" });
    if (room.players.some((p) => p.id === socket.id)) {
      return cb?.({ ok: true, room: snapshot(room), playerToken: socket.data.playerToken });
    }

    const newToken = token();
    room.players.push({
      id: socket.id,
      token: newToken,
      name: name || "Player",
      pos: 0,
      connected: true,
    });
    room.messages = [
      ...(room.messages || []),
      {
        id: Date.now().toString(36),
        userId: "system",
        name: "System",
        text: `${name || "Player"} joined the room`,
        time: Date.now(),
        system: true,
      },
    ].slice(-50);

    socket.join(key);
    socket.data.roomCode = key;
    socket.data.playerName = name || "Player";
    socket.data.playerToken = newToken;

    const state = snapshot(room);
    cb?.({ ok: true, room: state, playerToken: newToken });
    socket.emit("game_state", state);
    broadcastState(key);
  });

  socket.on("request_sync", (cb) => {
    const key = socket.data.roomCode;
    const room = rooms.get(key);
    if (!room) return cb?.({ ok: false, error: "Not in a room" });
    const state = snapshot(room);
    socket.emit("game_state", state);
    cb?.({ ok: true, room: state });
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
    if (room.players.filter((p) => p.connected !== false).length < 2)
      return cb?.({ ok: false, error: "Need at least 2 players" });

    room.status = "playing";
    room.turn = 0;
    room.winner = null;
    room.lastDice = null;
    room.players.forEach((p) => (p.pos = 0));
    room.messages = [
      ...(room.messages || []),
      {
        id: Date.now().toString(36),
        userId: "system",
        name: "System",
        text: "Game started! Good luck.",
        time: Date.now(),
        system: true,
      },
    ].slice(-50);

    broadcastState(key);
    io.to(key).emit("game_started", snapshot(room));
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

    room.messages = [
      ...(room.messages || []),
      {
        id: Date.now().toString(36),
        userId: "system",
        name: "System",
        text: `${current.name} rolled ${dice} → ${current.pos}`,
        time: Date.now(),
        system: true,
      },
    ].slice(-50);

    if (current.pos >= room.goal) {
      room.status = "finished";
      room.winner = current.id;
      room.messages.push({
        id: Date.now().toString(36) + "w",
        userId: "system",
        name: "System",
        text: `${current.name} won the game!`,
        time: Date.now(),
        system: true,
      });
      broadcastState(key);
      io.to(key).emit("game_over", { winnerId: current.id, room: snapshot(room) });
      cb?.({ ok: true, dice, state: snapshot(room) });
      return;
    }

    // skip disconnected players on turn advance
    let next = (room.turn + 1) % room.players.length;
    let guard = 0;
    while (room.players[next]?.connected === false && guard < room.players.length) {
      next = (next + 1) % room.players.length;
      guard++;
    }
    room.turn = next;
    broadcastState(key);
    cb?.({ ok: true, dice, state: snapshot(room) });
  });

  socket.on("leave_room", () => {
    leaveRoom(socket, true);
  });

  socket.on("disconnect", () => {
    // soft leave — keep seat for reconnect
    leaveRoom(socket, false);
  });
});

function leaveRoom(socket, hard) {
  const key = socket.data.roomCode;
  if (!key) return;
  const room = rooms.get(key);
  if (!room) return;

  const leavingName = socket.data.playerName || "Player";
  const player = room.players.find((p) => p.id === socket.id);

  if (hard) {
    room.players = room.players.filter((p) => p.id !== socket.id);
    socket.data.playerToken = null;
  } else if (player) {
    player.connected = false;
  }

  socket.leave(key);
  socket.data.roomCode = null;

  const active = room.players.filter((p) => p.connected !== false);

  if (room.players.length === 0 || (hard && active.length === 0)) {
    // cleanup room if empty or all left hard
    if (room.players.length === 0) rooms.delete(key);
    else if (active.length === 0 && hard) rooms.delete(key);
    return;
  }

  room.messages = [
    ...(room.messages || []),
    {
      id: Date.now().toString(36),
      userId: "system",
      name: "System",
      text: hard ? `${leavingName} left the room` : `${leavingName} disconnected (can rejoin)`,
      time: Date.now(),
      system: true,
    },
  ].slice(-50);

  if (room.hostId === socket.id && active[0]) {
    room.hostId = active[0].id;
  }

  if (room.turn >= room.players.length) room.turn = 0;
  if (room.players[room.turn]?.connected === false) {
    let next = (room.turn + 1) % room.players.length;
    let guard = 0;
    while (room.players[next]?.connected === false && guard < room.players.length) {
      next = (next + 1) % room.players.length;
      guard++;
    }
    room.turn = next;
  }

  if (room.status === "playing" && active.length < 2) {
    room.status = "finished";
    room.winner = active[0]?.id || null;
    io.to(key).emit("game_over", { winnerId: room.winner, room: snapshot(room) });
  }

  broadcastState(key);
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`BetRush multiplayer on :${PORT}`);
});

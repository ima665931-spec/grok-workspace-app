# BetRush Multiplayer Server

## Local
```bash
cd server
npm install
npm start
```
Server: http://localhost:3001

## Deploy (Railway / Render)
1. Root directory: `server`
2. Start command: `npm start`
3. Set frontend env: `VITE_SOCKET_URL=https://your-server.up.railway.app`

## Events
- create_room / join_room / start_game / roll_dice / leave_room
- room_update / game_started / game_over

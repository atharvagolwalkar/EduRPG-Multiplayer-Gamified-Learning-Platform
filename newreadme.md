# ⚔️ EduRPG — Multiplayer Gamified Learning Platform

Turn studying into cooperative boss battles. Students form raid parties, answer academic questions to deal damage, and defeat subject-based monsters together in real time.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS, Zustand |
| Backend | Node.js, Express, Socket.io |
| Database | Firebase Firestore (Admin SDK) |
| Auth | Firebase Auth (client SDK) |
| Real-time | Socket.io `/raids` namespace |
| AI | Hugging Face (Mistral-7B) — narration & hints |
| Deploy | Vercel (frontend) + Render (backend) |

---

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/atharvagolwalkar/EduRPG-Multiplayer-Gamified-Learning-Platform
cd EduRPG-Multiplayer-Gamified-Learning-Platform

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

**Backend** — copy and fill in:
```bash
cp backend/.env.example backend/.env
```
Required vars: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
Optional: `HUGGING_FACE_API_KEY` (fallback narration works without it)

**Frontend** — copy and fill in:
```bash
cp frontend/.env.local.example frontend/.env.local
```
Required: all `NEXT_PUBLIC_FIREBASE_*` vars + `NEXT_PUBLIC_API_URL=http://localhost:5000`

### 3. Run

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Frontend: http://localhost:3000  
Backend health: http://localhost:5000/health

---

## Deploy

### Backend → Render

1. Push repo to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Root directory: `backend`, Build: `npm install`, Start: `npm start`
4. Add env vars in the Render dashboard (Environment tab)
5. Copy the service URL (e.g. `https://edurpg-backend.onrender.com`)

### Frontend → Vercel

```bash
cd frontend
npx vercel deploy
```

Set `NEXT_PUBLIC_API_URL` to your Render URL in Vercel's Environment Variables.

---

## Architecture

```
Browser (Next.js)
  │
  ├── REST API (/api/*)          → Express routes → Firestore
  └── WebSocket (/raids NS)      → Socket.io → in-memory + Firestore
          │
          ├── raid:join           join / create raid room
          ├── raid:answer         submit answer → damage calc → broadcast
          ├── raid:damage         live HP update to all players
          ├── raid:tick           countdown timer broadcast
          └── raid:end            victory / defeat + XP award
```

---

## Key files

```
backend/src/
  server.js                   Express + Socket.io entry
  multiplayer-websocket.js    /raids namespace — game logic
  websocket.js                / namespace — lobby/guilds
  firebase.js                 Admin SDK init (mock fallback)
  routes/firebaseRoutes.js    REST endpoints
  services/FirebaseService.js User / Raid / Guild / Leaderboard

frontend/src/
  app/page.tsx                Hero select + hub
  app/raid/page.tsx           Battle UI (HP bars, timer, questions)
  app/guild/page.tsx          Guild hall
  app/profile/page.tsx        Skill tree + stats + raid history
  app/leaderboard/page.tsx    Global / weekly / guild rankings
  lib/websocket.ts            Socket.io client (two namespaces)
  lib/useMultiplayer.ts       React hook for raid socket
  lib/useAPI.ts               REST API hooks
  lib/store.ts                Zustand global state
  lib/gameEngine.ts           Questions, damage calc, difficulty
  lib/progression.ts          Mastery score helpers
```

---

## Firebase mock mode

If Firebase credentials are not configured, the backend falls back to an in-memory mock store. Everything works for local testing but **data does not persist between restarts**. Check `/health` for mode status.
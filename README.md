# ⚔️ EduRPG – Multiplayer Gamified Learning Platform

**Turn studying into an epic multiplayer adventure.**

Transform learning into collaborative battles where students defeat monsters by solving academic challenges, join guilds, unlock skill trees, and raid together in real-time.

---

## 🎮 Quick Start (24-Hour Hackathon Edition)

### Prerequisites
- Node.js 18+ and npm
- Firebase account (free tier sufficient)
- Git

### Installation

```bash
# 1. Clone/open this repo
cd eduplatform

# 2. Install dependencies
cd frontend && npm install
cd ../backend && npm install

# 3. Set up environment variables
# Frontend: Create frontend/.env.local
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
NEXT_PUBLIC_API_URL=http://localhost:5000

# Backend: Create backend/.env
FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
FIREBASE_PRIVATE_KEY=YOUR_PRIVATE_KEY
FIREBASE_CLIENT_EMAIL=YOUR_CLIENT_EMAIL
PORT=5000
NODE_ENV=development
```

### Running Locally

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Frontend opens at http://localhost:3000
```

---

## 🏗️ Project Architecture

```
eduplatform/
├── frontend/                 # Next.js React app
│   ├── src/
│   │   ├── app/             # Pages (home, raid, guild, profile)
│   │   ├── components/      # Reusable UI (Hero, Monster, RaidBoard)
│   │   └── lib/             # Utilities (Firebase, WebSocket, game logic)
│   └── package.json
│
├── backend/                  # Node.js/Express + Socket.io
│   ├── src/
│   │   ├── routes/          # REST API routes
│   │   ├── services/        # Business logic (raid engine, guild service)
│   │   ├── websocket.js     # WebSocket handlers
│   │   └── server.js        # Express + Socket.io entry
│   └── package.json
│
└── README.md
```

---

## 📋 Core Features (MVP)

### 1. ⚔️ Real-Time Multiplayer Raids
- Teams of 3–5 answer questions to defeat boss monsters
- Live HP bars, combo streaks, damage floats via WebSocket
- 3-minute raid timer
- Correct answer = 10 damage + streak counter
- Streak bonus = +5 damage (max 3× at 10-streak)

### 2. 🏛️ Guild System
- Create/join guilds (max 50 members)
- Guild XP pool (shared progress)
- Community leaderboard
- Guild achievements

### 3. 🗡️ Hero Classes & Skill Trees
- **Mage** (Math focus) - High spell power
- **Engineer** (Programming) - High defense
- **Scientist** (Physics/Data) - Balanced
- Unlock skills by reaching level thresholds

### 4. 🎯 Adaptive Difficulty
- Tracks accuracy % per student
- Adjusts next question difficulty
- Hints available for struggling students

### 5. 📊 Progress Tracking
- Experience points → Levels
- Achievement badges
- Leaderboards (global, guild, weekly)

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | Next.js 14, React, Tailwind CSS, Socket.io Client |
| **Backend** | Node.js, Express, Socket.io |
| **Database** | Firebase Realtime DB + Firestore |
| **Auth** | Firebase Auth |
| **Real-time** | WebSockets (Socket.io) |
| **Hosting** | Vercel (frontend), Firebase (backend) |

---

## 📡 API Overview

### REST Endpoints
```
POST   /api/auth/register       - Register user
POST   /api/auth/login          - Login user
GET    /api/user/profile        - Get user profile
POST   /api/guild/create        - Create guild
POST   /api/guild/join          - Join guild
GET    /api/leaderboard         - Get rankings
```

### WebSocket Events
```
raid:start           - Initiate raid
raid:answer          - Submit question answer
raid:damage          - Damage update (broadcasted)
raid:end             - Raid complete
player:join          - Player joins raid
player:leave         - Player leaves raid
```

---

## 🎯 24-Hour Hackathon Timeline

| Time | Task | Owner |
|------|------|-------|
| 0–1h | Setup project, Firebase config | You |
| 1–3h | Hero select + basic UI | UX focus |
| 3–6h | Single-player raid loop (no multiplayer yet) | Core gameplay |
| 6–8h | WebSocket setup + test with 2 players | Real-time |
| 8–12h | Guild system + leaderboards | Features |
| 12–18h | Polish UI, animations, edge cases | UX |
| 18–24h | Deploy to Vercel, test live, final polish | Demo ready |

---

## 🚀 Deployment

### Frontend (Vercel - Free)
```bash
npm run build
vercel deploy
```

### Backend (Firebase Functions or Render - Free)
Deploy `backend/` folder or run on local machine during demo.

---

## 📝 Key Files to Know

- `frontend/src/app/page.tsx` - Home page (hero select)
- `frontend/src/app/raid/page.tsx` - Raid battle screen
- `frontend/src/lib/websocket.ts` - Socket.io client setup
- `backend/src/server.js` - Express + Socket.io server
- `backend/src/websocket.js` - Real-time game logic
- `frontend/src/lib/firebase.ts` - Firebase initialization

---

## 🎨 UI/UX Priorities

For maximum hackathon impact:
1. **Hero Select Screen** - Visually striking (character art, class descriptions)
2. **Raid Battle UI** - Large HP bars, combo counter, live updates
3. **Leaderboard** - Show top 10, animated rank changes
4. **Guild Page** - Member list, shared progress bar
5. **Mobile Responsive** - Touch-friendly buttons

---

## 💡 Judging Tips

- **Innovation**: Focus on real-time collaborative gameplay (not just quiz app)
- **Impact**: Show how multiplayer increases engagement vs solo apps
- **Execution**: Working demo > perfect code (speed matters)
- **Polish**: Animations, feedback, sound effects (if time)
- **Storytelling**: Narrate battles, celebrate victories, build atmosphere

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Firebase connection fails | Check `.env.local` variables |
| WebSocket events not firing | Verify backend Socket.io is running on `:5000` |
| Raids not updating live | Check Network tab for WebSocket connection |
| Build errors | Delete `node_modules/` and reinstall |

---

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Socket.io Docs](https://socket.io/docs/)
- [Firebase Console](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Built for a 24-hour hackathon. Let's make learning epic! 🚀**

For questions, check the docs or ask your team.

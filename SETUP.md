# 🚀 Getting Started with EduRPG

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend (in new terminal)
cd backend
npm install
```

### 2. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev
# Expected: Server running on http://localhost:5000

# Terminal 2: Frontend
cd frontend
npm run dev
# Expected: App running on http://localhost:3000
```

### 3. Open Browser
Navigate to **http://localhost:3000** and start playing!

---

## 📁 Project Structure

```
eduplatform/
├── frontend/                 # Next.js 14 (React)
│   ├── src/
│   │   ├── app/             # Pages (home, raid, guild, profile, leaderboard)
│   │   ├── components/      # React components (Hero, HPBar, Questions)
│   │   └── lib/             # Utilities (Firebase, WebSocket, Game Logic)
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   └── tailwind.config.js
│
├── backend/                  # Node.js + Express + Socket.io
│   ├── src/
│   │   ├── server.js        # Express + Socket.io setup
│   │   └── websocket.js     # Real-time game logic
│   ├── package.json
│   └── .env
│
├── README.md
└── .gitignore
```

---

## 🎮 Core Pages

### Home (`/`)
- Hero selection screen
- Character class preview
- Main menu (Start Raid, Guild, Leaderboard, Profile)

### Raid (`/raid`)
- Real-time multiplayer battle
- Question answering
- HP bars with animations
- Streak tracking
- Monster damage visualization

### Guild (`/guild`)
- Browse available guilds
- Create or join guild
- Guild member list
- Guild XP tracking

### Leaderboard (`/leaderboard`)
- Top 10 global rankings
- Player XP display
- Guild affiliation
- Real-time updates

### Profile (`/profile`)
- Player stats
- Experience tracking
- Achievement badges
- Hero information

---

## 🔧 Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 14, React 18, Tailwind CSS |
| **State** | Zustand (lightweight store) |
| **Real-time** | Socket.io (WebSocket fallback) |
| **Backend** | Node.js + Express |
| **Database** | Firebase (Realtime DB + Firestore) |
| **Authentication** | Firebase Auth |

---

## 📡 WebSocket Events

### Client → Server

```javascript
// Join a raid
socket.emit('raid:join', { raidId, player });

// Answer question
socket.emit('raid:answer', { raidId, isCorrect, damage, playerId });

// Create guild
socket.emit('guild:create', { name, creator });

// Join guild
socket.emit('guild:join', { guildId, player });

// Get raid list
socket.emit('raids:list');

// Get guild list
socket.emit('guilds:list');
```

### Server → Client

```javascript
// Player joined raid
socket.on('raid:player-joined', { players, message });

// Damage dealt/received
socket.on('raid:damage', { type, damage, monsterHp, streak });

// Raid ended
socket.on('raid:end', { status, xpReward });

// Guild created
socket.on('guild:created', guild);

// Guild updated
socket.on('guild:updated', { guild, event });

// List updates
socket.on('raids:data', raidsList);
socket.on('guilds:data', guildsList);
```

---

## 🎯 Game Logic

### Battle System
1. Player selects hero and topic
2. Raid boss spawns with 100 HP
3. Each correct answer = 10–30 damage (30 for critical hits)
4. Streak bonus: +5% damage per correct answer (max 3×)
5. Wrong answer = -20 team HP, streak resets
6. Raid ends when: Boss HP = 0 (Victory) or Team HP = 0 (Defeat)

### XP System
- Correct answer: +10 XP
- Critical hit: +5 bonus XP
- Boss defeat: +100 XP
- Level up formula: `Level = floor(sqrt(XP / 100))`

### Hero Classes

| Class | Subject | Attack | Defense | HP | Skill |
|-------|---------|--------|---------|----|----|
| 🔮 Mage | Math | 30 | 8 | 90 | Hint Spell |
| ⚙️ Engineer | Programming | 25 | 15 | 110 | Shield |
| 🔬 Scientist | Physics/Data | 22 | 12 | 100 | Analyze |

---

## 🚀 Deployment (24-Hour Hackathon)

### Option 1: Local Demo (Fastest)
Simply run `npm run dev` in both folders and show the judges your local machine.

### Option 2: Vercel + Render
```bash
# Frontend: Deploy to Vercel
cd frontend
vercel deploy

# Backend: Deploy to Render or Firebase Functions
cd backend
# Follow provider's instructions
```

### Option 3: Firebase Hosting
```bash
npm install -g firebase-tools
firebase deploy
```

---

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| `Module not found` | Run `npm install` in both directories |
| `Cannot find page` | Check file is in `src/app/` |
| `WebSocket won't connect` | Ensure backend is running on `:5000` |
| `Tailwind not loading` | Delete `.next/` folder and rebuild |
| `Port 3000 already in use` | Run `lsof -ti:3000 \| xargs kill` or use `npm run dev -- -p 3001` |

---

## 📝 Files You'll Edit Most

1. **Game Logic**: `frontend/src/lib/gameEngine.ts`
2. **UI Components**: `frontend/src/components/*.tsx`
3. **Pages**: `frontend/src/app/*/page.tsx`
4. **WebSocket**: `backend/src/websocket.js`
5. **Styling**: `frontend/src/app/globals.css` + Tailwind

---

## 💡 Quick Wins (24-Hour Priorities)

✅ **Phase 1 (0-3h)**: Get hero select + raid loop working
✅ **Phase 2 (3-6h)**: Add question feedback + damage animation
✅ **Phase 3 (6-9h)**: Polish UI with Tailwind + animations
✅ **Phase 4 (9-12h)**: Connect WebSocket for multiplayer
✅ **Phase 5 (12-24h)**: Deploy + test on live URL

---

## 🎨 UI Tips

- Use the hero emoji icons for visual appeal
- Add animations for HP bars and damage floats
- Color-code buttons (Green = Success, Red = Danger, Blue = Info)
- Mobile-first responsive design (Tailwind is your friend!)

---

## 🤔 Need Help?

- Check `README.md` for overview
- Check component comments for usage
- Look at existing pages as examples
- Test WebSocket in browser DevTools → Network → WS

---

**You got this! Let's build an epic learning platform! 🚀**

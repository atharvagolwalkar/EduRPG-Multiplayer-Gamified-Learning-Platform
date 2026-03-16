# 🚀 Firebase + Multiplayer Integration Guide

## What's Been Added

### Backend Infrastructure
- **Firebase Service Layer** (`backend/src/services/FirebaseService.js`)
  - User management (create, get, add XP, leaderboard)
  - Raid management (start, update, end, history)
  - Guild management (create, members, XP tracking)
  - Leaderboard queries (global, weekly, guild-based)

- **API Routes** (`backend/src/routes/firebaseRoutes.js`)
  - 20+ REST endpoints for Firebase operations
  - All data persists to Firestore

- **Multiplayer WebSocket** (`backend/src/multiplaya-websocket.js`)
  - Real-time raid synchronization
  - Player state sharing
  - Damage/HP broadcasting
  - Victory/Defeat handling
  - XP distribution

### Frontend Hooks
- **useUser()** - User CRUD + XP management
- **useLeaderboard()** - Fetch global/weekly/guild rankings
- **useRaid()** - Raid lifecycle management
- **useGuild()** - Guild operations
- **useMultiplayerRaid()** - Real-time WebSocket for raids

---

## 🔧 Setup Instructions

### 1. Add Firebase Service Account

Download from Firebase Console:
```bash
# Firebase Console → Project Settings → Service Accounts
# Download JSON and save as:
cp serviceAccountKey.json backend/
```

**OR use environment variables** (for deployment):
```bash
# backend/.env
FIREBASE_PROJECT_ID=edurpg-7f7c4
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@edurpg-7f7c4.iam.gserviceaccount.com"
```

### 2. Update Backend Server

Your server already has the integrations! Just ensure:
```bash
npm install firebase-admin
npm run dev
```

Verify all 3 endpoints:
- `http://localhost:5000/health` → Should show `"firebase": "connected"`
- WebSocket on `/raids` namespace
- REST API routes working

### 3. Frontend: Use the Hooks

```tsx
import { useUser, useLeaderboard, useMultiplayerRaid } from '@/lib/useAPI';
import { useMultiplayerRaid } from '@/lib/useMultiplayer';

export default function MyComponent() {
  const { createUser, addXP } = useUser();
  const { fetchGlobal } = useLeaderboard();
  const { joinRaid, submitAnswer, onDamage } = useMultiplayerRaid(raidId);

  // Your component logic...
}
```

---

## 📡 Real-Time Raid Flow

### Player 1 Joins Raid
```
1. Client: socket.emit('raid:join', { raidId, player })
2. Backend: Creates raid in Firestore
3. Backend: Broadcasts to all in raid room
4. Client: Receives raid:player-joined event
5. UI: Shows other players in raid
```

### Player Answers Question
```
1. Client: socket.emit('raid:answer', { isCorrect, damage, streak })
2. Backend: 
   - Updates Firestore raid state
   - Calculates damage
   - Broadcasts raid:damage event
3. Client: Receives live HP updates
4. UI: Animates HP bars + damage floats
```

### Raid Ends
```
1. Backend: Detects monsterHp <= 0 OR teamHp <= 0
2. Backend:
   - Calls RaidService.endRaid()
   - Awards XP to all players
   - Updates guild XP (if applicable)
   - Persists to Firestore
3. Backend: Broadcasts raid:end event
4. Client: Shows victory/defeat screen
```

---

## 🗂️ Firestore Database Schema

```
└── edurpg-7f7c4
    ├── users/ (collection)
    │   └── {userId}
    │       ├── id: string
    │       ├── username: string
    │       ├── heroClass: 'mage' | 'engineer' | 'scientist'
    │       ├── level: number
    │       ├── xp: number (current)
    │       ├── totalXp: number
    │       ├── guildId: string (optional)
    │       ├── stats: { wins, losses, raidsCompleted, ... }
    │       └── createdAt: timestamp
    │
    ├── raids/ (collection)
    │   └── {raidId}
    │       ├── id: string
    │       ├── players: [{ id, username, heroClass }, ...]
    │       ├── monsterName: string
    │       ├── monsterHp: number
    │       ├── teamHp: number
    │       ├── status: 'active' | 'completed'
    │       ├── winner: userId (or null)
    │       ├── startTime: timestamp
    │       └── endTime: timestamp
    │
    ├── guilds/ (collection)
    │   └── {guildId}
    │       ├── id: string
    │       ├── name: string
    │       ├── leader: userId
    │       ├── members: [userId, ...]
    │       ├── memberCount: number
    │       ├── xp: number
    │       ├── level: number
    │       └── createdAt: timestamp
    │
    └── leaderboard/ (collection - computed)
        └── global
            └── {ranked entries}
```

---

## 🎮 Usage Examples

### Create User & Save to Firebase
```tsx
const { createUser } = useUser();

const user = await createUser({
  id: 'uuid-here',
  username: 'ShadowMage',
  email: 'player@example.com',
  heroClass: 'mage'
});
// ✓ User now in Firestore
```

### Start Multiplayer Raid
```tsx
const { startRaid } = useRaid();
const { joinRaid, onDamage, onRaidEnd } = useMultiplayerRaid(raidId);

const raid = await startRaid({
  players: [currentUser],
  monsterName: 'Calculus Titan',
  monsterMaxHp: 100,
});

// Join WebSocket room and listen for events
joinRaid(currentUser);

onDamage((data) => {
  console.log(`Monster HP: ${data.monsterHp}`);
  // Update UI
});

onRaidEnd((data) => {
  console.log(`Victory! XP: ${data.xpReward}`);
});
```

### Fetch Leaderboard
```tsx
const { fetchGlobal } = useLeaderboard();

const topPlayers = await fetchGlobal(10);
// Returns: [
//   { rank: 1, username: 'ShadowMage', totalXp: 5000, level: 12 },
//   ...
// ]
```

### Create Guild
```tsx
const { createGuild } = useGuild();

const guild = await createGuild({
  name: 'Elite Squad',
  description: 'Top students',
  leader: currentUserId
});
// ✓ Guild now in Firestore
```

---

## 📊 API Endpoints Reference

### User Endpoints
| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/users/create` | `{username, email, heroClass}` | User object |
| GET | `/api/users/:userId` | - | User object |
| PUT | `/api/users/:userId` | `{...updates}` | Updated user |
| POST | `/api/users/:userId/xp` | `{amount}` | `{newLevel, newTotalXp}` |

### Raid Endpoints
| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/raids/start` | `{players, monsterName, ...}` | Raid object |
| GET | `/api/raids/:raidId` | - | Raid object |
| PUT | `/api/raids/:raidId` | `{...updates}` | Updated raid |
| POST | `/api/raids/:raidId/end` | `{winnerId, xpReward}` | Raid object |
| GET | `/api/users/:userId/raids` | - | Raid history |

### Guild Endpoints
| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/guilds/create` | `{name, description, leader}` | Guild object |
| GET | `/api/guilds/:guildId` | - | Guild object |
| GET | `/api/guilds` | - | All guilds |
| POST | `/api/guilds/:guildId/members` | `{userId}` | Updated guild |
| DELETE | `/api/guilds/:guildId/members/:userId` | - | Updated guild |
| POST | `/api/guilds/:guildId/xp` | `{amount}` | Updated guild |

### Leaderboard Endpoints
| Method | Path | Query | Returns |
|--------|------|-------|---------|
| GET | `/api/leaderboard/global` | `?limit=10` | Top players |
| GET | `/api/leaderboard/weekly` | `?limit=10` | Weekly top |
| GET | `/api/leaderboard/guilds` | `?limit=10` | Top guilds |

---

## 🔄 WebSocket Events

### Server Emits
```js
// raid:player-joined
{ players: [...], message: "Player joined" }

// raid:damage
{ type: 'player-attack'|'monster-attack', damage, monsterHp, teamHp, streak }

// raid:end
{ status: 'victory'|'defeat', xpReward, totalDamage, correctAnswers }

// raid:player-left
{ playerId, message: "Player left" }
```

### Client Emits
```js
// raid:join
{ raidId, player: { id, username, heroClass } }

// raid:answer
{ raidId, isCorrect, damage, streak }
```

---

## 🚀 Next Steps for Hackathon

### Phase 1 (Done) ✓
- Firebase service layer
- Real-time WebSocket
- REST API routes

### Phase 2 (Ready to Code)
1. **Update Home page** to use `useUser().createUser()`
2. **Update Raid page** to use `useMultiplayerRaid()` hooks
3. **Update Leaderboard** to fetch from Firebase
4. **Update Profile** to show real user data
5. **Update Guild page** to show real guilds

### Phase 3 (Polish)
- Add loading states
- Error handling
- Retry logic
- Mobile optimization

### Phase 4 (Deploy)
- Download Firebase service account
- Deploy backend to Render
- Deploy frontend to Vercel
- Test live multiplayer

---

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| `serviceAccountKey.json not found` | Download from Firebase console and place in `backend/` |
| `CORS error` | Check `NEXT_PUBLIC_API_URL` matches backend URL |
| `WebSocket won't connect` | Verify backend running on `:5000`, check DevTools Network |
| `Firestore permission denied` | Check Firebase rules (development mode allows all) |
| `404 on API routes` | Ensure `setupFirebaseRoutes(app)` is called in server.js |

---

## 📝 Development Checklist

- [ ] Firebase console project created
- [ ] Service account key downloaded
- [ ] Backend dependencies installed (`npm install uuid firebase-admin`)
- [ ] Frontend hooks imported in components
- [ ] Home page creates users in Firestore
- [ ] Raid page syncs with WebSocket
- [ ] Leaderboard fetches from Firebase
- [ ] No console errors
- [ ] 2+ players can raid together
- [ ] XP awarded on victory
- [ ] Guilds persist to Firestore

---

**Ready to build! 🎮 Start with updating the Home page to use `useUser()` hooks.**

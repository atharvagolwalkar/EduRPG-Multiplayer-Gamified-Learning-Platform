# 🎯 Quick Reference Card

## 🚀 Get Started (5 Minutes)

```bash
# Terminal 1: Backend
cd backend && npm install && npm run dev

# Terminal 2: Frontend  
cd frontend && npm install && npm run dev

# Open: http://localhost:3000
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `frontend/src/app/page.tsx` | Home + Hero Select UI |
| `frontend/src/app/raid/page.tsx` | Battle gameplay |
| `frontend/src/lib/gameEngine.ts` | Damage calc, questions, hero stats |
| `frontend/src/lib/store.ts` | Game state (Zustand) |
| `backend/src/server.js` | Express + Socket.io setup |
| `backend/src/websocket.js` | Real-time event handlers |
| `frontend/src/app/globals.css` | Tailwind + animations |

## 🎮 Game Loop

```
1. Player selects hero (Mage/Engineer/Scientist)
2. Starts raid
3. Question appears
4. Player answers (4 choices)
5. If correct:
   - Monster takes damage
   - Streak +1
   - Damage multiplier = 1 + (streak * 0.1)
6. If wrong:
   - Player HP -20
   - Streak reset
7. Repeat until:
   - Monster HP = 0 (Victory)
   - Player HP = 0 (Defeat)
```

## 🎨 UI Components Ready

- ✓ `<HeroCard />` - Character selection
- ✓ `<HPBar />` - Health display with animation
- ✓ `<QuestionCard />` - Multiple choice questions
- ✓ `<StreakCounter />` - Combo display

## 📡 WebSocket Events

**Client emits:**
```js
socket.emit('raid:join', { raidId, player })
socket.emit('raid:answer', { raidId, isCorrect, damage, playerId })
```

**Server emits:**
```js
socket.on('raid:player-joined', data)
socket.on('raid:damage', data)
socket.on('raid:end', data)
```

## 🎨 Color Scheme

- Background: `#0f172a` (dark blue)
- Primary: `#6D28D9` (purple)
- Success: `#10b981` (green)
- Danger: `#ef4444` (red)
- Accent: `#fbbf24` (yellow)

## ✨ Animations

- HP bars: Smooth transition over 500ms
- Players: Scale up on hover (1.05x)
- Damage floats: Float up + fade (1s)
- Streak: Pulse + glow effect

## 🚀 Deployment

**Vercel (Frontend):**
```bash
cd frontend && vercel deploy --prod
```

**Render (Backend):**
- Push to GitHub
- Connect Render to repo
- Set `npm run dev` as start command

## 📊 Example API Response

```json
{
  "status": "ok",
  "message": "EduRPG Backend Running"
}
```

## 🐛 Debug Tips

```bash
# Test backend
curl http://localhost:5000/health

# Check frontend build
cd frontend && npm run build

# Watch for TypeScript errors
cd frontend && npx tsc --noEmit

# View logs
npm run dev -- --log-level debug
```

## 🎯 MVP Checklist

- [ ] Hero selection works
- [ ] Start raid button works
- [ ] Questions appear and update
- [ ] HP bars animate
- [ ] Correct answer damages monster
- [ ] Wrong answer damages player
- [ ] Battle declares winner
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Deploy URL works

---

**You got this! 24 hours, go build! 🚀**

# ⏱️ 24-Hour Hackathon Execution Plan

## 📊 Timeline Breakdown

### **HOUR 0-1: Setup & Project Initialization**
**Goal**: Get both servers running locally

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev
# Verify: curl http://localhost:5000/health

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
# Verify: Open http://localhost:3000
```

**Checklist**:
- ✓ No npm install errors
- ✓ Backend responds to health check
- ✓ Frontend loads home page
- ✓ Can navigate to Hero Select

---

### **HOUR 1-4: Core Gameplay Loop**
**Focus**: Single-player raid system (multiplayer can wait)

**Deliverables**:
1. Hero selection screen works
2. Raid page shows questions
3. Answering questions affects HP bars
4. Correct answers damage monster
5. Wrong answers damage player
6. Raid declares victory/defeat

**What to build**:
- ✓ Hero selection state management
- ✓ Question rendering + answer handling
- ✓ Damage calculation logic
- ✓ Battle end conditions

**UI Focus**: Make it feel **satisfying**
- Animate HP bar changes (smooth transitions)
- Show damage numbers floating up
- Color feedback (green = correct, red = wrong)

---

### **HOUR 4-6: Polish Single-Player**
**Focus**: Visual impact for judges

**Deliverables**:
1. Smooth animations on HP bars
2. Streak counter displays
3. Damage float animations
4. Monster portrait/name
5. Hero portrait/stats
6. Sound effects (optional, but impactful)

**UI Improvements**:
- Add character emojis as art
- Animate battle transitions
- Show battle results screen
- Add confetti on victory (check out https://www.npmjs.com/package/canvas-confetti)

---

### **HOUR 6-12: Multiplayer & Real-Time (Optional MVP)**
**Focus**: If time permits, add real-time features

**Deliverables**:
1. WebSocket connection working
2. Players can join same raid
3. Live HP bar updates for teammates
4. Shared monster health
5. Raid state synced across clients

**What to do**:
- Test WebSocket locally (2 browser windows)
- Broadcast damage events
- Update raid state in real-time

**If time runs out**: Leave as demo setup (judges love seeing architecture)

---

### **HOUR 12-18: Secondary Features**
**Priority Order**:

1. **Leaderboard** (Already built, just hook to data)
2. **Guild List** (Already built, just hook to data)
3. **Profile Page** (Already built, just hook to data)

**Focus on**: Making sure each page is production-ready

---

### **HOUR 18-24: Deploy & Polish**
**Final push**:

1. **Fix any bugs** (battle logic edge cases)
2. **Mobile responsiveness** (check on phone!)
3. **Performance** (test with slow network)
4. **Deploy to Vercel** (Frontend)
5. **Deploy Backend** (Render or Firebase)
6. **Test live URL** (Judges will test this!)

---

## 🎯 Minimum Viable Product (Must Have by Hour 6)

```
Homepage (Hero Select)
  ├─ Nice UI with 3 hero cards
  ├─ Username input
  └─ Start button

Battle Page
  ├─ Monster HP bar
  ├─ Player HP bar
  ├─ Question display
  ├─ 4 answer buttons
  ├─ Streak counter (if 3+)
  └─ Result message (Correct/Wrong)

Loop
  ├─ Correct answer = -damage to monster
  ├─ Wrong answer = -damage to player
  ├─ New question appears
  └─ Repeat until win/loss
```

**If you have this, you have a working game! 🎮**

---

## ✨ Nice-to-Have (If Time Permits)

```
Multiplayer Syncing
  └─ 2+ players in same raid
League/Guild System
  └─ Show top guilds
Progression System
  └─ Level up, unlock skills
Database Integration
  └─ Persist user data to Firebase
Mobile App
  └─ React Native version
```

---

## 🚀 Deployment Strategy

### **Option A: Local Demo (Safest)**
- Run `npm run dev` in both folders
- Show judges on your laptop
- No deployment risk
- ✓ Works offline

### **Option B: Vercel + Render (Professional)**
```bash
# Frontend
cd frontend
npm run build
vercel deploy --prod

# Backend
cd backend
# Push to GitHub
# Connect to Render
# Deploy
```

### **Option C: Firebase Hosting (Fastest)**
```bash
firebase deploy
```

---

## 🎨 Critical UI/UX Elements

### **Make It Feel Like an RPG**
1. **Hero Portraits**: Use emojis + colors
2. **Battle Effects**: Damage floats, HP animations
3. **Sound**: Even simple beeps matter
4. **Feedback**: Immediate response to clicks
5. **Progress Bars**: Show visual feedback

### **Color Scheme**
- **Background**: Dark blue/gray (#0f172a)
- **Primary**: Purple (#6D28D9)
- **Success**: Green (#10b981)
- **Danger**: Red (#ef4444)
- **Accent**: Yellow (#fbbf24)

### **Fonts**
- **Headers**: Bold, sans-serif
- **Body**: Medium, sans-serif
- **Buttons**: Semibold, uppercase

---

## 🔍 Judging Criteria (Typical Hackathon)

| Criteria | Weight | How to Score |
|----------|--------|-------------|
| **Innovation** | 25% | Real-time multiplayer + gamification |
| **Execution** | 25% | Smooth gameplay, no bugs |
| **Design** | 20% | Beautiful UI, satisfying animations |
| **Impact** | 20% | Shows how it solves the problem |
| **Completeness** | 10% | All features working end-to-end |

### **How to Win**:
- ✓ Show a WORKING demo
- ✓ Emphasize **multiplayer** (differentiator)
- ✓ Show smooth animations (visual impact)
- ✓ Tell a story (why EduRPG matters)

---

## 🐛 Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| Questions not showing | Check GameEngine imports |
| HP bars not animating | Verify Tailwind CSS loaded |
| WebSocket not connecting | Check backend on `:5000` |
| Mobile broken | Test with DevTools responsive mode |
| CI/CD failing | Commit to GitHub first |

---

## 📋 Final Checklist (2 Hours Before Submission)

- [ ] All pages load without errors
- [ ] Hero selection works
- [ ] Can start a raid
- [ ] Questions appear
- [ ] HP bars update
- [ ] Battle ends correctly
- [ ] Leaderboard shows
- [ ] Mobile responsive (iPhone 12 size)
- [ ] No console errors
- [ ] Deploy URL works (if deploying)

---

## 💻 Code Organization Tips

```
Frontend:
  lib/          - Game logic (reusable)
  components/   - UI blocks
  app/          - Pages

Backend:
  websocket.js  - Real-time logic
  server.js     - HTTP + Socket.io
```

**Keep it simple!** Don't over-engineer.

---

## 🎤 Pitch Tips (3-5 Minutes)

1. **Open**: "Students hate boring learning. We made it a multiplayer RPG."
2. **Problem**: Show the statistic (e.g., "68% of students lose motivation")
3. **Solution**: Demo the game (play one raid live!)
4. **Impact**: "Increases engagement by making learning collaborative"
5. **Call to Action**: "You can try it right now!"

---

## 🏆 Bonus Ideas (If You're Ahead)

- Add sound effects (https://www.zapsplat.com/)
- Add background music
- Add hero animations (CSS keyframes)
- Track user progress to Firebase
- Daily login bonuses
- Achievement system
- Leaderboard updates live via WebSocket

---

**Remember**: A polished, working demo beats incomplete features. Ship early, iterate fast! 🚀

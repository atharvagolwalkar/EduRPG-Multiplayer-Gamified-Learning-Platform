# EduRPG Complete Fix & Improvement TODO

## Status: 3/15 ✅ (Auth Backend Complete)
✅ 1.1 Auth middleware
✅ 1.2 Auth endpoints
✅ 1.3 Secure APIs

### 1. **Setup & Security** (Critical)
- [ ] Add Firebase Auth middleware to backend
- [ ] Implement real `/api/auth/*` endpoints
- [ ] Secure all API routes with auth check

### 2. **Auth Frontend Integration**
- [ ] Update auth/page.tsx with Firebase client auth
- [ ] Add auth context/provider to layout.tsx
- [ ] Update store.ts with auth state & token handling

### 3. **Data Expansion**
- [ ] Expand questions.js (100+ questions all categories/difficulties)
- [ ] Add 8+ hero classes with unique progression
- [ ] Create seed.js script for Firebase data

### 4. **Persistence Fixes**
- [ ] Migrate websocket.js in-memory to Firebase RealtimeDB
- [ ] Update FirebaseService.js for realtime raids/guilds

### 5. **AI & Features Enhancement**
- [ ] Add AI question generation endpoint
- [ ] Implement guild raids & clan wars (friend's repo inspo)
- [ ] Add battle engine improvements

### 6. **Testing & Polish**
- [ ] Add rate limiting & error handling
- [ ] Create integration tests
- [ ] Update docs (README, NEXT_STEPS)
- [ ] Performance optimizations

### 7. **Deploy & Compare**
- [ ] Test full flow (auth -> raid -> progression)
- [ ] Compare vs friend's repo features
- [ ] Final cleanup & optimizations

**Next Step:** Implement auth middleware & endpoints (1-3)**

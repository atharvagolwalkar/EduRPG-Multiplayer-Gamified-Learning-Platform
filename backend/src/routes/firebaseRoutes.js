import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import { UserService, RaidService, GuildService, LeaderboardService } from '../services/FirebaseService.js';
import { generateDynamicQuestion, generateQuestionsForCategory } from '../services/QuestionGenerationService.js';
import { isMockFirebase } from '../store.js';

function parseLimit(value, fallback = 10) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// authMiddleware is passed in from server.js so we can apply it per-route
// instead of using app.use() prefix matching (which breaks /api/users/create)
export function setupFirebaseRoutes(app, authMiddleware) {

  // ── AUTH (public) ──────────────────────────────────────────────────────────

  app.post('/api/auth/register', async (req, res) => {
    const { username, heroClass = 'mage' } = req.body;
    if (isMockFirebase) {
      const mockUser = { id: uuidv4(), email: 'mock@test.com', username, heroClass };
      await UserService.createUser(mockUser);
      return res.json({ success: true, user: mockUser, idToken: 'mock-id-token' });
    }
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer '))
        return res.status(401).json({ success: false, error: 'Missing registration token.' });
      const decodedToken = await admin.auth().verifyIdToken(authHeader.substring(7));
      const existingUser = await UserService.getUser(decodedToken.uid);
      if (existingUser) return res.json({ success: true, user: existingUser });
      const userData = await UserService.createUser({ id: decodedToken.uid, email: decodedToken.email, username, heroClass });
      res.json({ success: true, user: userData });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    if (isMockFirebase)
      return res.json({ success: true, idToken: 'mock-id-token', user: { uid: 'mock-user-id', email: req.body.email } });
    res.status(400).json({ success: false, error: 'Use Firebase client SDK for login.' });
  });

  app.post('/api/auth/refresh', (_req, res) => res.json({ success: true, message: 'Tokens auto-refresh client-side' }));

  // ── USERS ──────────────────────────────────────────────────────────────────

  // PUBLIC — no auth needed, guest hero creation from home page
  app.post('/api/users/create', async (req, res) => {
    try {
      const id = req.user?.uid || uuidv4();
      const user = await UserService.createUser({ ...req.body, id });
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PUBLIC read — guild page needs user list without auth
  app.get('/api/users', async (_req, res) => {
    try {
      const users = await UserService.getAllUsers();
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // PROTECTED — per-user routes require auth
  app.get('/api/users/:userId', authMiddleware, async (req, res) => {
    try {
      const user = await UserService.getUser(req.params.userId);
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put('/api/users/:userId', authMiddleware, async (req, res) => {
    try {
      await UserService.updateUser(req.params.userId, req.body);
      const user = await UserService.getUser(req.params.userId);
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/users/:userId/xp', authMiddleware, async (req, res) => {
    try {
      const result = await UserService.addXP(req.params.userId, req.body.amount);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/users/:userId/raids', authMiddleware, async (req, res) => {
    try {
      const raids = await RaidService.getRaidHistory(req.params.userId);
      res.json({ success: true, raids });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ── RAIDS (all protected) ──────────────────────────────────────────────────

  app.post('/api/raids/start', authMiddleware, async (req, res) => {
    try {
      const payload = {
        id: req.body.raidId,
        players: req.body.players || (req.body.leaderId ? [{ id: req.body.leaderId }] : []),
        monsterName: req.body.monsterName || 'Calculus Titan',
        monsterMaxHp: req.body.monsterMaxHp || req.body.monsterHp || 100,
        teamMaxHp: req.body.teamMaxHp || req.body.teamHp || 100,
      };
      const raid = await RaidService.startRaid(payload);
      res.json({ success: true, raid });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/raids/:raidId', authMiddleware, async (req, res) => {
    try {
      const raid = await RaidService.getRaid(req.params.raidId);
      res.json({ success: true, raid });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put('/api/raids/:raidId', authMiddleware, async (req, res) => {
    try {
      await RaidService.updateRaid(req.params.raidId, req.body);
      const raid = await RaidService.getRaid(req.params.raidId);
      res.json({ success: true, raid });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/raids/:raidId/end', authMiddleware, async (req, res) => {
    try {
      const raid = await RaidService.endRaid(req.params.raidId, req.body.winnerId, req.body.xpReward);
      res.json({ success: true, raid });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ── GUILDS (reads public, writes public for guest users) ──────────────────

  app.get('/api/guilds', async (_req, res) => {
    try {
      const guilds = await GuildService.getAllGuilds();
      res.json({ success: true, guilds });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/guilds/:guildId', async (req, res) => {
    try {
      const guild = await GuildService.getGuild(req.params.guildId);
      res.json({ success: true, guild });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/guilds/create', async (req, res) => {
    try {
      const guild = await GuildService.createGuild({
        name: req.body.name,
        description: req.body.description || '',
        leader: req.body.leader || req.body.leaderId || req.user?.uid || 'guest',
      });
      res.json({ success: true, guild });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/guilds/:guildId/members', async (req, res) => {
    try {
      const guild = await GuildService.addMember(req.params.guildId, req.body.userId);
      res.json({ success: true, guild });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete('/api/guilds/:guildId/members/:userId', async (req, res) => {
    try {
      const guild = await GuildService.removeMember(req.params.guildId, req.params.userId);
      res.json({ success: true, guild });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/guilds/:guildId/xp', async (req, res) => {
    try {
      const guild = await GuildService.addXP(req.params.guildId, req.body.amount);
      res.json({ success: true, guild });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ── LEADERBOARD (protected) ────────────────────────────────────────────────

  app.get('/api/leaderboard/global', authMiddleware, async (req, res) => {
    try {
      const leaderboard = await LeaderboardService.getGlobalLeaderboard(parseLimit(req.query.limit));
      res.json({ success: true, leaderboard });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/leaderboard/weekly', authMiddleware, async (req, res) => {
    try {
      const leaderboard = await LeaderboardService.getWeeklyLeaderboard(parseLimit(req.query.limit));
      res.json({ success: true, leaderboard });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/leaderboard/guilds', authMiddleware, async (req, res) => {
    try {
      const leaderboard = await LeaderboardService.getGuildLeaderboard(parseLimit(req.query.limit));
      res.json({ success: true, leaderboard });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ── QUESTIONS (public) ─────────────────────────────────────────────────────

  app.get('/api/questions', async (req, res) => {
    try {
      const { subject, difficulty } = req.query;
      if (!subject) return res.status(400).json({ success: false, error: 'subject is required' });
      const diff = difficulty ? Number(difficulty) : 1;
      if (!Number.isFinite(diff) || diff < 1 || diff > 5)
        return res.status(400).json({ success: false, error: 'difficulty must be 1-5' });
      const question = await generateDynamicQuestion(subject.toLowerCase(), diff, req.query.concept || 'general');
      if (!question) return res.status(404).json({ success: false, error: 'No question found' });
      res.json({ success: true, question });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/questions/category/:subject', async (req, res) => {
    try {
      const maxDifficulty = req.query.maxDifficulty ? Number(req.query.maxDifficulty) : 3;
      if (maxDifficulty < 1 || maxDifficulty > 5)
        return res.status(400).json({ success: false, error: 'maxDifficulty must be 1-5' });
      const questions = await generateQuestionsForCategory(req.params.subject.toLowerCase(), maxDifficulty);
      res.json({ success: true, questions, count: questions.length });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}
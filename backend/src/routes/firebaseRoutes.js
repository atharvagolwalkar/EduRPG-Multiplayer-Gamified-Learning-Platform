import { v4 as uuidv4 } from 'uuid';
import admin from 'firebase-admin';
import { UserService, RaidService, GuildService, LeaderboardService } from '../services/FirebaseService.js';
import { generateDynamicQuestion, generateQuestionsForCategory } from '../services/QuestionGenerationService.js';
import { isMockFirebase } from '../firebase.js';

function parseLimit(value, fallback = 10) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function setupFirebaseRoutes(app) {
  // ==================== AUTH ROUTES (Public) ====================
  app.post('/api/auth/register', async (req, res) => {
    const { username, heroClass = 'mage' } = req.body;
    if (isMockFirebase) {
      const mockUser = { id: uuidv4(), email: 'mock@test.com', username, heroClass };
      await UserService.createUser(mockUser);
      res.json({ success: true, user: mockUser, idToken: 'mock-id-token' });
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Missing registration token.' });
      }

      const idToken = authHeader.substring(7);
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const existingUser = await UserService.getUser(decodedToken.uid);

      if (existingUser) {
        return res.json({ success: true, user: existingUser });
      }

      const userData = await UserService.createUser({
        id: decodedToken.uid,
        email: decodedToken.email,
        username,
        heroClass,
      });
      res.json({ success: true, user: userData });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (isMockFirebase) {
      res.json({ success: true, idToken: 'mock-id-token', user: { uid: 'mock-user-id', email } });
      return;
    }

    // Frontend sends idToken after Firebase client login; no server login needed
    res.status(400).json({ success: false, error: 'Use Firebase client SDK for login. Send ID token to protected APIs.' });
  });

  app.post('/api/auth/refresh', async (req, res) => {
    // For token refresh if needed
    res.json({ success: true, message: 'Tokens auto-refresh client-side' });
  });

  // ==================== PROTECTED ROUTES (Apply authMiddleware in server.js) ====================
  // ==================== USER ROUTES ====================

  app.post('/api/users/create', async (req, res) => {
    try {
      const user = await UserService.createUser({ ...req.body, id: req.user.uid });
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/users/:userId', async (req, res) => {
    try {
      const user = await UserService.getUser(req.params.userId);
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      const users = await UserService.getAllUsers();
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put('/api/users/:userId', async (req, res) => {
    try {
      await UserService.updateUser(req.params.userId, req.body);
      const user = await UserService.getUser(req.params.userId);
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/users/:userId/xp', async (req, res) => {
    try {
      const result = await UserService.addXP(req.params.userId, req.body.amount);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==================== RAID ROUTES ====================

  app.post('/api/raids/start', async (req, res) => {
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

  app.get('/api/raids/:raidId', async (req, res) => {
    try {
      const raid = await RaidService.getRaid(req.params.raidId);
      res.json({ success: true, raid });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put('/api/raids/:raidId', async (req, res) => {
    try {
      await RaidService.updateRaid(req.params.raidId, req.body);
      const raid = await RaidService.getRaid(req.params.raidId);
      res.json({ success: true, raid });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/raids/:raidId/end', async (req, res) => {
    try {
      const raid = await RaidService.endRaid(
        req.params.raidId,
        req.body.winnerId,
        req.body.xpReward
      );
      res.json({ success: true, raid });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/users/:userId/raids', async (req, res) => {
    try {
      const raids = await RaidService.getRaidHistory(req.params.userId);
      res.json({ success: true, raids });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==================== GUILD ROUTES ====================

  app.post('/api/guilds/create', async (req, res) => {
    try {
      const payload = {
        name: req.body.name,
        description: req.body.description || '',
        leader: req.body.leader || req.body.leaderId || 'local-user',
      };

      const guild = await GuildService.createGuild(payload);
      res.json({ success: true, guild });
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

  app.get('/api/guilds', async (req, res) => {
    try {
      const guilds = await GuildService.getAllGuilds();
      res.json({ success: true, guilds });
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

  app.get('/api/guilds/leaderboard', async (req, res) => {
    try {
      const leaderboard = await GuildService.getLeaderboard(parseLimit(req.query.limit));
      res.json({ success: true, leaderboard });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==================== LEADERBOARD ROUTES ====================

  app.get('/api/leaderboard/global', async (req, res) => {
    try {
      const leaderboard = await LeaderboardService.getGlobalLeaderboard(
        parseLimit(req.query.limit)
      );
      res.json({ success: true, leaderboard });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/leaderboard/weekly', async (req, res) => {
    try {
      const leaderboard = await LeaderboardService.getWeeklyLeaderboard(
        parseLimit(req.query.limit)
      );
      res.json({ success: true, leaderboard });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/leaderboard/guilds', async (req, res) => {
    try {
      const leaderboard = await LeaderboardService.getGuildLeaderboard(
        parseLimit(req.query.limit)
      );
      res.json({ success: true, leaderboard });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==================== QUESTION ROUTES ====================

  // Get a question by subject and difficulty
  app.get('/api/questions', async (req, res) => {
    try {
      const { subject, difficulty } = req.query;
      
      if (!subject) {
        return res.status(400).json({ 
          success: false, 
          error: 'subject query parameter is required' 
        });
      }

      const diff = difficulty ? Number(difficulty) : 1;
      if (!Number.isFinite(diff) || diff < 1 || diff > 5) {
        return res.status(400).json({ 
          success: false, 
          error: 'difficulty must be between 1 and 5' 
        });
      }

      const question = await generateDynamicQuestion(
        subject.toLowerCase(), 
        diff,
        req.query.concept || 'general'
      );

      if (!question) {
        return res.status(404).json({ 
          success: false, 
          error: 'No questions found for this category' 
        });
      }

      res.json({ success: true, question });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get multiple questions for a category with progressive difficulty
  app.get('/api/questions/category/:subject', async (req, res) => {
    try {
      const { subject } = req.params;
      const maxDifficulty = req.query.maxDifficulty ? Number(req.query.maxDifficulty) : 3;

      if (maxDifficulty < 1 || maxDifficulty > 5) {
        return res.status(400).json({ 
          success: false, 
          error: 'maxDifficulty must be between 1 and 5' 
        });
      }

      const questions = await generateQuestionsForCategory(subject.toLowerCase(), maxDifficulty);

      res.json({ 
        success: true, 
        questions,
        count: questions.length 
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}


import { UserService, RaidService, GuildService, LeaderboardService } from '../services/FirebaseService.js';

export function setupFirebaseRoutes(app) {
  // ==================== USER ROUTES ====================

  app.post('/api/users/create', async (req, res) => {
    try {
      const user = await UserService.createUser(req.body);
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
      const raid = await RaidService.startRaid(req.body);
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
      const guild = await GuildService.createGuild(req.body);
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
      const leaderboard = await GuildService.getLeaderboard(req.query.limit || 10);
      res.json({ success: true, leaderboard });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ==================== LEADERBOARD ROUTES ====================

  app.get('/api/leaderboard/global', async (req, res) => {
    try {
      const leaderboard = await LeaderboardService.getGlobalLeaderboard(
        req.query.limit || 10
      );
      res.json({ success: true, leaderboard });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/leaderboard/weekly', async (req, res) => {
    try {
      const leaderboard = await LeaderboardService.getWeeklyLeaderboard(
        req.query.limit || 10
      );
      res.json({ success: true, leaderboard });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/leaderboard/guilds', async (req, res) => {
    try {
      const leaderboard = await LeaderboardService.getGuildLeaderboard(
        req.query.limit || 10
      );
      res.json({ success: true, leaderboard });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

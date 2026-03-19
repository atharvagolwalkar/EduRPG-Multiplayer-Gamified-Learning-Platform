import { Router } from 'express';
import { UserDB, GuildDB, RaidDB, AchievementDB, awardXP } from '../db/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { getQuestionsForRaid } from '../questions.js';
import { getDungeonMasterBeat } from '../services/dungeonMaster.js';
import { sanitize } from './auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ── Users ─────────────────────────────────────────────────────────────────────
router.get('/users', (req, res) => {
  res.json({ success: true, users: UserDB.getAll.all() });
});

router.get('/users/:id', (req, res) => {
  const user = UserDB.getById.get(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  const achievements = AchievementDB.getByUser.all(user.id);
  res.json({ success: true, user: { ...sanitize(user), achievements } });
});

// ── Guilds ────────────────────────────────────────────────────────────────────
router.get('/guilds', (req, res) => {
  const guilds = GuildDB.getAll.all().map(g => ({
    ...g, members: GuildDB.getMembers.all(g.id),
  }));
  res.json({ success: true, guilds });
});

router.get('/guilds/:id', (req, res) => {
  const guild = GuildDB.getById.get(req.params.id);
  if (!guild) return res.status(404).json({ success: false, error: 'Guild not found' });
  res.json({ success: true, guild: { ...guild, members: GuildDB.getMembers.all(guild.id) } });
});

router.post('/guilds/create', authMiddleware, (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, error: 'name required' });
    const id = uuidv4();
    GuildDB.create.run(id, name.trim(), description || '', req.user.id);
    GuildDB.addMember.run(id, req.user.id);
    UserDB.setGuild.run(id, req.user.id);
    const guild = GuildDB.getById.get(id);
    AchievementDB.award.run(req.user.id, 'Guild Founder');
    res.json({ success: true, guild: { ...guild, members: GuildDB.getMembers.all(id) } });
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ success: false, error: 'Guild name taken' });
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/guilds/:id/join', authMiddleware, (req, res) => {
  try {
    const guild = GuildDB.getById.get(req.params.id);
    if (!guild) return res.status(404).json({ success: false, error: 'Guild not found' });
    if (guild.member_count >= 50) return res.status(400).json({ success: false, error: 'Guild is full' });
    GuildDB.addMember.run(guild.id, req.user.id);
    GuildDB.updateCount.run(guild.id, guild.id);
    UserDB.setGuild.run(guild.id, req.user.id);
    const updated = GuildDB.getById.get(guild.id);
    res.json({ success: true, guild: { ...updated, members: GuildDB.getMembers.all(guild.id) } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/guilds/:id/leave', authMiddleware, (req, res) => {
  GuildDB.removeMember.run(req.params.id, req.user.id);
  GuildDB.updateCount.run(req.params.id, req.params.id);
  UserDB.setGuild.run(null, req.user.id);
  res.json({ success: true });
});

// ── Raids ─────────────────────────────────────────────────────────────────────
router.post('/raids/start', authMiddleware, (req, res) => {
  try {
    const { monsterName = 'Calculus Titan', monsterHp = 100, teamHp } = req.body;
    const user  = UserDB.getById.get(req.user.id);
    const maxHp = teamHp || { mage: 90, engineer: 110, scientist: 100 }[user?.hero_class || 'mage'] || 100;
    const id    = Math.random().toString(36).slice(2, 8).toUpperCase();
    RaidDB.create.run(id, monsterName, monsterHp, monsterHp, maxHp, maxHp);
    RaidDB.addPlayer.run(id, req.user.id);
    const raid    = RaidDB.getById.get(id);
    const players = RaidDB.getPlayers.all(id);
    res.json({ success: true, raid: { ...raidShape(raid), players } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/raids/:id', authMiddleware, (req, res) => {
  const raid = RaidDB.getById.get(req.params.id);
  if (!raid) return res.status(404).json({ success: false, error: 'Raid not found' });
  res.json({ success: true, raid: { ...raidShape(raid), players: RaidDB.getPlayers.all(raid.id) } });
});

// ── Leaderboard ───────────────────────────────────────────────────────────────
router.get('/leaderboard/global', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  res.json({ success: true, leaderboard: UserDB.leaderboard.all(limit).map((u,i) => ({ rank:i+1,...u })) });
});

router.get('/leaderboard/weekly', (req, res) => {
  const limit  = Math.min(Number(req.query.limit) || 20, 50);
  const oneWeekAgo = Math.floor(Date.now()/1000) - 7*24*3600;
  res.json({ success: true, leaderboard: UserDB.weeklyLeaderboard.all(oneWeekAgo, limit).map((u,i) => ({ rank:i+1,...u })) });
});

router.get('/leaderboard/guilds', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  res.json({ success: true, leaderboard: GuildDB.leaderboard.all(limit).map((g,i) => ({ rank:i+1,...g })) });
});

// ── Questions ─────────────────────────────────────────────────────────────────
router.get('/questions', (req, res) => {
  const { heroClass = 'mage', difficulty = 1 } = req.query;
  res.json({ success: true, questions: getQuestionsForRaid(heroClass, Number(difficulty)) });
});

// ── AI Dungeon Master ─────────────────────────────────────────────────────────
router.post('/ai/dungeon-master', async (req, res) => {
  try {
    const beat = await getDungeonMasterBeat(req.body || {});
    res.json({ success: true, beat });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Achievements ──────────────────────────────────────────────────────────────
router.get('/users/:id/achievements', (req, res) => {
  res.json({ success: true, achievements: AchievementDB.getByUser.all(req.params.id) });
});

function raidShape(r) {
  return {
    id: r.id, monsterName: r.monster_name,
    monsterHp: r.monster_hp, monsterMaxHp: r.monster_max_hp,
    teamHp: r.team_hp, teamMaxHp: r.team_max_hp,
    streak: r.streak, correctAnswers: r.correct,
    questionsAnswered: r.answered, status: r.status,
  };
}

export { raidShape };
export default router;
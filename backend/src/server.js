import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  users, raids, guilds,
  createUser, getUser, addXP, recordRaidResult,
  createRaid, getRaid,
  createGuild, getGuild, joinGuild, addGuildXP,
  getGlobalLeaderboard, getGuildLeaderboard,
} from './store.js';
import { getQuestions } from './questions.js';

const app    = express();
const server = createServer(app);
const PORT   = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', users: users.size, raids: raids.size, guilds: guilds.size }));

// ── Auth (simple mock — no real auth needed without Firebase) ─────────────────
// register: creates a user and returns a fake token
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, heroClass = 'mage' } = req.body;
    if (!username) return res.status(400).json({ success: false, error: 'username required' });
    const user  = createUser({ username, heroClass });
    const token = `mock-token-${user.id}`;
    res.json({ success: true, token, user });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// login: finds user by username, returns fake token
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, username } = req.body;
    // Find by username or email prefix
    const searchName = username || (email ? email.split('@')[0] : '');
    const found = [...users.values()].find(u =>
      u.username === searchName || u.username === email
    );
    if (!found) return res.status(404).json({ success: false, error: 'User not found. Please register first.' });
    const token = `mock-token-${found.id}`;
    res.json({ success: true, token, user: found });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ── Users ─────────────────────────────────────────────────────────────────────
app.post('/api/users/create', (req, res) => {
  try {
    const { username, heroClass } = req.body;
    if (!username || !heroClass) return res.status(400).json({ success: false, error: 'username and heroClass required' });
    const user = createUser({ username, heroClass });
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/users/:id', (req, res) => {
  const user = getUser(req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ success: true, user });
});

app.get('/api/users', (_, res) => {
  res.json({ success: true, users: [...users.values()] });
});

// ── Raids ─────────────────────────────────────────────────────────────────────
app.post('/api/raids/start', (req, res) => {
  try {
    const { raidId, leaderId, monsterHp = 100, teamHp = 100, monsterName, players = [] } = req.body;
    const id   = raidId || `raid-${Date.now()}`;
    let   raid = getRaid(id);
    if (!raid) raid = createRaid({ raidId: id, monsterName, monsterHp, teamHp });
    if (leaderId && !raid.players.find(p => p.id === leaderId)) {
      const u = getUser(leaderId);
      raid.players.push({ id: leaderId, username: u?.username || 'Player', heroClass: u?.heroClass || 'mage' });
      raid.playerProgress[leaderId] = { damageDealt: 0, correctAnswers: 0 };
    }
    res.json({ success: true, raid });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/raids/:id', (req, res) => {
  const raid = getRaid(req.params.id);
  if (!raid) return res.status(404).json({ success: false, error: 'Raid not found' });
  res.json({ success: true, raid });
});

// ── Guilds ────────────────────────────────────────────────────────────────────
app.post('/api/guilds/create', (req, res) => {
  try {
    const { name, description, leaderId } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'name required' });
    const guild = createGuild({ name, description, leaderId: leaderId || 'guest' });
    res.json({ success: true, guild });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/guilds', (_, res) => {
  res.json({ success: true, guilds: [...guilds.values()].sort((a, b) => b.xp - a.xp) });
});

app.get('/api/guilds/:id', (req, res) => {
  const guild = getGuild(req.params.id);
  if (!guild) return res.status(404).json({ success: false, error: 'Guild not found' });
  res.json({ success: true, guild });
});

app.post('/api/guilds/:id/join', (req, res) => {
  try {
    const { userId } = req.body;
    const guild = joinGuild(req.params.id, userId || 'guest');
    res.json({ success: true, guild });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

// ── Leaderboard ───────────────────────────────────────────────────────────────
app.get('/api/leaderboard/global',  (_, res) => res.json({ success: true, leaderboard: getGlobalLeaderboard() }));
app.get('/api/leaderboard/guilds',  (_, res) => res.json({ success: true, leaderboard: getGuildLeaderboard() }));
app.get('/api/leaderboard/weekly',  (_, res) => res.json({ success: true, leaderboard: getGlobalLeaderboard() }));
app.get('/api/leaderboard',         (_, res) => res.redirect('/api/leaderboard/global'));

// ── Questions ─────────────────────────────────────────────────────────────────
app.get('/api/questions', (req, res) => {
  const { heroClass = 'mage', difficulty = 1 } = req.query;
  res.json({ success: true, questions: getQuestions(heroClass, Number(difficulty)) });
});

// ── Socket.io — /raids namespace ──────────────────────────────────────────────
const io = new Server(server, { cors: { origin: '*' }, transports: ['websocket', 'polling'] });

const raidTimers = new Map();
const RAID_DURATION = 180;

function snapshot(raid) {
  return {
    id: raid.id, monsterName: raid.monsterName,
    monsterHp: raid.monsterHp, monsterMaxHp: raid.monsterMaxHp,
    teamHp: raid.teamHp,       teamMaxHp:    raid.teamMaxHp,
    streak: raid.streak,       status:       raid.status,
    players: raid.players,     playerProgress: raid.playerProgress,
    correctAnswers: raid.correctAnswers, questionsAnswered: raid.questionsAnswered,
  };
}

function endRaid(raidId, status, raidNS) {
  const raid = getRaid(raidId);
  if (!raid || raid.status !== 'active') return;
  raid.status = status;
  if (raidTimers.has(raidId)) { clearInterval(raidTimers.get(raidId)); raidTimers.delete(raidId); }
  const xpReward = status === 'victory' ? 100 + raid.correctAnswers * 10 : 0;
  for (const p of raid.players) {
    const prog = raid.playerProgress[p.id] || {};
    recordRaidResult(p.id, { won: status === 'victory', damageDealt: prog.damageDealt || 0 });
    const u = getUser(p.id);
    if (u?.guildId) addGuildXP(u.guildId, Math.floor(xpReward / 2));
  }
  raidNS.to(raidId).emit('raid:end', {
    status, xpReward,
    totalDamage:    raid.players.reduce((s, p) => s + (raid.playerProgress[p.id]?.damageDealt || 0), 0),
    correctAnswers: raid.correctAnswers,
    raid:           snapshot({ ...raid, status }),
  });
}

const raidNS = io.of('/raids');

raidNS.on('connection', (socket) => {
  console.log(`[/raids] connected: ${socket.id}`);

  socket.on('raid:join', (data) => {
    try {
      const { raidId, player } = data;
      let raid = getRaid(raidId);
      if (!raid) {
        raid = createRaid({ raidId, monsterHp: 100, teamHp: 100 });
        let timeLeft = RAID_DURATION;
        const timer = setInterval(() => {
          timeLeft--;
          if (timeLeft % 10 === 0) raidNS.to(raidId).emit('raid:tick', { timeRemaining: timeLeft });
          if (timeLeft <= 0) endRaid(raidId, 'defeat', raidNS);
        }, 1000);
        raidTimers.set(raidId, timer);
      }
      if (!raid.players.find(p => p.id === player.id)) {
        raid.players.push(player);
        raid.playerProgress[player.id] = { damageDealt: 0, correctAnswers: 0 };
      }
      socket.join(raidId);
      socket.raidId   = raidId;
      socket.playerId = player.id;
      socket.emit('raid:sync', { raid: snapshot(raid) });
      raidNS.to(raidId).emit('raid:player-joined', { raid: snapshot(raid), message: `${player.username || 'A player'} joined!` });
    } catch (e) { socket.emit('error', { message: e.message }); }
  });

  socket.on('raid:answer', (data) => {
    try {
      const { raidId, isCorrect, damage = 25 } = data;
      const raid = getRaid(raidId);
      if (!raid || raid.status !== 'active') return;
      const pid = socket.playerId;
      if (!raid.playerProgress[pid]) raid.playerProgress[pid] = { damageDealt: 0, correctAnswers: 0 };
      let actualDamage = 0;
      if (isCorrect) {
        raid.streak++;
        const mult = 1 + Math.min(raid.streak * 0.1, 2);
        actualDamage = Math.floor(damage * mult) + (raid.streak >= 3 ? 5 : 0);
        raid.monsterHp = Math.max(0, raid.monsterHp - actualDamage);
        raid.correctAnswers++;
        raid.playerProgress[pid].damageDealt    += actualDamage;
        raid.playerProgress[pid].correctAnswers += 1;
      } else {
        actualDamage = 20;
        raid.teamHp  = Math.max(0, raid.teamHp - actualDamage);
        raid.streak  = 0;
      }
      raid.questionsAnswered++;
      const accuracy       = raid.questionsAnswered > 2 ? raid.correctAnswers / raid.questionsAnswered : 0.5;
      const adaptiveSignal = accuracy >= 0.8 ? 'increase' : accuracy <= 0.4 ? 'decrease' : 'maintain';
      raidNS.to(raidId).emit('raid:damage', {
        raid: snapshot(raid),
        type: isCorrect ? 'player-attack' : 'monster-attack',
        damage: actualDamage, playerId: pid, adaptiveSignal,
        message: isCorrect ? `⚔️ ${actualDamage} dmg! Streak ×${raid.streak}` : `💥 Boss strikes for ${actualDamage}!`,
      });
      if (raid.monsterHp <= 0) endRaid(raidId, 'victory', raidNS);
      else if (raid.teamHp <= 0) endRaid(raidId, 'defeat', raidNS);
    } catch (e) { socket.emit('error', { message: e.message }); }
  });

  socket.on('disconnect', () => {
    if (socket.raidId) raidNS.to(socket.raidId).emit('raid:player-left', { playerId: socket.playerId, message: 'A player left.' });
  });
});

server.listen(PORT, () => {
  console.log(`\n✅ EduRPG backend on http://localhost:${PORT}`);
  console.log(`   No database needed — pure in-memory\n`);
});

export default app;
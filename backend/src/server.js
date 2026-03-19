import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
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

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── REST API ──────────────────────────────────────────────────────────────────

app.get('/health', (_, res) => res.json({ status: 'ok', users: users.size, raids: raids.size, guilds: guilds.size }));

// Users
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

// Raids
app.post('/api/raids/start', (req, res) => {
  try {
    const { raidId, leaderId, monsterHp = 100, teamHp = 100, monsterName, players = [] } = req.body;
    const id = raidId || `raid-${Date.now()}`;
    let raid = getRaid(id);
    if (!raid) {
      raid = createRaid({ raidId: id, monsterName, monsterHp, teamHp });
    }
    // Add leader as first player
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

// Guilds
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
    const guild = joinGuild(req.params.id, req.body.userId);
    res.json({ success: true, guild });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});

// Leaderboard
app.get('/api/leaderboard/global',  (_, res) => res.json({ success: true, leaderboard: getGlobalLeaderboard() }));
app.get('/api/leaderboard/guilds',  (_, res) => res.json({ success: true, leaderboard: getGuildLeaderboard() }));
app.get('/api/leaderboard/weekly',  (_, res) => res.json({ success: true, leaderboard: getGlobalLeaderboard() }));

// Questions
app.get('/api/questions', (req, res) => {
  const { heroClass = 'mage', difficulty = 1 } = req.query;
  res.json({ success: true, questions: getQuestions(heroClass, Number(difficulty)) });
});

// ── Socket.io — /raids namespace ──────────────────────────────────────────────
const io = new Server(server, { cors: { origin: '*' }, transports: ['websocket', 'polling'] });

// Active raid timers
const raidTimers = new Map();
const RAID_DURATION = 180; // seconds

function snapshot(raid) {
  return {
    id: raid.id,
    monsterName:   raid.monsterName,
    monsterHp:     raid.monsterHp,
    monsterMaxHp:  raid.monsterMaxHp,
    teamHp:        raid.teamHp,
    teamMaxHp:     raid.teamMaxHp,
    streak:        raid.streak,
    status:        raid.status,
    players:       raid.players,
    playerProgress: raid.playerProgress,
    correctAnswers: raid.correctAnswers,
    questionsAnswered: raid.questionsAnswered,
  };
}

function endRaid(raidId, status, raidNS) {
  const raid = getRaid(raidId);
  if (!raid || raid.status !== 'active') return;
  raid.status = status;

  // Clear timer
  if (raidTimers.has(raidId)) {
    clearInterval(raidTimers.get(raidId));
    raidTimers.delete(raidId);
  }

  const xpReward = status === 'victory' ? 100 + (raid.correctAnswers * 10) : 0;

  // Award XP and record results
  for (const p of raid.players) {
    const progress = raid.playerProgress[p.id] || {};
    recordRaidResult(p.id, { won: status === 'victory', damageDealt: progress.damageDealt || 0 });
    const u = getUser(p.id);
    if (u?.guildId) addGuildXP(u.guildId, Math.floor(xpReward / 2));
  }

  raidNS.to(raidId).emit('raid:end', {
    status, xpReward,
    totalDamage: raid.players.reduce((s, p) => s + (raid.playerProgress[p.id]?.damageDealt || 0), 0),
    correctAnswers: raid.correctAnswers,
    raid: snapshot(raid),
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
        // Start timer
        let timeLeft = RAID_DURATION;
        const timer = setInterval(() => {
          timeLeft--;
          if (timeLeft % 10 === 0) raidNS.to(raidId).emit('raid:tick', { timeRemaining: timeLeft });
          if (timeLeft <= 0) endRaid(raidId, 'defeat', raidNS);
        }, 1000);
        raidTimers.set(raidId, timer);
      }

      // Add player if not already in
      if (!raid.players.find(p => p.id === player.id)) {
        raid.players.push(player);
        raid.playerProgress[player.id] = { damageDealt: 0, correctAnswers: 0 };
      }

      socket.join(raidId);
      socket.raidId  = raidId;
      socket.playerId = player.id;

      socket.emit('raid:sync', { raid: snapshot(raid) });
      raidNS.to(raidId).emit('raid:player-joined', {
        raid: snapshot(raid),
        message: `${player.username || 'A player'} joined the raid!`,
      });
    } catch (e) { socket.emit('error', { message: e.message }); }
  });

  socket.on('raid:answer', (data) => {
    try {
      const { raidId, isCorrect, damage = 25, subject, concept } = data;
      const raid = getRaid(raidId);
      if (!raid || raid.status !== 'active') return;

      const pid = socket.playerId;
      if (!raid.playerProgress[pid]) raid.playerProgress[pid] = { damageDealt: 0, correctAnswers: 0 };

      let actualDamage = 0;

      if (isCorrect) {
        raid.streak++;
        // Combo bonus: +5 dmg per 3 streak, max 3x multiplier
        const mult = 1 + Math.min(raid.streak * 0.1, 2);
        actualDamage = Math.floor(damage * mult);
        if (raid.streak >= 3) actualDamage += 5;
        raid.monsterHp = Math.max(0, raid.monsterHp - actualDamage);
        raid.correctAnswers++;
        raid.playerProgress[pid].damageDealt    += actualDamage;
        raid.playerProgress[pid].correctAnswers += 1;
      } else {
        actualDamage = 20;
        raid.teamHp = Math.max(0, raid.teamHp - actualDamage);
        raid.streak  = 0;
      }
      raid.questionsAnswered++;

      // Adaptive signal
      const accuracy = raid.questionsAnswered > 2 ? raid.correctAnswers / raid.questionsAnswered : 0.5;
      const adaptiveSignal = accuracy >= 0.8 ? 'increase' : accuracy <= 0.4 ? 'decrease' : 'maintain';

      raidNS.to(raidId).emit('raid:damage', {
        raid: snapshot(raid),
        type: isCorrect ? 'player-attack' : 'monster-attack',
        damage: actualDamage,
        playerId: pid,
        adaptiveSignal,
        message: isCorrect
          ? `⚔️ ${actualDamage} dmg! Streak ×${raid.streak}`
          : `💥 Boss strikes for ${actualDamage}!`,
      });

      if (raid.monsterHp <= 0) endRaid(raidId, 'victory', raidNS);
      else if (raid.teamHp  <= 0) endRaid(raidId, 'defeat',  raidNS);
    } catch (e) { socket.emit('error', { message: e.message }); }
  });

  socket.on('disconnect', () => {
    if (socket.raidId) {
      raidNS.to(socket.raidId).emit('raid:player-left', { playerId: socket.playerId, message: 'A player left.' });
    }
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n✅ EduRPG backend running on http://localhost:${PORT}`);
  console.log(`   Mode: in-memory (no database needed)`);
  console.log(`   REST: /api/users/create, /api/raids/start, /api/guilds/create, /api/leaderboard/global`);
  console.log(`   WebSocket: /raids namespace\n`);
});

export default app;
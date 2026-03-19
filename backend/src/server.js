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
const HF_KEY = process.env.HUGGING_FACE_API_KEY || '';
const HF_URL = process.env.HUGGING_FACE_API_URL || 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1';

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', users: users.size, raids: raids.size, guilds: guilds.size }));

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, heroClass = 'mage' } = req.body;
    if (!username) return res.status(400).json({ success: false, error: 'username required' });
    const user  = createUser({ username, heroClass });
    res.json({ success: true, token: `mock-token-${user.id}`, user });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, username } = req.body;
    const searchName = username || (email ? email.split('@')[0] : '');
    const found = [...users.values()].find(u => u.username === searchName || u.username === email);
    if (!found) return res.status(404).json({ success: false, error: 'User not found. Register first.' });
    res.json({ success: true, token: `mock-token-${found.id}`, user: found });
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

app.get('/api/users', (_, res) => res.json({ success: true, users: [...users.values()] }));

// ── Raids ─────────────────────────────────────────────────────────────────────
app.post('/api/raids/start', (req, res) => {
  try {
    const { raidId, leaderId, monsterHp = 100, teamHp = 100, monsterName } = req.body;
    const id   = raidId || `RAID-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    let   raid = getRaid(id);
    if (!raid) raid = createRaid({ raidId: id, monsterName: monsterName || 'Calculus Titan', monsterHp, teamHp });
    if (leaderId && !raid.players.find(p => p.id === leaderId)) {
      const u = getUser(leaderId);
      raid.players.push({ id: leaderId, username: u?.username || 'Player', heroClass: u?.heroClass || 'mage' });
      raid.playerProgress[leaderId] = { damageDealt: 0, correctAnswers: 0 };
    }
    res.json({ success: true, raid });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// FIXED: this is what join-by-code calls
app.get('/api/raids/:id', (req, res) => {
  const raid = getRaid(req.params.id);
  // Return 200 with null raid instead of 404 so frontend can show "not found" gracefully
  res.json({ success: true, raid: raid || null });
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

app.get('/api/guilds', (_, res) => res.json({ success: true, guilds: [...guilds.values()].sort((a, b) => b.xp - a.xp) }));

app.get('/api/guilds/:id', (req, res) => {
  const guild = getGuild(req.params.id);
  if (!guild) return res.status(404).json({ success: false, error: 'Guild not found' });
  res.json({ success: true, guild });
});

app.post('/api/guilds/:id/join', (req, res) => {
  try {
    const guild = joinGuild(req.params.id, req.body.userId || 'guest');
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

// ── AI Dungeon Master ─────────────────────────────────────────────────────────
function smartFallback({ isCorrect, streak, subject, concept, difficulty, heroClass }) {
  const comboLines = ['', '', '2x combo!', '3x combo! 🔥', '4x combo! 🔥', '5x BLAZING STREAK! 🔥🔥'];
  const combo = streak >= 2 ? (comboLines[Math.min(streak, 5)] || `${streak}x UNSTOPPABLE! 🔥🔥🔥`) : '';

  if (isCorrect) {
    const narrations = [
      `The ${subject} titan staggers! ${combo}`,
      `Your ${heroClass} power surges — ${concept} mastered! ${combo}`,
      `Direct hit! ${concept} knowledge dealt critical damage! ${combo}`,
      `The boss recoils — your ${subject} skills are devastating! ${combo}`,
    ];
    const hints = [
      `Keep pushing ${concept} — you're in the zone.`,
      `Difficulty rising. Stay focused on fundamentals.`,
      `${streak >= 3 ? 'Combo active! Extra damage on next hit.' : 'Build your streak for bonus damage.'}`,
    ];
    const explanations = [
      `${concept} is a core pillar of ${subject}. Mastering it unlocks advanced topics.`,
      `Strong grasp of ${concept} means the boss has less chance to recover.`,
      `Tier ${difficulty} questions test applied knowledge — you passed!`,
    ];
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    return { narration: pick(narrations), hint: pick(hints), explanation: pick(explanations), source: 'smart-fallback' };
  }

  return {
    narration: `The ${subject} titan strikes back! Regroup, ${heroClass}!`,
    hint: `Review the core rule behind "${concept}" — eliminate two wrong options first.`,
    explanation: `On ${concept}: identify what's being asked before calculating. Break it into steps.`,
    source: 'smart-fallback',
  };
}

app.post('/api/ai/dungeon-master', async (req, res) => {
  const payload = {
    isCorrect:  Boolean(req.body?.isCorrect),
    streak:     Number(req.body?.streak  || 0),
    subject:    req.body?.subject   || 'general',
    concept:    req.body?.concept   || 'reasoning',
    difficulty: Number(req.body?.difficulty || 1),
    heroClass:  req.body?.heroClass || 'adventurer',
  };

  if (!HF_KEY) {
    return res.json({ success: true, beat: smartFallback(payload) });
  }

  try {
    const prompt = `You are EduRPG's Dungeon Master. Reply ONLY with JSON, no markdown.
Keys: narration (max 20 words, cinematic), hint (max 20 words, actionable), explanation (max 25 words, educational).
Context: correct=${payload.isCorrect}, streak=${payload.streak}, subject=${payload.subject}, concept=${payload.concept}, difficulty=${payload.difficulty}, hero=${payload.heroClass}`;

    const response = await fetch(HF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${HF_KEY}` },
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 150, temperature: 0.7 } }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) throw new Error(`HF ${response.status}`);
    const data = await response.json();
    const text = Array.isArray(data) ? data[0]?.generated_text : data?.generated_text;
    const match = text?.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const parsed = JSON.parse(match[0]);
    return res.json({ success: true, beat: { ...parsed, source: 'huggingface' } });
  } catch (err) {
    console.warn('[DM] HF failed, using fallback:', err.message);
    return res.json({ success: true, beat: smartFallback(payload) });
  }
});

// ── Socket.io /raids ──────────────────────────────────────────────────────────
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
  const xpReward = status === 'victory' ? 100 + raid.correctAnswers * 10 : 25;
  for (const p of raid.players) {
    const prog = raid.playerProgress[p.id] || {};
    recordRaidResult(p.id, { won: status === 'victory', damageDealt: prog.damageDealt || 0 });
    // FIXED: actually award XP so leaderboard updates
    addXP(p.id, xpReward);
    const u = getUser(p.id);
    if (u?.guildId) addGuildXP(u.guildId, Math.floor(xpReward / 2));
  }
  raidNS.to(raidId).emit('raid:end', {
    status, xpReward,
    totalDamage:    raid.players.reduce((s, p) => s + (raid.playerProgress[p.id]?.damageDealt || 0), 0),
    correctAnswers: raid.correctAnswers,
    raid:           snapshot({ ...raid, status }),
    // Send updated user data so frontend can refresh XP
    updatedPlayers: raid.players.map(p => getUser(p.id)).filter(Boolean),
  });
}

const raidNS = io.of('/raids');

raidNS.on('connection', (socket) => {
  socket.on('raid:join', (data) => {
    try {
      const { raidId, player } = data;
      let raid = getRaid(raidId);
      if (!raid) {
        raid = createRaid({ raidId, monsterHp: 100, teamHp: 100, monsterName: 'Calculus Titan' });
        let timeLeft = RAID_DURATION;
        const timer = setInterval(() => {
          timeLeft--;
          if (timeLeft % 5 === 0) raidNS.to(raidId).emit('raid:tick', { timeRemaining: timeLeft });
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
      raidNS.to(raidId).emit('raid:player-joined', {
        raid: snapshot(raid),
        message: `${player.username || 'A player'} joined the raid!`,
      });
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
        message: isCorrect
          ? `⚔️ ${actualDamage} dmg!${raid.streak >= 3 ? ` 🔥 ${raid.streak}x COMBO!` : ''}`
          : `💥 Boss strikes for ${actualDamage}!`,
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
  console.log(`   AI Dungeon Master: ${HF_KEY ? '🤖 HuggingFace' : '🧠 Smart fallback'}\n`);
});

export default app;
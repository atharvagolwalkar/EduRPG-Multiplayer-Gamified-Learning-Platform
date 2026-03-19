// ── Pure in-memory store — no database needed ─────────────────────────────────
import { v4 as uuidv4 } from 'uuid';

// ── Data stores ───────────────────────────────────────────────────────────────
export const users   = new Map(); // userId → user
export const raids   = new Map(); // raidId → raid
export const guilds  = new Map(); // guildId → guild

// ── User helpers ──────────────────────────────────────────────────────────────
export function createUser({ username, heroClass }) {
  const id = uuidv4();
  const user = {
    id, username, heroClass,
    level: 1, xp: 0, totalXp: 0,
    guildId: null,
    stats: { wins: 0, losses: 0, raidsCompleted: 0, totalDamageDealt: 0 },
    createdAt: Date.now(),
  };
  users.set(id, user);
  return user;
}

export function getUser(id) { return users.get(id) || null; }

export function addXP(userId, amount) {
  const u = users.get(userId);
  if (!u) return;
  u.totalXp += amount;
  u.xp      += amount;
  u.level    = Math.floor(Math.sqrt(u.totalXp / 100)) + 1;
}

export function recordRaidResult(userId, { won, damageDealt }) {
  const u = users.get(userId);
  if (!u) return;
  if (won) u.stats.wins++; else u.stats.losses++;
  u.stats.raidsCompleted++;
  u.stats.totalDamageDealt += damageDealt || 0;
  if (won) addXP(userId, 100);
}

// ── Raid helpers ──────────────────────────────────────────────────────────────
export function createRaid({ raidId, monsterName = 'Calculus Titan', monsterHp = 100, teamHp = 100 }) {
  const raid = {
    id: raidId,
    monsterName, monsterHp, monsterMaxHp: monsterHp,
    teamHp,      teamMaxHp: teamHp,
    streak: 0, correctAnswers: 0, questionsAnswered: 0,
    status: 'active',
    players: [],
    playerProgress: {},
    startTime: Date.now(),
  };
  raids.set(raidId, raid);
  return raid;
}

export function getRaid(id) { return raids.get(id) || null; }

// ── Guild helpers ─────────────────────────────────────────────────────────────
export function createGuild({ name, description, leaderId }) {
  const id = uuidv4();
  const guild = {
    id, name, description: description || '',
    leader: leaderId, members: [leaderId],
    memberCount: 1, xp: 0, level: 1,
    createdAt: Date.now(),
  };
  guilds.set(id, guild);
  const u = users.get(leaderId);
  if (u) u.guildId = id;
  return guild;
}

export function getGuild(id) { return guilds.get(id) || null; }

export function joinGuild(guildId, userId) {
  const guild = guilds.get(guildId);
  if (!guild) throw new Error('Guild not found');
  if (guild.memberCount >= 50) throw new Error('Guild is full');
  if (!guild.members.includes(userId)) {
    guild.members.push(userId);
    guild.memberCount++;
  }
  const u = users.get(userId);
  if (u) u.guildId = guildId;
  return guild;
}

export function addGuildXP(guildId, amount) {
  const g = guilds.get(guildId);
  if (!g) return;
  g.xp    += amount;
  g.level  = Math.floor(g.xp / 1000) + 1;
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
export function getGlobalLeaderboard(limit = 20) {
  return [...users.values()]
    .sort((a, b) => b.totalXp - a.totalXp)
    .slice(0, limit)
    .map((u, i) => ({ rank: i + 1, ...u }));
}

export function getGuildLeaderboard(limit = 20) {
  return [...guilds.values()]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit)
    .map((g, i) => ({ rank: i + 1, ...g }));
}
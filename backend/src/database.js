import Database from 'better-sqlite3';
import { resolve } from 'path';
import { mkdirSync } from 'fs';

const DB_PATH = resolve(process.cwd(), 'data', 'edurpg.db');
mkdirSync(resolve(process.cwd(), 'data'), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    hero_class  TEXT NOT NULL DEFAULT 'mage',
    level       INTEGER NOT NULL DEFAULT 1,
    xp          INTEGER NOT NULL DEFAULT 0,
    total_xp    INTEGER NOT NULL DEFAULT 0,
    guild_id    TEXT,
    wins        INTEGER NOT NULL DEFAULT 0,
    losses      INTEGER NOT NULL DEFAULT 0,
    raids_done  INTEGER NOT NULL DEFAULT 0,
    total_dmg   INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS guilds (
    id           TEXT PRIMARY KEY,
    name         TEXT UNIQUE NOT NULL,
    description  TEXT DEFAULT '',
    leader_id    TEXT NOT NULL,
    xp           INTEGER NOT NULL DEFAULT 0,
    level        INTEGER NOT NULL DEFAULT 1,
    member_count INTEGER NOT NULL DEFAULT 1,
    created_at   INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS guild_members (
    guild_id TEXT NOT NULL,
    user_id  TEXT NOT NULL,
    joined_at INTEGER NOT NULL DEFAULT (unixepoch()),
    PRIMARY KEY (guild_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS raids (
    id              TEXT PRIMARY KEY,
    monster_name    TEXT NOT NULL DEFAULT 'Calculus Titan',
    monster_hp      INTEGER NOT NULL,
    monster_max_hp  INTEGER NOT NULL,
    team_hp         INTEGER NOT NULL,
    team_max_hp     INTEGER NOT NULL,
    streak          INTEGER NOT NULL DEFAULT 0,
    correct         INTEGER NOT NULL DEFAULT 0,
    answered        INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'active',
    created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
    ended_at        INTEGER
  );

  CREATE TABLE IF NOT EXISTS raid_players (
    raid_id       TEXT NOT NULL,
    user_id       TEXT NOT NULL,
    damage_dealt  INTEGER NOT NULL DEFAULT 0,
    correct_ans   INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (raid_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT NOT NULL,
    badge      TEXT NOT NULL,
    earned_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

console.log(`✅ SQLite database ready at ${DB_PATH}`);

// ── User helpers ──────────────────────────────────────────────────────────────
export const UserDB = {
  create: db.prepare(`INSERT INTO users (id,username,email,password,hero_class) VALUES (?,?,?,?,?)`),
  getById: db.prepare(`SELECT * FROM users WHERE id=?`),
  getByEmail: db.prepare(`SELECT * FROM users WHERE email=?`),
  getByUsername: db.prepare(`SELECT * FROM users WHERE username=?`),
  getAll: db.prepare(`SELECT id,username,hero_class,level,total_xp,guild_id,wins,raids_done,total_dmg FROM users ORDER BY total_xp DESC`),
  addXP: db.prepare(`UPDATE users SET xp=xp+?, total_xp=total_xp+?, level=? WHERE id=?`),
  recordWin:  db.prepare(`UPDATE users SET wins=wins+1, raids_done=raids_done+1, total_dmg=total_dmg+? WHERE id=?`),
  recordLoss: db.prepare(`UPDATE users SET losses=losses+1, raids_done=raids_done+1, total_dmg=total_dmg+? WHERE id=?`),
  setGuild: db.prepare(`UPDATE users SET guild_id=? WHERE id=?`),
  leaderboard: db.prepare(`SELECT id,username,hero_class,level,total_xp,wins,raids_done FROM users ORDER BY total_xp DESC LIMIT ?`),
  weeklyLeaderboard: db.prepare(`SELECT id,username,hero_class,level,total_xp,wins FROM users WHERE created_at >= ? ORDER BY total_xp DESC LIMIT ?`),
};

// ── Guild helpers ─────────────────────────────────────────────────────────────
export const GuildDB = {
  create: db.prepare(`INSERT INTO guilds (id,name,description,leader_id) VALUES (?,?,?,?)`),
  getById: db.prepare(`SELECT * FROM guilds WHERE id=?`),
  getAll: db.prepare(`SELECT * FROM guilds ORDER BY xp DESC`),
  addMember: db.prepare(`INSERT OR IGNORE INTO guild_members (guild_id,user_id) VALUES (?,?)`),
  removeMember: db.prepare(`DELETE FROM guild_members WHERE guild_id=? AND user_id=?`),
  getMembers: db.prepare(`SELECT u.id,u.username,u.hero_class,u.level,u.total_xp FROM guild_members gm JOIN users u ON u.id=gm.user_id WHERE gm.guild_id=?`),
  updateCount: db.prepare(`UPDATE guilds SET member_count=(SELECT COUNT(*) FROM guild_members WHERE guild_id=?) WHERE id=?`),
  addXP: db.prepare(`UPDATE guilds SET xp=xp+?, level=MAX(1, (xp+?)/1000+1) WHERE id=?`),
  leaderboard: db.prepare(`SELECT * FROM guilds ORDER BY xp DESC LIMIT ?`),
};

// ── Raid helpers ──────────────────────────────────────────────────────────────
export const RaidDB = {
  create: db.prepare(`INSERT INTO raids (id,monster_name,monster_hp,monster_max_hp,team_hp,team_max_hp) VALUES (?,?,?,?,?,?)`),
  getById: db.prepare(`SELECT * FROM raids WHERE id=?`),
  updateHP: db.prepare(`UPDATE raids SET monster_hp=?,team_hp=?,streak=?,correct=?,answered=? WHERE id=?`),
  end: db.prepare(`UPDATE raids SET status=?,ended_at=unixepoch() WHERE id=?`),
  addPlayer: db.prepare(`INSERT OR IGNORE INTO raid_players (raid_id,user_id) VALUES (?,?)`),
  getPlayers: db.prepare(`SELECT u.id,u.username,u.hero_class,rp.damage_dealt,rp.correct_ans FROM raid_players rp JOIN users u ON u.id=rp.user_id WHERE rp.raid_id=?`),
  updatePlayerProgress: db.prepare(`UPDATE raid_players SET damage_dealt=damage_dealt+?,correct_ans=correct_ans+? WHERE raid_id=? AND user_id=?`),
};

// ── Achievement helpers ───────────────────────────────────────────────────────
export const AchievementDB = {
  award: db.prepare(`INSERT OR IGNORE INTO achievements (user_id,badge) VALUES (?,?)`),
  getByUser: db.prepare(`SELECT badge,earned_at FROM achievements WHERE user_id=? ORDER BY earned_at DESC`),
};

// ── XP + level up transaction ─────────────────────────────────────────────────
export function awardXP(userId, amount) {
  const user = UserDB.getById.get(userId);
  if (!user) return;
  const newTotal = (user.total_xp || 0) + amount;
  const newLevel = Math.floor(Math.sqrt(newTotal / 100)) + 1;
  UserDB.addXP.run(amount, amount, newLevel, userId);

  // Achievement checks
  if (newLevel >= 5  && user.level < 5)  AchievementDB.award.run(userId, 'Adept Scholar');
  if (newLevel >= 10 && user.level < 10) AchievementDB.award.run(userId, 'Master Scholar');
}

export default db;
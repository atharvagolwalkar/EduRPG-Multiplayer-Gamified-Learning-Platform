import { db } from '../store.js';
import { v4 as uuidv4 } from 'uuid';
import {
  computeUnlockedSkills,
  createInitialProgression,
  getSubjectMasteryAverage,
  updateMasteryBucket,
} from '../config/progression.js';
import { enrichGuildProgression } from '../config/guildProgression.js';

export class UserService {
  static async createUser(userData) {
    const userId = userData.id || uuidv4();
    const user = {
      id: userId,
      username: userData.username,
      email: userData.email,
      heroClass: userData.heroClass,
      level: 1,
      xp: 0,
      totalXp: 0,
      guildId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stats: {
        wins: 0,
        losses: 0,
        raidsCompleted: 0,
        monsterDefeated: 0,
        totalDamageDealt: 0,
      },
      progression: createInitialProgression(userData.heroClass),
    };

    await db.collection('users').doc(userId).set(user);
    return user;
  }

  static async getUser(userId) {
    const snapshot = await db.collection('users').doc(userId).get();
    return snapshot.exists ? snapshot.data() : null;
  }

  static async updateUser(userId, updates) {
    updates.updatedAt = new Date().toISOString();
    await db.collection('users').doc(userId).update(updates);
  }

  static async addXP(userId, xpAmount) {
    const user = await this.getUser(userId);
    if (!user) return null;

    const newTotalXp = (user.totalXp || 0) + xpAmount;
    const newLevel = Math.floor(Math.sqrt(newTotalXp / 100)) + 1;

    await this.updateUser(userId, {
      xp: newTotalXp,
      totalXp: newTotalXp,
      level: newLevel,
    });

    return { newLevel, newTotalXp };
  }

  static async recordRaidResult(userId, outcome) {
    const user = await this.getUser(userId);
    if (!user) return null;

    const currentStats = user.stats || {};

    const nextStats = {
      wins: (currentStats.wins || 0) + (outcome.won ? 1 : 0),
      losses: (currentStats.losses || 0) + (outcome.won ? 0 : 1),
      raidsCompleted: (currentStats.raidsCompleted || 0) + 1,
      monsterDefeated: (currentStats.monsterDefeated || 0) + (outcome.monsterDefeated ? 1 : 0),
      totalDamageDealt: (currentStats.totalDamageDealt || 0) + (outcome.damageDealt || 0),
    };

    await this.updateUser(userId, { stats: nextStats });
    return nextStats;
  }

  static async recordQuestionOutcome(userId, payload) {
    const user = await this.getUser(userId);
    if (!user) return null;

    const subject = payload.subject || 'general';
    const concept = payload.concept || 'general';
    const progression = user.progression || createInitialProgression(user.heroClass);
    const nextMastery = {
      ...progression.mastery,
      [subject]: updateMasteryBucket(progression.mastery?.[subject], concept, payload.isCorrect),
    };
    const unlockedSkills = computeUnlockedSkills(user.heroClass, user.level, nextMastery);
    const progressionHistory = [
      ...(progression.progressionHistory || []),
      {
        type: 'question',
        subject,
        concept,
        correct: payload.isCorrect,
        timestamp: new Date().toISOString(),
      },
    ].slice(-25);

    const updatedProgression = {
      mastery: nextMastery,
      unlockedSkills,
      progressionHistory,
    };

    await this.updateUser(userId, { progression: updatedProgression });
    return updatedProgression;
  }

  static getMasterySummary(user) {
    const mastery = user.progression?.mastery || {};

    return {
      mathematics: getSubjectMasteryAverage(mastery.mathematics),
      programming: getSubjectMasteryAverage(mastery.programming),
      physics: getSubjectMasteryAverage(mastery.physics),
      general: getSubjectMasteryAverage(mastery.general),
    };
  }

  static async getLeaderboard(limit = 10) {
    const snapshot = await db
      .collection('users')
      .orderBy('totalXp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc, index) => ({
      rank: index + 1,
      ...doc.data(),
    }));
  }

  static async getAllUsers() {
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map((doc) => doc.data());
  }
}

export class RaidService {
  static async startRaid(raidData) {
    const raidId = raidData.id || uuidv4();
    const players = raidData.players || [];
    const raid = {
      id: raidId,
      players,
      monsterName: raidData.monsterName,
      monsterMaxHp: raidData.monsterMaxHp,
      monsterHp: raidData.monsterMaxHp,
      teamMaxHp: raidData.teamMaxHp || 100,
      teamHp: raidData.teamMaxHp || 100,
      status: 'active',
      startTime: Date.now(),
      endTime: null,
      winner: null,
      totalDamageDealt: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      streak: 0,
      playerProgress: Object.fromEntries(
        players.map((player) => [
          player.id,
          {
            damageDealt: 0,
            correctAnswers: 0,
          },
        ])
      ),
    };

    await db.collection('raids').doc(raidId).set(raid);
    return raid;
  }

  static async getRaid(raidId) {
    const snapshot = await db.collection('raids').doc(raidId).get();
    return snapshot.exists ? snapshot.data() : null;
  }

  static async updateRaid(raidId, updates) {
    await db.collection('raids').doc(raidId).update(updates);
  }

  static async endRaid(raidId, winnerId, xpReward) {
    const raid = await this.getRaid(raidId);
    if (!raid) return null;

    const updates = {
      status: 'completed',
      endTime: Date.now(),
      winner: winnerId,
    };

    await this.updateRaid(raidId, updates);

    if (xpReward) {
      for (const player of raid.players) {
        await UserService.addXP(player.id, xpReward);
      }
    }

    return { ...raid, ...updates };
  }

  static async getRaidHistory(userId, limit = 10) {
    const snapshot = await db
      .collection('raids')
      .where('status', '==', 'completed')
      .orderBy('endTime', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs
      .map((doc) => doc.data())
      .filter((raid) => raid.players.some((p) => p.id === userId));
  }
}

export class GuildService {
  static async createGuild(guildData) {
    const guildId = uuidv4();
    const guild = enrichGuildProgression({
      id: guildId,
      name: guildData.name,
      description: guildData.description,
      leader: guildData.leader,
      members: [guildData.leader],
      memberCount: 1,
      xp: 0,
      level: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await db.collection('guilds').doc(guildId).set(guild);
    return guild;
  }

  static async getGuild(guildId) {
    const snapshot = await db.collection('guilds').doc(guildId).get();
    return snapshot.exists ? snapshot.data() : null;
  }

  static async addMember(guildId, userId) {
    const guild = await this.getGuild(guildId);
    if (!guild) return null;

    if (guild.memberCount >= 50) {
      throw new Error('Guild is full');
    }

    guild.members.push(userId);
    guild.memberCount = guild.members.length;
    guild.updatedAt = new Date().toISOString();
    const enrichedGuild = enrichGuildProgression(guild);

    await db.collection('guilds').doc(guildId).set(enrichedGuild);
    await UserService.updateUser(userId, { guildId });

    return enrichedGuild;
  }

  static async removeMember(guildId, userId) {
    const guild = await this.getGuild(guildId);
    if (!guild) return null;

    guild.members = guild.members.filter((id) => id !== userId);
    guild.memberCount = guild.members.length;
    guild.updatedAt = new Date().toISOString();
    const enrichedGuild = enrichGuildProgression(guild);

    await db.collection('guilds').doc(guildId).set(enrichedGuild);
    await UserService.updateUser(userId, { guildId: null });

    return enrichedGuild;
  }

  static async addXP(guildId, xpAmount) {
    const guild = await this.getGuild(guildId);
    if (!guild) return null;

    guild.xp = (guild.xp || 0) + xpAmount;
    guild.level = Math.floor(guild.xp / 1000) + 1;
    guild.updatedAt = new Date().toISOString();
    const enrichedGuild = enrichGuildProgression(guild);

    await db.collection('guilds').doc(guildId).set(enrichedGuild);
    return enrichedGuild;
  }

  static async getLeaderboard(limit = 10) {
    const snapshot = await db
      .collection('guilds')
      .orderBy('xp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc, index) => ({
      rank: index + 1,
      ...doc.data(),
    }));
  }

  static async getAllGuilds() {
    const snapshot = await db.collection('guilds').orderBy('memberCount', 'desc').get();
    return snapshot.docs.map((doc) => doc.data());
  }
}

export class LeaderboardService {
  static async getGlobalLeaderboard(limit = 10) {
    return UserService.getLeaderboard(limit);
  }

  static async getWeeklyLeaderboard(limit = 10) {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const snapshot = await db
      .collection('users')
      .where('updatedAt', '>=', new Date(oneWeekAgo).toISOString())
      .orderBy('xp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc, index) => ({
      rank: index + 1,
      ...doc.data(),
    }));
  }

  static async getGuildLeaderboard(limit = 10) {
    return GuildService.getLeaderboard(limit);
  }
}

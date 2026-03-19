import { GuildService, RaidService, UserService } from './services/FirebaseService.js';

// In-memory raid state (fast path; Firestore is the durable source)
const activeRaids = new Map();
// raidId → NodeJS timer handle
const raidTimers = new Map();

const RAID_DURATION_MS = 3 * 60 * 1000; // 3 minutes
const MONSTER_BASE_HP = 100;
const TEAM_BASE_HP = 100;
const WRONG_PENALTY = 20;
const STREAK_BONUS_THRESHOLD = 3;
const STREAK_BONUS_DMG = 5;
const MAX_STREAK_MULTIPLIER = 3; // ×3 at streak 10+

function computeDamage(baseDamage, streak) {
  const mult = 1 + Math.min(streak * 0.1, MAX_STREAK_MULTIPLIER - 1);
  let dmg = Math.floor(baseDamage * mult);
  if (streak >= STREAK_BONUS_THRESHOLD) dmg += STREAK_BONUS_DMG;
  return dmg;
}

function getAdaptiveSignal(raid) {
  const total = raid.questionsAnswered || 0;
  if (total < 3) return null; // not enough data yet
  const accuracy = (raid.correctAnswers || 0) / total;
  if (accuracy >= 0.85) return 'increase';
  if (accuracy <= 0.40) return 'decrease';
  return 'maintain';
}

function getRaidSnapshot(raid) {
  return {
    id: raid.id,
    players: raid.players || [],
    monsterName: raid.monsterName,
    monsterHp: raid.monsterHp,
    monsterMaxHp: raid.monsterMaxHp,
    teamHp: raid.teamHp,
    teamMaxHp: raid.teamMaxHp,
    streak: raid.streak || 0,
    status: raid.status,
    playerProgress: raid.playerProgress || {},
    correctAnswers: raid.correctAnswers || 0,
    questionsAnswered: raid.questionsAnswered || 0,
    timeRemaining: raid.timeRemaining ?? RAID_DURATION_MS,
    adaptiveSignal: getAdaptiveSignal(raid),
  };
}

function startRaidTimer(raidId, namespace) {
  const startTime = Date.now();

  const interval = setInterval(async () => {
    const raid = activeRaids.get(raidId);
    if (!raid) { clearInterval(interval); raidTimers.delete(raidId); return; }

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, RAID_DURATION_MS - elapsed);
    raid.timeRemaining = remaining;

    // Broadcast tick every 5 s (avoids flooding)
    if (Math.floor(elapsed / 5000) !== Math.floor((elapsed - 200) / 5000)) {
      namespace.to(raidId).emit('raid:tick', { timeRemaining: remaining });
    }

    if (remaining <= 0) {
      clearInterval(interval);
      raidTimers.delete(raidId);
      await handleRaidTimeout(raidId, raid, namespace);
    }
  }, 200);

  raidTimers.set(raidId, interval);
}

export function setupMultiplayerWebSocket(io) {
  const raidNamespace = io.of('/raids');

  raidNamespace.on('connection', (socket) => {
    console.log(`[raids] Player connected: ${socket.id}`);

    // ── Join / create raid ───────────────────────────────────────────────────
    socket.on('raid:join', async (data) => {
      try {
        const { raidId, player } = data;
        let raid = activeRaids.get(raidId) ?? await RaidService.getRaid(raidId).catch(() => null);

        if (!raid) {
          raid = await RaidService.startRaid({
            id: raidId,
            players: [player],
            monsterName: 'Calculus Titan',
            monsterMaxHp: MONSTER_BASE_HP,
            teamMaxHp: TEAM_BASE_HP,
          });
          raid.timeRemaining = RAID_DURATION_MS;
          activeRaids.set(raidId, raid);
          startRaidTimer(raidId, raidNamespace);
        } else {
          const alreadyJoined = (raid.players || []).some((p) => p.id === player.id);
          if (!alreadyJoined) {
            raid.players = [...(raid.players || []), player];
          }
          raid.playerProgress = {
            ...(raid.playerProgress || {}),
            [player.id]: raid.playerProgress?.[player.id] ?? { damageDealt: 0, correctAnswers: 0 },
          };
          await RaidService.updateRaid(raidId, {
            players: raid.players,
            playerProgress: raid.playerProgress,
          }).catch(console.error);
          activeRaids.set(raidId, raid);
        }

        socket.join(raidId);
        socket.raidId = raidId;
        socket.playerId = player.id;

        socket.emit('raid:sync', { raid: getRaidSnapshot(raid), message: 'Raid synchronized.' });
        raidNamespace.to(raidId).emit('raid:player-joined', {
          raid: getRaidSnapshot(raid),
          players: raid.players,
          message: `${player.username || 'A player'} joined the raid.`,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
        console.error('[raid:join]', err);
      }
    });

    // ── Answer submission ────────────────────────────────────────────────────
    socket.on('raid:answer', async (data) => {
      try {
        const { raidId, isCorrect, baseDamage = 25, subject, concept } = data;
        const raid = activeRaids.get(raidId) ?? await RaidService.getRaid(raidId).catch(() => null);
        if (!raid) { socket.emit('error', { message: 'Raid not found.' }); return; }
        if (raid.status !== 'active') return;

        const playerId = socket.playerId;
        raid.playerProgress = raid.playerProgress || {};
        raid.playerProgress[playerId] = raid.playerProgress[playerId] || { damageDealt: 0, correctAnswers: 0 };

        let damage = 0;
        if (isCorrect) {
          const nextStreak = (raid.streak || 0) + 1;
          damage = computeDamage(baseDamage, nextStreak);
          raid.monsterHp = Math.max(0, raid.monsterHp - damage);
          raid.streak = nextStreak;
          raid.correctAnswers = (raid.correctAnswers || 0) + 1;
          raid.playerProgress[playerId].damageDealt += damage;
          raid.playerProgress[playerId].correctAnswers += 1;
        } else {
          damage = WRONG_PENALTY;
          raid.teamHp = Math.max(0, raid.teamHp - damage);
          raid.streak = 0;
        }
        raid.questionsAnswered = (raid.questionsAnswered || 0) + 1;

        // Record outcome for adaptive difficulty
        UserService.recordQuestionOutcome(playerId, { subject, concept, isCorrect }).catch(console.error);

        await RaidService.updateRaid(raidId, {
          monsterHp: raid.monsterHp,
          teamHp: raid.teamHp,
          streak: raid.streak,
          correctAnswers: raid.correctAnswers,
          questionsAnswered: raid.questionsAnswered,
          playerProgress: raid.playerProgress,
        }).catch(console.error);

        activeRaids.set(raidId, raid);

        raidNamespace.to(raidId).emit('raid:damage', {
          raid: getRaidSnapshot(raid),
          type: isCorrect ? 'player-attack' : 'monster-attack',
          damage,
          playerId,
          isCritical: isCorrect && raid.streak >= 5,
          message: isCorrect
            ? `⚔️ ${damage} dmg! Streak ×${raid.streak}`
            : `💥 Boss strikes for ${damage}!`,
        });

        if (raid.monsterHp <= 0) {
          clearInterval(raidTimers.get(raidId));
          raidTimers.delete(raidId);
          await handleRaidVictory(raidId, raid, raidNamespace);
        } else if (raid.teamHp <= 0) {
          clearInterval(raidTimers.get(raidId));
          raidTimers.delete(raidId);
          await handleRaidDefeat(raidId, raid, raidNamespace);
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
        console.error('[raid:answer]', err);
      }
    });

    // ── Disconnect ───────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[raids] Player disconnected: ${socket.id}`);
      if (socket.raidId) {
        raidNamespace.to(socket.raidId).emit('raid:player-left', {
          playerId: socket.playerId,
          message: 'A player left the raid.',
        });
      }
    });
  });

  return raidNamespace;
}

// ── Raid outcome helpers ──────────────────────────────────────────────────────
async function handleRaidVictory(raidId, raid, namespace) {
  const xpReward = 100 + (raid.correctAnswers || 0) * 10;
  for (const player of raid.players || []) {
    const progress = raid.playerProgress?.[player.id] || {};
    await UserService.recordRaidResult(player.id, { won: true, monsterDefeated: true, damageDealt: progress.damageDealt || 0 }).catch(console.error);
    if (player.guildId) await GuildService.addXP(player.guildId, Math.floor(xpReward / 2)).catch(console.error);
  }
  await RaidService.endRaid(raidId, raid.players?.[0]?.id || null, xpReward).catch(console.error);
  namespace.to(raidId).emit('raid:end', {
    status: 'victory',
    xpReward,
    totalDamage: raid.totalDamageDealt || 0,
    correctAnswers: raid.correctAnswers || 0,
    raid: getRaidSnapshot({ ...raid, status: 'completed' }),
  });
  activeRaids.delete(raidId);
}

async function handleRaidDefeat(raidId, raid, namespace) {
  for (const player of raid.players || []) {
    const progress = raid.playerProgress?.[player.id] || {};
    await UserService.recordRaidResult(player.id, { won: false, monsterDefeated: false, damageDealt: progress.damageDealt || 0 }).catch(console.error);
  }
  await RaidService.endRaid(raidId, null, 0).catch(console.error);
  namespace.to(raidId).emit('raid:end', {
    status: 'defeat',
    xpReward: 0,
    totalDamage: raid.totalDamageDealt || 0,
    correctAnswers: raid.correctAnswers || 0,
    raid: getRaidSnapshot({ ...raid, status: 'completed' }),
  });
  activeRaids.delete(raidId);
}

async function handleRaidTimeout(raidId, raid, namespace) {
  console.log(`[raids] Raid ${raidId} timed out`);
  // Timeout = defeat if monster still alive
  if (raid.monsterHp > 0) {
    await handleRaidDefeat(raidId, raid, namespace);
  }
}
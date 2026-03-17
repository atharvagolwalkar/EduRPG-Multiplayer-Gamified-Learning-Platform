import { GuildService, RaidService, UserService } from './services/FirebaseService.js';

const activeRaids = new Map();

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
  };
}

export function setupMultiplayerWebSocket(io) {
  const raidNamespace = io.of('/raids');

  raidNamespace.on('connection', (socket) => {
    console.log(`Player connected to raids: ${socket.id}`);

    socket.on('raid:join', async (data) => {
      try {
        const { raidId, player } = data;
        let raid = (await RaidService.getRaid(raidId)) || activeRaids.get(raidId);

        if (!raid) {
          raid = await RaidService.startRaid({
            id: raidId,
            players: [player],
            monsterName: 'Calculus Titan',
            monsterMaxHp: 100,
            teamMaxHp: 100,
          });
        } else {
          const currentPlayers = raid.players || [];
          const alreadyJoined = currentPlayers.some((existingPlayer) => existingPlayer.id === player.id);

          if (!alreadyJoined) {
            raid.players = [...currentPlayers, player];
          }

          raid.playerProgress = {
            ...(raid.playerProgress || {}),
            [player.id]: raid.playerProgress?.[player.id] || {
              damageDealt: 0,
              correctAnswers: 0,
            },
          };

          await RaidService.updateRaid(raidId, {
            players: raid.players,
            playerProgress: raid.playerProgress,
          });
        }

        activeRaids.set(raidId, raid);

        socket.join(raidId);
        socket.raidId = raidId;
        socket.playerId = player.id;

        socket.emit('raid:sync', {
          raid: getRaidSnapshot(raid),
          message: 'Raid state synchronized',
        });

        raidNamespace.to(raidId).emit('raid:player-joined', {
          raid: getRaidSnapshot(raid),
          players: raid.players,
          message: `${player.username || 'A player'} joined the raid.`,
        });

        console.log(`Player ${player.username || player.id} joined raid ${raidId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
        console.error('Error joining raid:', error);
      }
    });

    socket.on('raid:answer', async (data) => {
      try {
        const { raidId, isCorrect, damage, streak, subject, concept } = data;
        const raid = activeRaids.get(raidId) || (await RaidService.getRaid(raidId));

        if (!raid) {
          socket.emit('error', { message: 'Raid not found' });
          return;
        }

        const playerId = socket.playerId;
        raid.playerProgress = raid.playerProgress || {};
        raid.playerProgress[playerId] = raid.playerProgress[playerId] || {
          damageDealt: 0,
          correctAnswers: 0,
        };

        if (isCorrect) {
          raid.monsterHp = Math.max(0, raid.monsterHp - damage);
          raid.totalDamageDealt = (raid.totalDamageDealt || 0) + damage;
          raid.correctAnswers = (raid.correctAnswers || 0) + 1;
          raid.streak = streak;
          raid.playerProgress[playerId].damageDealt += damage;
          raid.playerProgress[playerId].correctAnswers += 1;
        } else {
          raid.teamHp = Math.max(0, raid.teamHp - 20);
          raid.streak = 0;
        }

        raid.questionsAnswered = (raid.questionsAnswered || 0) + 1;

        await UserService.recordQuestionOutcome(playerId, {
          subject,
          concept,
          isCorrect,
        });

        await RaidService.updateRaid(raidId, {
          monsterHp: raid.monsterHp,
          teamHp: raid.teamHp,
          streak: raid.streak,
          totalDamageDealt: raid.totalDamageDealt,
          correctAnswers: raid.correctAnswers,
          questionsAnswered: raid.questionsAnswered,
          playerProgress: raid.playerProgress,
        });

        activeRaids.set(raidId, raid);

        raidNamespace.to(raidId).emit('raid:damage', {
          raid: getRaidSnapshot(raid),
          type: isCorrect ? 'player-attack' : 'monster-attack',
          damage,
          playerId,
          message: isCorrect ? 'Correct answer. Damage dealt.' : 'Wrong answer. Team took damage.',
        });

        if (raid.monsterHp <= 0) {
          await handleRaidVictory(raidId, raid, raidNamespace);
        } else if (raid.teamHp <= 0) {
          await handleRaidDefeat(raidId, raid, raidNamespace);
        }
      } catch (error) {
        socket.emit('error', { message: error.message });
        console.error('Error submitting answer:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);

      if (socket.raidId) {
        raidNamespace.to(socket.raidId).emit('raid:player-left', {
          playerId: socket.playerId,
          message: 'A player has left the raid.',
        });
      }
    });
  });

  return raidNamespace;
}

async function handleRaidVictory(raidId, raid, namespace) {
  console.log(`Raid ${raidId} completed: victory`);

  const xpReward = 100 + (raid.correctAnswers || 0) * 10;

  for (const player of raid.players || []) {
    const progress = raid.playerProgress?.[player.id] || { damageDealt: 0 };
    await UserService.recordRaidResult(player.id, {
      won: true,
      monsterDefeated: true,
      damageDealt: progress.damageDealt || 0,
    });

    if (player.guildId) {
      await GuildService.addXP(player.guildId, xpReward / 2);
    }
  }

  await RaidService.endRaid(raidId, raid.players?.[0]?.id || null, xpReward);

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
  console.log(`Raid ${raidId} completed: defeat`);

  for (const player of raid.players || []) {
    const progress = raid.playerProgress?.[player.id] || { damageDealt: 0 };
    await UserService.recordRaidResult(player.id, {
      won: false,
      monsterDefeated: false,
      damageDealt: progress.damageDealt || 0,
    });
  }

  await RaidService.endRaid(raidId, null, 0);

  namespace.to(raidId).emit('raid:end', {
    status: 'defeat',
    xpReward: 0,
    totalDamage: raid.totalDamageDealt || 0,
    correctAnswers: raid.correctAnswers || 0,
    raid: getRaidSnapshot({ ...raid, status: 'completed' }),
  });

  activeRaids.delete(raidId);
}

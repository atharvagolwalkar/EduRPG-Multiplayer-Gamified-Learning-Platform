import { RaidService, UserService, GuildService } from './services/FirebaseService.js';

const activeRaids = new Map(); // In-memory tracking for real-time sync

export function setupMultiplayerWebSocket(io) {
  const raidNamespace = io.of('/raids');

  raidNamespace.on('connection', (socket) => {
    console.log(`🎮 Player connected to raids: ${socket.id}`);

    // ==================== RAID EVENTS ====================

    socket.on('raid:join', async (data) => {
      try {
        const { raidId, player } = data;
        
        // Get or create raid in Firebase
        let raid = await RaidService.getRaid(raidId);
        
        if (!raid) {
          // Create new raid
          raid = await RaidService.startRaid({
            players: [player],
            monsterName: 'Calculus Titan',
            monsterMaxHp: 100,
            teamMaxHp: 100,
          });
        } else {
          // Add player to existing raid
          raid.players.push(player);
          await RaidService.updateRaid(raidId, { players: raid.players });
        }

        // Track in-memory for real-time
        if (!activeRaids.has(raidId)) {
          activeRaids.set(raidId, raid);
        }

        socket.join(raidId);
        socket.raidId = raidId;
        socket.playerId = player.id;

        // Broadcast to all players in raid
        raidNamespace.to(raidId).emit('raid:player-joined', {
          players: raid.players,
          message: `${player.username} joined the raid!`,
        });

        console.log(`✓ Player ${player.username} joined raid ${raidId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
        console.error('Error joining raid:', error);
      }
    });

    // ==================== ANSWER SUBMISSION ====================

    socket.on('raid:answer', async (data) => {
      try {
        const { raidId, isCorrect, damage, streak } = data;
        
        let raid = activeRaids.get(raidId) || (await RaidService.getRaid(raidId));

        if (!raid) {
          socket.emit('error', { message: 'Raid not found' });
          return;
        }

        if (isCorrect) {
          // Apply damage to monster
          raid.monsterHp = Math.max(0, raid.monsterHp - damage);
          raid.totalDamageDealt = (raid.totalDamageDealt || 0) + damage;
          raid.correctAnswers = (raid.correctAnswers || 0) + 1;
          raid.streak = streak;
        } else {
          // Damage to team
          raid.teamHp = Math.max(0, raid.teamHp - 20);
          raid.streak = 0;
        }

        raid.questionsAnswered = (raid.questionsAnswered || 0) + 1;

        // Update Firebase
        await RaidService.updateRaid(raidId, {
          monsterHp: raid.monsterHp,
          teamHp: raid.teamHp,
          streak: raid.streak,
          totalDamageDealt: raid.totalDamageDealt,
          correctAnswers: raid.correctAnswers,
          questionsAnswered: raid.questionsAnswered,
        });

        // Update in-memory
        activeRaids.set(raidId, raid);

        // Broadcast damage to all players
        raidNamespace.to(raidId).emit('raid:damage', {
          type: isCorrect ? 'player-attack' : 'monster-attack',
          damage,
          monsterHp: raid.monsterHp,
          teamHp: raid.teamHp,
          streak: raid.streak,
          playerId: socket.playerId,
        });

        // Check raid status
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

    // ==================== DISCONNECT ====================

    socket.on('disconnect', () => {
      console.log(`✗ Player disconnected: ${socket.id}`);
      
      if (socket.raidId) {
        raidNamespace.to(socket.raidId).emit('raid:player-left', {
          playerId: socket.playerId,
          message: 'A player has left the raid',
        });
      }
    });

    socket.on('error', (error) => {
      console.error(`WebSocket error: ${error}`);
    });
  });

  return raidNamespace;
}

async function handleRaidVictory(raidId, raid, namespace) {
  console.log(`🎉 Raid ${raidId} completed - Victory!`);

  // Award XP to all players
  const xpReward = 100 + raid.correctAnswers * 10;
  for (const player of raid.players) {
    await UserService.addXP(player.id, xpReward);
    
    // Update if in a guild
    if (player.guildId) {
      await GuildService.addXP(player.guildId, xpReward / 2);
    }
  }

  // End raid in Firebase
  await RaidService.endRaid(raidId, raid.players[0].id, xpReward);

  // Notify all players
  namespace.to(raidId).emit('raid:end', {
    status: 'victory',
    xpReward,
    totalDamage: raid.totalDamageDealt,
    correctAnswers: raid.correctAnswers,
  });

  // Clean up
  activeRaids.delete(raidId);
}

async function handleRaidDefeat(raidId, raid, namespace) {
  console.log(`💀 Raid ${raidId} completed - Defeat!`);

  // End raid in Firebase
  await RaidService.endRaid(raidId, null, 0);

  // Notify all players
  namespace.to(raidId).emit('raid:end', {
    status: 'defeat',
    xpReward: 0,
    totalDamage: raid.totalDamageDealt,
    correctAnswers: raid.correctAnswers,
  });

  // Clean up
  activeRaids.delete(raidId);
}

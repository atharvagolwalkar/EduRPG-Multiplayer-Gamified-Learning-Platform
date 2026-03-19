import { v4 as uuidv4 } from 'uuid';
import { isMockFirebase, realtimeDb } from './firebase.js';

const mockRaids = new Map();
const mockGuilds = new Map();
const mockPlayers = new Map();

function createDefaultRaid(raidId) {
  return {
    id: raidId,
    players: [],
    monsterHp: 100,
    teamHp: 100,
    streak: 0,
    startTime: Date.now(),
  };
}

export function setupWebSocket(io) {
  io.on('connection', (socket) => {
    console.log(`✓ Player connected: ${socket.id}`);

    socket.on('raid:join', async (data) => {
      const { raidId, player } = data;
      mockPlayers.set(socket.id, player);
      
      if (isMockFirebase || !realtimeDb) {
        let raid = mockRaids.get(raidId) || createDefaultRaid(raidId);
        raid.players.push({ ...player, socketId: socket.id });
        mockRaids.set(raidId, raid);
        
        socket.join(raidId);
        io.to(raidId).emit('raid:player-joined', {
          players: raid.players,
          message: `${player.username} joined the raid!`,
        });
        console.log(`✓ Player ${player.username} joined raid ${raidId}`);
        return;
      }

      // Firebase realtime
      const raidRef = realtimeDb.child('raids').child(raidId);
      await raidRef.transaction((current) => {
        const raid = current || createDefaultRaid(raidId);
        raid.players.push({ ...player, socketId: socket.id });
        return raid;
      });
      
      socket.join(raidId);
      io.to(raidId).emit('raid:player-joined', player);
      console.log(`✓ Player ${player.username} joined Firebase raid ${raidId}`);
    });

    // Player answers question
    socket.on('raid:answer', async (data) => {
      const { raidId, isCorrect, damage, playerId } = data;

      if (isMockFirebase || !realtimeDb) {
        const raid = mockRaids.get(raidId);

        if (!raid) {
          return;
        }

        if (isCorrect) {
          raid.monsterHp = Math.max(0, raid.monsterHp - damage);
          raid.streak += 1;

          io.to(raidId).emit('raid:damage', {
            type: 'player-attack',
            damage,
            monsterHp: raid.monsterHp,
            streak: raid.streak,
            playerId,
          });
        } else {
          raid.teamHp = Math.max(0, raid.teamHp - 20);
          raid.streak = 0;

          io.to(raidId).emit('raid:damage', {
            type: 'monster-attack',
            damage: 20,
            teamHp: raid.teamHp,
            streak: 0,
          });
        }

        if (raid.monsterHp <= 0) {
          io.to(raidId).emit('raid:end', {
            status: 'victory',
            xpReward: 100,
          });
          mockRaids.delete(raidId);
        } else if (raid.teamHp <= 0) {
          io.to(raidId).emit('raid:end', {
            status: 'defeat',
          });
          mockRaids.delete(raidId);
        }

        return;
      }

      const raidRef = realtimeDb.child('raids').child(raidId);
      const snapshot = await raidRef.once('value');
      const raid = snapshot.val();

      if (!raid) {
        return;
      }

      if (isCorrect) {
        raid.monsterHp = Math.max(0, raid.monsterHp - damage);
        raid.streak += 1;

        io.to(raidId).emit('raid:damage', {
          type: 'player-attack',
          damage,
          monsterHp: raid.monsterHp,
          streak: raid.streak,
          playerId,
        });
      } else {
        raid.teamHp = Math.max(0, raid.teamHp - 20);
        raid.streak = 0;

        io.to(raidId).emit('raid:damage', {
          type: 'monster-attack',
          damage: 20,
          teamHp: raid.teamHp,
          streak: 0,
        });
      }

      await raidRef.set(raid);

      if (raid.monsterHp <= 0) {
        io.to(raidId).emit('raid:end', {
          status: 'victory',
          xpReward: 100,
        });
        await raidRef.remove();
      } else if (raid.teamHp <= 0) {
        io.to(raidId).emit('raid:end', {
          status: 'defeat',
        });
        await raidRef.remove();
      }
    });

    // Create guild
    socket.on('guild:create', async (data) => {
      const { name, creator } = data;
      const guildId = uuidv4();
      const guild = {
        id: guildId,
        name,
        creator,
        members: [creator],
        xp: 0,
      };

      if (isMockFirebase || !realtimeDb) {
        mockGuilds.set(guildId, guild);
      } else {
        await realtimeDb.child('guilds').child(guildId).set(guild);
      }

      socket.emit('guild:created', guild);
      console.log(`✓ Guild created: ${name}`);
    });

    // Join guild
    socket.on('guild:join', async (data) => {
      const { guildId, player } = data;
      let guild;

      if (isMockFirebase || !realtimeDb) {
        guild = mockGuilds.get(guildId);
      } else {
        const snapshot = await realtimeDb.child('guilds').child(guildId).once('value');
        guild = snapshot.val();
      }

      if (guild && guild.members.length < 50) {
        guild.members.push(player);

        if (isMockFirebase || !realtimeDb) {
          mockGuilds.set(guildId, guild);
        } else {
          await realtimeDb.child('guilds').child(guildId).set(guild);
        }

        io.emit('guild:updated', { guild, event: 'member-joined' });
      }
    });

    // Get all raids
    socket.on('raids:list', async () => {
      if (isMockFirebase || !realtimeDb) {
        const raidsList = Array.from(mockRaids.values()).map((raid) => ({
          id: raid.id,
          playerCount: raid.players.length,
          monsterHp: raid.monsterHp,
        }));
        socket.emit('raids:data', raidsList);
        return;
      }

      const snapshot = await realtimeDb.child('raids').once('value');
      const raidsData = snapshot.val() || {};
      const raidsList = Object.values(raidsData).map((raid) => ({
        id: raid.id,
        playerCount: (raid.players || []).length,
        monsterHp: raid.monsterHp,
      }));
      socket.emit('raids:data', raidsList);
    });

    // Get all guilds
    socket.on('guilds:list', async () => {
      if (isMockFirebase || !realtimeDb) {
        const guildsList = Array.from(mockGuilds.values()).map((guild) => ({
          id: guild.id,
          name: guild.name,
          memberCount: guild.members.length,
        }));
        socket.emit('guilds:data', guildsList);
        return;
      }

      const snapshot = await realtimeDb.child('guilds').once('value');
      const guildsData = snapshot.val() || {};
      const guildsList = Object.values(guildsData).map((guild) => ({
        id: guild.id,
        name: guild.name,
        memberCount: (guild.members || []).length,
      }));
      socket.emit('guilds:data', guildsList);
    });

    // Disconnect
    socket.on('disconnect', () => {
      const player = mockPlayers.get(socket.id);
      if (player) {
        console.log(`✗ Player disconnected: ${player.username}`);
        mockPlayers.delete(socket.id);
      }
    });

    socket.on('error', (error) => {
      console.error(`WebSocket error: ${error}`);
    });
  });

  io.on('error', (error) => {
    console.error(`Socket.io error: ${error}`);
  });
}

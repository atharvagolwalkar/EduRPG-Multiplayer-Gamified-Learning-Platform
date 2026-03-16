import { v4 as uuidv4 } from 'uuid';

// In-memory store (replace with Firebase in production)
const raids = new Map();
const guilds = new Map();
const players = new Map();

export function setupWebSocket(io) {
  io.on('connection', (socket) => {
    console.log(`✓ Player connected: ${socket.id}`);

    // Player joins raid
    socket.on('raid:join', (data) => {
      const { raidId, player } = data;
      let raid = raids.get(raidId);

      if (!raid) {
        raid = {
          id: raidId,
          players: [],
          monsterHp: 100,
          teamHp: 100,
          streak: 0,
          startTime: Date.now(),
        };
        raids.set(raidId, raid);
      }

      raid.players.push({ ...player, socketId: socket.id });
      players.set(socket.id, player);
      socket.join(raidId);

      io.to(raidId).emit('raid:player-joined', {
        players: raid.players,
        message: `${player.username} joined the raid!`,
      });

      console.log(`✓ Player ${player.username} joined raid ${raidId}`);
    });

    // Player answers question
    socket.on('raid:answer', (data) => {
      const { raidId, isCorrect, damage, playerId } = data;
      const raid = raids.get(raidId);

      if (raid) {
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

        // Check raid status
        if (raid.monsterHp <= 0) {
          io.to(raidId).emit('raid:end', {
            status: 'victory',
            xpReward: 100,
          });
          raids.delete(raidId);
        } else if (raid.teamHp <= 0) {
          io.to(raidId).emit('raid:end', {
            status: 'defeat',
          });
          raids.delete(raidId);
        }
      }
    });

    // Create guild
    socket.on('guild:create', (data) => {
      const { name, creator } = data;
      const guildId = uuidv4();
      const guild = {
        id: guildId,
        name,
        creator,
        members: [creator],
        xp: 0,
      };
      guilds.set(guildId, guild);

      socket.emit('guild:created', guild);
      console.log(`✓ Guild created: ${name}`);
    });

    // Join guild
    socket.on('guild:join', (data) => {
      const { guildId, player } = data;
      const guild = guilds.get(guildId);

      if (guild && guild.members.length < 50) {
        guild.members.push(player);
        io.emit('guild:updated', { guild, event: 'member-joined' });
      }
    });

    // Get all raids
    socket.on('raids:list', () => {
      const raidsList = Array.from(raids.values()).map((raid) => ({
        id: raid.id,
        playerCount: raid.players.length,
        monsterHp: raid.monsterHp,
      }));
      socket.emit('raids:data', raidsList);
    });

    // Get all guilds
    socket.on('guilds:list', () => {
      const guildsList = Array.from(guilds.values()).map((guild) => ({
        id: guild.id,
        name: guild.name,
        memberCount: guild.members.length,
      }));
      socket.emit('guilds:data', guildsList);
    });

    // Disconnect
    socket.on('disconnect', () => {
      const player = players.get(socket.id);
      if (player) {
        console.log(`✗ Player disconnected: ${player.username}`);
        players.delete(socket.id);
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

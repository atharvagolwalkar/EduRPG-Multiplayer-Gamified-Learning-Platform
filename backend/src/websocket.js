// websocket.js – root namespace (/) for lobby, guilds, raids list
// The multiplayer raid game logic lives in multiplayer-websocket.js (/raids namespace)

import { v4 as uuidv4 } from 'uuid';
import { isMockFirebase, realtimeDb } from './store.js';

const mockRaids = new Map();
const mockGuilds = new Map();
const mockPlayers = new Map();

function createDefaultRaid(raidId) {
  return { id: raidId, players: [], monsterHp: 100, teamHp: 100, streak: 0, startTime: Date.now() };
}

export function setupWebSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[/] Player connected: ${socket.id}`);

    // ── Raid list ────────────────────────────────────────────────────────────
    socket.on('raids:list', async () => {
      if (isMockFirebase || !realtimeDb) {
        return socket.emit('raids:data', [...mockRaids.values()].map((r) => ({
          id: r.id, playerCount: r.players.length, monsterHp: r.monsterHp,
        })));
      }
      try {
        const snap = await realtimeDb.child('raids').once('value');
        const data = snap.val() || {};
        socket.emit('raids:data', Object.values(data).map((r) => ({
          id: r.id, playerCount: (r.players || []).length, monsterHp: r.monsterHp,
        })));
      } catch (err) { console.error('[raids:list]', err); }
    });

    // ── Guild create ─────────────────────────────────────────────────────────
    socket.on('guild:create', async ({ name, creator }) => {
      const guildId = uuidv4();
      const guild = { id: guildId, name, creator, members: [creator], xp: 0 };
      if (isMockFirebase || !realtimeDb) {
        mockGuilds.set(guildId, guild);
      } else {
        await realtimeDb.child('guilds').child(guildId).set(guild).catch(console.error);
      }
      socket.emit('guild:created', guild);
    });

    // ── Guild join ───────────────────────────────────────────────────────────
    socket.on('guild:join', async ({ guildId, player }) => {
      let guild = isMockFirebase || !realtimeDb
        ? mockGuilds.get(guildId)
        : (await realtimeDb.child('guilds').child(guildId).once('value').catch(() => null))?.val();

      if (guild && guild.members.length < 50) {
        guild.members.push(player);
        if (isMockFirebase || !realtimeDb) {
          mockGuilds.set(guildId, guild);
        } else {
          await realtimeDb.child('guilds').child(guildId).set(guild).catch(console.error);
        }
        io.emit('guild:updated', { guild, event: 'member-joined' });
      }
    });

    // ── Guild list ───────────────────────────────────────────────────────────
    socket.on('guilds:list', async () => {
      if (isMockFirebase || !realtimeDb) {
        return socket.emit('guilds:data', [...mockGuilds.values()].map((g) => ({
          id: g.id, name: g.name, memberCount: g.members.length,
        })));
      }
      try {
        const snap = await realtimeDb.child('guilds').once('value');
        const data = snap.val() || {};
        socket.emit('guilds:data', Object.values(data).map((g) => ({
          id: g.id, name: g.name, memberCount: (g.members || []).length,
        })));
      } catch (err) { console.error('[guilds:list]', err); }
    });

    socket.on('disconnect', () => {
      const player = mockPlayers.get(socket.id);
      if (player) { console.log(`[/] Player disconnected: ${player.username}`); mockPlayers.delete(socket.id); }
    });
  });
}
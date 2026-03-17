import { useCallback } from 'react';
import axios from 'axios';
import { useGameStore } from './store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type HeroClass = 'mage' | 'engineer' | 'scientist';

export interface UserPayload {
  username: string;
  email: string;
  heroClass: HeroClass;
}

export interface UserRecord {
  id: string;
  username: string;
  email?: string;
  level: number;
  xp: number;
  totalXp?: number;
  heroClass: HeroClass;
  guildId?: string | null;
  stats?: {
    wins: number;
    losses: number;
    raidsCompleted: number;
    monsterDefeated: number;
    totalDamageDealt: number;
  };
  progression?: {
    mastery: Record<string, Record<string, { attempts: number; correct: number; masteryScore: number }>>;
    unlockedSkills: string[];
    progressionHistory: Array<{
      type: string;
      subject: string;
      concept: string;
      correct: boolean;
      timestamp: string;
    }>;
  };
}

const normalizeUser = (user: UserRecord): UserRecord & { guildId?: string } => ({
  ...user,
  guildId: user.guildId ?? undefined,
});

export interface RaidPayload {
  raidId?: string;
  leaderId: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  monsterHp?: number;
  teamHp?: number;
  players?: Array<{ id: string; username?: string; guildId?: string }>;
  monsterName?: string;
}

export interface RaidRecord {
  id: string;
  players: Array<{ id: string; username?: string; guildId?: string }>;
  monsterName: string;
  monsterMaxHp: number;
  monsterHp: number;
  teamMaxHp: number;
  teamHp: number;
  endTime?: number | null;
  status: string;
  streak: number;
  playerProgress?: Record<string, { damageDealt: number; correctAnswers: number }>;
  correctAnswers?: number;
  questionsAnswered?: number;
}

export interface GuildPayload {
  name: string;
  description?: string;
  leaderId: string;
}

export interface GuildRecord {
  id: string;
  name: string;
  description?: string;
  leader: string;
  members: string[];
  memberCount: number;
  xp: number;
  level: number;
  rewards?: string[];
  achievements?: string[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  xp: number;
  level: number;
  guild?: string;
}

export const useUser = () => {
  const { user, setUser } = useGameStore();

  const createUser = useCallback(
    async (userData: UserPayload) => {
      const response = await axios.post<{ success: boolean; user: UserRecord }>(
        `${API_URL}/api/users/create`,
        userData
      );

      if (!response.data.success) {
        throw new Error('Unable to create user');
      }

      const normalizedUser = normalizeUser(response.data.user);
      setUser(normalizedUser);
      return normalizedUser;
    },
    [setUser]
  );

  const getUser = useCallback(async (userId: string) => {
    const response = await axios.get<{ success: boolean; user: UserRecord | null }>(
      `${API_URL}/api/users/${userId}`
    );

    if (!response.data.success) {
      throw new Error('Unable to fetch user');
    }

    return response.data.user ? normalizeUser(response.data.user) : response.data.user;
  }, []);

  const getUsers = useCallback(async () => {
    const response = await axios.get<{ success: boolean; users: UserRecord[] }>(
      `${API_URL}/api/users`
    );

    if (!response.data.success) {
      throw new Error('Unable to fetch users');
    }

    return response.data.users.map(normalizeUser);
  }, []);

  const addXP = useCallback(async (userId: string, amount: number) => {
    const response = await axios.post<{ success: boolean; result: { newLevel: number; newTotalXp: number } }>(
      `${API_URL}/api/users/${userId}/xp`,
      { amount }
    );

    if (!response.data.success) {
      throw new Error('Unable to add XP');
    }

    return response.data.result;
  }, []);

  return { user, createUser, getUser, getUsers, addXP };
};

export const useLeaderboard = () => {
  const fetchGlobal = useCallback(async (limit = 10) => {
    const response = await axios.get<{ success: boolean; leaderboard: LeaderboardEntry[] }>(
      `${API_URL}/api/leaderboard/global?limit=${limit}`
    );

    if (!response.data.success) {
      throw new Error('Unable to fetch global leaderboard');
    }

    return response.data.leaderboard;
  }, []);

  const fetchWeekly = useCallback(async (limit = 10) => {
    const response = await axios.get<{ success: boolean; leaderboard: LeaderboardEntry[] }>(
      `${API_URL}/api/leaderboard/weekly?limit=${limit}`
    );

    if (!response.data.success) {
      throw new Error('Unable to fetch weekly leaderboard');
    }

    return response.data.leaderboard;
  }, []);

  const fetchGuilds = useCallback(async (limit = 10) => {
    const response = await axios.get<{ success: boolean; leaderboard: GuildRecord[] }>(
      `${API_URL}/api/leaderboard/guilds?limit=${limit}`
    );

    if (!response.data.success) {
      throw new Error('Unable to fetch guild leaderboard');
    }

    return response.data.leaderboard;
  }, []);

  return { fetchGlobal, fetchWeekly, fetchGuilds };
};

export const useRaid = () => {
  const { raid, setRaid } = useGameStore();

  const startRaid = useCallback(
    async (raidData: RaidPayload) => {
      const response = await axios.post<{ success: boolean; raid: RaidRecord }>(
        `${API_URL}/api/raids/start`,
        raidData
      );

      if (!response.data.success) {
        throw new Error('Unable to start raid');
      }

      setRaid({
        raidId: response.data.raid.id,
        players: [],
        monsterHp: response.data.raid.monsterHp,
        playerHp: response.data.raid.teamHp,
        streak: response.data.raid.streak,
        timeRemaining: 300,
        isActive: true,
      });

      return response.data.raid;
    },
    [setRaid]
  );

  const getRaid = useCallback(async (raidId: string) => {
    const response = await axios.get<{ success: boolean; raid: RaidRecord | null }>(
      `${API_URL}/api/raids/${raidId}`
    );

    if (!response.data.success) {
      throw new Error('Unable to fetch raid');
    }

    return response.data.raid;
  }, []);

  const endRaid = useCallback(async (raidId: string, winnerId: string, xpReward: number) => {
    const response = await axios.post<{ success: boolean; raid: RaidRecord }>(
      `${API_URL}/api/raids/${raidId}/end`,
      { winnerId, xpReward }
    );

    if (!response.data.success) {
      throw new Error('Unable to end raid');
    }

    return response.data.raid;
  }, []);

  const getRaidHistory = useCallback(async (userId: string) => {
    const response = await axios.get<{ success: boolean; raids: RaidRecord[] }>(
      `${API_URL}/api/users/${userId}/raids`
    );

    if (!response.data.success) {
      throw new Error('Unable to fetch raid history');
    }

    return response.data.raids;
  }, []);

  return { raid, startRaid, getRaid, endRaid, getRaidHistory };
};

export const useGuild = () => {
  const createGuild = useCallback(async (guildData: GuildPayload) => {
    const response = await axios.post<{ success: boolean; guild: GuildRecord }>(
      `${API_URL}/api/guilds/create`,
      guildData
    );

    if (!response.data.success) {
      throw new Error('Unable to create guild');
    }

    return response.data.guild;
  }, []);

  const getGuildList = useCallback(async () => {
    const response = await axios.get<{ success: boolean; guilds: GuildRecord[] }>(
      `${API_URL}/api/guilds`
    );

    if (!response.data.success) {
      throw new Error('Unable to fetch guilds');
    }

    return response.data.guilds;
  }, []);

  const addMember = useCallback(async (guildId: string, userId: string) => {
    const response = await axios.post<{ success: boolean; guild: GuildRecord }>(
      `${API_URL}/api/guilds/${guildId}/members`,
      { userId }
    );

    if (!response.data.success) {
      throw new Error('Unable to add guild member');
    }

    return response.data.guild;
  }, []);

  return { createGuild, getGuildList, addMember };
};

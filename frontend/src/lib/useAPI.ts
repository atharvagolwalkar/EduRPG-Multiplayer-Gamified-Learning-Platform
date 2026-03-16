import { useEffect, useCallback } from 'react';
import axios from 'axios';
import { useGameStore } from './store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useUser = () => {
  const { user, setUser } = useGameStore();

  const createUser = useCallback(async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/api/users/create`, userData);
      if (response.data.success) {
        setUser(response.data.user);
        return response.data.user;
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }, [setUser]);

  const getUser = useCallback(async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/api/users/${userId}`);
      if (response.data.success) {
        return response.data.user;
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }, []);

  const addXP = useCallback(async (userId, amount) => {
    try {
      const response = await axios.post(`${API_URL}/api/users/${userId}/xp`, {
        amount,
      });
      if (response.data.success) {
        return response.data.result;
      }
    } catch (error) {
      console.error('Error adding XP:', error);
      throw error;
    }
  }, []);

  return { user, createUser, getUser, addXP };
};

export const useLeaderboard = () => {
  const fetchGlobal = useCallback(async (limit = 10) => {
    try {
      const response = await axios.get(`${API_URL}/api/leaderboard/global?limit=${limit}`);
      if (response.data.success) {
        return response.data.leaderboard;
      }
    } catch (error) {
      console.error('Error fetching global leaderboard:', error);
      throw error;
    }
  }, []);

  const fetchWeekly = useCallback(async (limit = 10) => {
    try {
      const response = await axios.get(`${API_URL}/api/leaderboard/weekly?limit=${limit}`);
      if (response.data.success) {
        return response.data.leaderboard;
      }
    } catch (error) {
      console.error('Error fetching weekly leaderboard:', error);
      throw error;
    }
  }, []);

  const fetchGuilds = useCallback(async (limit = 10) => {
    try {
      const response = await axios.get(`${API_URL}/api/leaderboard/guilds?limit=${limit}`);
      if (response.data.success) {
        return response.data.leaderboard;
      }
    } catch (error) {
      console.error('Error fetching guild leaderboard:', error);
      throw error;
    }
  }, []);

  return { fetchGlobal, fetchWeekly, fetchGuilds };
};

export const useRaid = () => {
  const { raid, setRaid } = useGameStore();

  const startRaid = useCallback(async (raidData) => {
    try {
      const response = await axios.post(`${API_URL}/api/raids/start`, raidData);
      if (response.data.success) {
        setRaid(response.data.raid);
        return response.data.raid;
      }
    } catch (error) {
      console.error('Error starting raid:', error);
      throw error;
    }
  }, [setRaid]);

  const getRaid = useCallback(async (raidId) => {
    try {
      const response = await axios.get(`${API_URL}/api/raids/${raidId}`);
      if (response.data.success) {
        return response.data.raid;
      }
    } catch (error) {
      console.error('Error fetching raid:', error);
      throw error;
    }
  }, []);

  const endRaid = useCallback(async (raidId, winnerId, xpReward) => {
    try {
      const response = await axios.post(`${API_URL}/api/raids/${raidId}/end`, {
        winnerId,
        xpReward,
      });
      if (response.data.success) {
        return response.data.raid;
      }
    } catch (error) {
      console.error('Error ending raid:', error);
      throw error;
    }
  }, []);

  return { raid, startRaid, getRaid, endRaid };
};

export const useGuild = () => {
  const createGuild = useCallback(async (guildData) => {
    try {
      const response = await axios.post(`${API_URL}/api/guilds/create`, guildData);
      if (response.data.success) {
        return response.data.guild;
      }
    } catch (error) {
      console.error('Error creating guild:', error);
      throw error;
    }
  }, []);

  const getGuildList = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/guilds`);
      if (response.data.success) {
        return response.data.guilds;
      }
    } catch (error) {
      console.error('Error fetching guilds:', error);
      throw error;
    }
  }, []);

  const addMember = useCallback(async (guildId, userId) => {
    try {
      const response = await axios.post(`${API_URL}/api/guilds/${guildId}/members`, {
        userId,
      });
      if (response.data.success) {
        return response.data.guild;
      }
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }, []);

  return { createGuild, getGuildList, addMember };
};

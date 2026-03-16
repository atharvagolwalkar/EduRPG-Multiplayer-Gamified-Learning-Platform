import { create } from 'zustand';

interface User {
  id: string;
  username: string;
  level: number;
  xp: number;
  totalXp?: number;
  heroClass: 'mage' | 'engineer' | 'scientist';
  guildId?: string;
  stats?: {
    wins: number;
    losses: number;
    raidsCompleted: number;
    monsterDefeated: number;
    totalDamageDealt: number;
  };
}

interface RaidState {
  raidId: string | null;
  players: User[];
  monsterHp: number;
  playerHp: number;
  streak: number;
  timeRemaining: number;
  isActive: boolean;
  playerProgress?: Record<string, { damageDealt: number; correctAnswers: number }>;
}

interface GameStore {
  user: User | null;
  setUser: (user: User) => void;
  raid: RaidState;
  setRaid: (raid: Partial<RaidState>) => void;
  updatePlayerHp: (hp: number) => void;
  updateMonsterHp: (hp: number) => void;
  incrementStreak: () => void;
  resetRaid: () => void;
}

const initialRaidState: RaidState = {
  raidId: null,
  players: [],
  monsterHp: 100,
  playerHp: 100,
  streak: 0,
  timeRemaining: 180, // 3 minutes
  isActive: false,
};

export const useGameStore = create<GameStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  
  raid: initialRaidState,
  setRaid: (raidUpdate) =>
    set((state) => ({
      raid: { ...state.raid, ...raidUpdate },
    })),

  updatePlayerHp: (hp) =>
    set((state) => ({
      raid: { ...state.raid, playerHp: Math.max(0, hp) },
    })),

  updateMonsterHp: (hp) =>
    set((state) => ({
      raid: { ...state.raid, monsterHp: Math.max(0, hp) },
    })),

  incrementStreak: () =>
    set((state) => ({
      raid: { ...state.raid, streak: state.raid.streak + 1 },
    })),

  resetRaid: () =>
    set(() => ({
      raid: initialRaidState,
    })),
}));

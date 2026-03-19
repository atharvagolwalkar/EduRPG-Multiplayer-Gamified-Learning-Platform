import { create } from 'zustand';

export type HeroClass = 'mage' | 'engineer' | 'scientist';

export interface AppUser {
  id: string;
  username: string;
  heroClass: HeroClass;
  level: number;
  xp: number;
  totalXp: number;
  guildId: string | null;
  stats: { wins: number; losses: number; raidsCompleted: number; totalDamageDealt: number };
}

interface GameStore {
  user: AppUser | null;
  setUser: (u: AppUser | null) => void;
  updateUser: (u: Partial<AppUser>) => void;
  logout: () => void;
  loadPersistedUser: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  user: null,

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      user ? localStorage.setItem('edurpg_user', JSON.stringify(user))
           : localStorage.removeItem('edurpg_user');
    }
    set({ user });
  },

  updateUser: (updates) =>
    set((s) => {
      if (!s.user) return s;
      const updated = { ...s.user, ...updates };
      if (typeof window !== 'undefined') localStorage.setItem('edurpg_user', JSON.stringify(updated));
      return { user: updated };
    }),

  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('edurpg_user');
    set({ user: null });
  },

  loadPersistedUser: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('edurpg_user');
      if (raw) set({ user: JSON.parse(raw) });
    } catch { localStorage.removeItem('edurpg_user'); }
  },
}));
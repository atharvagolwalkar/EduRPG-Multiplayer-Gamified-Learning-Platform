import { create } from 'zustand';

export type HeroClass = 'mage' | 'engineer' | 'scientist';

export interface AppUser {
  streak: number;
  trophies: number;
  id: string;
  username: string;
  email?: string;
  heroClass: HeroClass;
  hero_class?: string;
  level: number;
  xp: number;
  totalXp: number;
  guildId: string | null;
  stats: { wins: number; losses: number; raidsCompleted: number; totalDamageDealt: number };
}

interface GameStore {
  user: AppUser | null;
  token: string | null;
  setUser:  (u: AppUser | null) => void;
  setToken: (t: string | null)  => void;
  updateUser: (u: Partial<AppUser>) => void;
  logout: () => void;
  loadPersistedUser: () => void;
}

const save = (user: AppUser | null, token: string | null) => {
  if (typeof window === 'undefined') return;
  user  ? localStorage.setItem('edurpg_user',  JSON.stringify(user))  : localStorage.removeItem('edurpg_user');
  token ? localStorage.setItem('edurpg_token', token)                 : localStorage.removeItem('edurpg_token');
};

export const useGameStore = create<GameStore>((set, get) => ({
  user:  null,
  token: null,

  setUser: (user) => { save(user, get().token); set({ user }); },

  setToken: (token) => { save(get().user, token); set({ token }); },

  updateUser: (updates) =>
    set((s) => {
      if (!s.user) return s;
      const updated = { ...s.user, ...updates };
      save(updated, s.token);
      return { user: updated };
    }),

  logout: () => {
    save(null, null);
    set({ user: null, token: null });
  },

  loadPersistedUser: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw   = localStorage.getItem('edurpg_user');
      const token = localStorage.getItem('edurpg_token');
      if (raw) set({ user: JSON.parse(raw), token: token || null });
    } catch { localStorage.removeItem('edurpg_user'); }
  },
}));

// Alias so both useStore and useGameStore work across all files
export const useStore = useGameStore;
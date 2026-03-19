export const HERO_STATS = {
  mage:      { icon: '🔮', subject: 'Mathematics', attack: 30, maxHp: 90,  color: 'from-violet-500 to-purple-600', accent: 'violet' },
  engineer:  { icon: '⚙️',  subject: 'Programming', attack: 25, maxHp: 110, color: 'from-cyan-500 to-blue-600',   accent: 'cyan'   },
  scientist: { icon: '🧪', subject: 'Physics',      attack: 22, maxHp: 100, color: 'from-emerald-500 to-teal-600', accent: 'emerald' },
} as const;

export function calcDamage(heroClass: keyof typeof HERO_STATS, streak: number): number {
  const base = HERO_STATS[heroClass].attack;
  const mult = 1 + Math.min(streak * 0.1, 2);
  return Math.floor(base * mult) + (streak >= 3 ? 5 : 0);
}

export function xpForLevel(level: number) { return level * level * 100; }
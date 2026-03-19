export type HeroClass = 'mage' | 'engineer' | 'scientist' | 'warrior' | 'archer' | 'alchemist';

export const HERO_STATS: Record<HeroClass, {
  icon: string; name: string; subject: string; desc: string;
  color: string; border: string; attack: number; maxHp: number; special: string;
}> = {
  mage: {
    icon: '🔮', name: 'Mage', subject: 'mathematics',
    desc: 'Master of numbers. High spell power, fragile defense.',
    color: 'from-violet-600 to-purple-800', border: 'border-violet-400',
    attack: 30, maxHp: 90, special: 'Arcane Burst — doubles damage at streak 5+',
  },
  engineer: {
    icon: '⚙️', name: 'Engineer', subject: 'programming',
    desc: 'Code warrior. Tank build with algorithm expertise.',
    color: 'from-cyan-600 to-blue-800', border: 'border-cyan-400',
    attack: 25, maxHp: 120, special: 'Debug Shield — blocks 1 wrong answer per raid',
  },
  scientist: {
    icon: '🧪', name: 'Scientist', subject: 'physics',
    desc: 'Balanced physicist. Commands waves and energy.',
    color: 'from-emerald-600 to-teal-800', border: 'border-emerald-400',
    attack: 22, maxHp: 100, special: 'Experiment — reveals one wrong answer option',
  },
  warrior: {
    icon: '⚔️', name: 'Warrior', subject: 'general',
    desc: 'All-rounder fighter. High HP, steady damage.',
    color: 'from-orange-600 to-red-800', border: 'border-orange-400',
    attack: 20, maxHp: 140, special: 'Battle Cry — team gets +10 HP on correct answer',
  },
  archer: {
    icon: '🏹', name: 'Archer', subject: 'mathematics',
    desc: 'Precision striker. Crits deal massive damage.',
    color: 'from-green-600 to-lime-800', border: 'border-green-400',
    attack: 28, maxHp: 85, special: 'Bullseye — 25% crit chance, 2× damage',
  },
  alchemist: {
    icon: '⚗️', name: 'Alchemist', subject: 'physics',
    desc: 'Support specialist. Heals team on correct answers.',
    color: 'from-pink-600 to-rose-800', border: 'border-pink-400',
    attack: 18, maxHp: 95, special: 'Brew — correct answer heals team for 5 HP',
  },
};

export const BOSSES = [
  { id: 'calculus_titan',    name: 'Calculus Titan',    icon: '🧮', hp: 100, subject: 'mathematics', desc: 'Ancient guardian of derivatives and integrals.',      color: 'from-violet-900 to-purple-950' },
  { id: 'code_demon',        name: 'Code Demon',        icon: '👾', hp: 120, subject: 'programming', desc: 'Corrupted AI that spawns infinite loops.',             color: 'from-cyan-900 to-blue-950'   },
  { id: 'physics_phantom',   name: 'Physics Phantom',   icon: '👻', hp: 90,  subject: 'physics',     desc: 'Spectral entity that bends the laws of motion.',      color: 'from-emerald-900 to-teal-950' },
  { id: 'logic_dragon',      name: 'Logic Dragon',      icon: '🐉', hp: 150, subject: 'general',     desc: 'Ancient wyrm that breathes logical paradoxes.',       color: 'from-orange-900 to-red-950'  },
  { id: 'algebra_hydra',     name: 'Algebra Hydra',     icon: '🐍', hp: 130, subject: 'mathematics', desc: 'Multi-headed beast — defeat one equation, two appear.', color: 'from-green-900 to-lime-950'  },
];

export const ACHIEVEMENTS: Record<string, { icon: string; name: string; desc: string; condition: (stats: any) => boolean }> = {
  first_blood:   { icon: '🗡️',  name: 'First Blood',    desc: 'Deal your first damage',         condition: s => s.totalDamage >= 1      },
  combo_king:    { icon: '🔥',  name: 'Combo King',     desc: 'Reach a 5× streak',              condition: s => s.maxStreak >= 5        },
  perfectionist: { icon: '⭐',  name: 'Perfectionist',  desc: 'Win with 100% accuracy',         condition: s => s.accuracy === 100      },
  speed_demon:   { icon: '⚡',  name: 'Speed Demon',    desc: 'Win raid with 60+ seconds left', condition: s => s.timeLeft >= 60        },
  dragon_slayer: { icon: '🏆',  name: 'Dragon Slayer',  desc: 'Defeat 3 different bosses',      condition: s => s.uniqueBosses >= 3     },
  scholar:       { icon: '📚',  name: 'Scholar',        desc: 'Answer 20 questions correctly',  condition: s => s.totalCorrect >= 20    },
  team_player:   { icon: '🤝',  name: 'Team Player',    desc: 'Win a raid with 3+ players',     condition: s => s.teamSize >= 3         },
  unstoppable:   { icon: '💪',  name: 'Unstoppable',    desc: 'Win 5 raids',                    condition: s => s.totalWins >= 5        },
};

export function calcDamage(heroClass: HeroClass, streak: number, isCrit = false): number {
  const base = HERO_STATS[heroClass]?.attack || 25;
  const mult = 1 + Math.min(streak * 0.1, 2);
  let dmg = Math.floor(base * mult) + (streak >= 3 ? 5 : 0);
  if (isCrit || (heroClass === 'archer' && Math.random() < 0.25)) dmg *= 2;
  return dmg;
}

export function xpForLevel(level: number) { return level * level * 100; }

export function checkAchievements(stats: any): string[] {
  return Object.entries(ACHIEVEMENTS)
    .filter(([, a]) => { try { return a.condition(stats); } catch { return false; } })
    .map(([id]) => id);
}
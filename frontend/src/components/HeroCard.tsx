import React, { useState } from 'react';

interface HeroCardProps {
  name: string;
  class: 'mage' | 'engineer' | 'scientist';
  stats: { attackPower: number; defense: number; maxHp: number; skill: string };
  selected: boolean;
  onSelect: () => void;
}

const HERO_STYLES = {
  mage: {
    icon: '🔮',
    accent: 'from-fuchsia-500 via-violet-500 to-indigo-700',
    ring: 'shadow-[0_0_40px_rgba(168,85,247,0.32)]',
    stat: 'text-fuchsia-200',
    badge: 'Arcane burst',
  },
  engineer: {
    icon: '⚙️',
    accent: 'from-cyan-400 via-sky-500 to-blue-700',
    ring: 'shadow-[0_0_40px_rgba(34,211,238,0.28)]',
    stat: 'text-cyan-100',
    badge: 'Shield control',
  },
  scientist: {
    icon: '🧪',
    accent: 'from-emerald-400 via-teal-500 to-green-700',
    ring: 'shadow-[0_0_40px_rgba(16,185,129,0.28)]',
    stat: 'text-emerald-100',
    badge: 'Precision scan',
  },
} as const;

export const HeroCard: React.FC<HeroCardProps> = ({
  name,
  class: heroClass,
  stats,
  selected,
  onSelect,
}) => {
  const [hovered, setHovered] = useState(false);
  const style = HERO_STYLES[heroClass];

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`mesh-card panel group w-full rounded-[28px] p-6 text-left transition duration-500 ${
        selected
          ? `-translate-y-1 border-amber-300/50 ${style.ring}`
          : hovered
            ? '-translate-y-1 border-white/20'
            : 'border-white/10'
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 rounded-full bg-gradient-to-r ${style.accent}`} />
      <div className="relative z-10 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="section-label mb-3">{name} path</p>
            <h3 className="text-3xl font-black tracking-tight text-white">{name}</h3>
            <p className="mt-2 text-sm text-slate-300">{style.badge}</p>
          </div>
          <div className={`rounded-3xl bg-gradient-to-br ${style.accent} p-4 text-4xl shadow-2xl transition duration-500 ${hovered || selected ? 'scale-110 rotate-3' : ''}`}>
            {style.icon}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-slate-400">Attack</p>
            <p className={`mt-1 text-2xl font-bold ${style.stat}`}>{stats.attackPower}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-slate-400">Defense</p>
            <p className={`mt-1 text-2xl font-bold ${style.stat}`}>{stats.defense}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-slate-400">Health</p>
            <p className={`mt-1 text-2xl font-bold ${style.stat}`}>{stats.maxHp}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-slate-400">Skill</p>
            <p className={`mt-1 text-base font-semibold ${style.stat}`}>{stats.skill}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-300">
            {heroClass}
          </span>
          <span className={`text-sm font-semibold ${selected ? 'text-amber-300' : 'text-slate-400 group-hover:text-white'}`}>
            {selected ? 'Selected' : 'Choose class'}
          </span>
        </div>
      </div>
    </button>
  );
};

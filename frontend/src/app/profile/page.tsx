'use client';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { HERO_STATS, ACHIEVEMENTS, type HeroClass } from '@/lib/game';

const SKILL_TREES: Record<string, { name: string; icon: string; desc: string; req: number }[]> = {
  mage:      [{name:'Arithmetic',    icon:'➕', desc:'Basic operations',    req:1},{name:'Algebra',      icon:'🔣', desc:'Equations',         req:2},{name:'Geometry',    icon:'📐', desc:'Shapes & proofs',   req:3},{name:'Calculus',     icon:'📈', desc:'Derivatives',       req:5},{name:'Linear Algebra',icon:'🔢', desc:'Matrices',          req:7}],
  engineer:  [{name:'JS Basics',     icon:'📝', desc:'Variables & loops',   req:1},{name:'Data Structs', icon:'🗂️', desc:'Arrays & stacks',   req:2},{name:'Async JS',    icon:'⚡', desc:'Promises',          req:3},{name:'Algorithms',   icon:'🧮', desc:'Sort & search',     req:5},{name:'System Design', icon:'🏗️', desc:'Architecture',      req:7}],
  scientist: [{name:'Mechanics',     icon:'⚙️', desc:'Forces & motion',    req:1},{name:'Energy',       icon:'⚡', desc:'Work & KE',          req:2},{name:'Waves',       icon:'〰️', desc:'Frequency',         req:3},{name:'Electricity',  icon:'🔌', desc:"Ohm's law",         req:5},{name:'Quantum',      icon:'⚛️', desc:'Modern physics',    req:7}],
  warrior:   [{name:'Endurance',     icon:'💪', desc:'Boost max HP',        req:1},{name:'Strategy',    icon:'♟️', desc:'Lower wrong penalty',req:2},{name:'War Cry',     icon:'📣', desc:'Team HP boost',      req:3},{name:'Fortitude',    icon:'🛡️', desc:'Block one miss',    req:5},{name:'Warlord',      icon:'👑', desc:'Lead guild raids',   req:7}],
  archer:    [{name:'Aim',           icon:'🎯', desc:'Crit chance',         req:1},{name:'Quiver',      icon:'🏹', desc:'More questions',     req:2},{name:'Eagle Eye',   icon:'🦅', desc:'See hints',          req:3},{name:'Bullseye',    icon:'🎯', desc:'2× crit damage',    req:5},{name:'Marksman',     icon:'⭐', desc:'Never miss twice',  req:7}],
  alchemist: [{name:'Brewing',       icon:'⚗️', desc:'Heal on correct',    req:1},{name:'Elixir',      icon:'🧪', desc:'Team heal boost',    req:2},{name:'Transmute',   icon:'✨', desc:'Convert XP bonus',   req:3},{name:'Potion Master',icon:'💊', desc:'Revive teammate',    req:5},{name:'Philosopher Stone',icon:'💎',desc:'Max XP multiplier', req:7}],
};

const MOCK_ACHIEVEMENTS = ['first_blood', 'combo_king', 'scholar'];

export default function ProfilePage() {
  const { user } = useStore();

  if (!user) return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400 mb-4">Create a hero first</p>
        <Link href="/" className="bg-white/10 px-5 py-3 rounded-xl font-semibold hover:bg-white/15">← Home</Link>
      </div>
    </main>
  );

  const h      = HERO_STATS[user.heroClass as HeroClass] || HERO_STATS.mage;
  const skills = SKILL_TREES[user.heroClass] || SKILL_TREES.mage;
  const level  = user.level || 1;
  const xp     = user.xp   || 0;
  const xpNeeded = level * level * 100;
  const xpPrev   = (level - 1) * (level - 1) * 100;
  const pct      = Math.min(100, ((xp - xpPrev) / (xpNeeded - xpPrev)) * 100);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm transition">← Back</Link>
        <h1 className="text-2xl font-black">🧬 Command Deck</h1>
      </div>

      {/* Hero banner */}
      <div className={`rounded-2xl bg-gradient-to-br ${h.color} p-6 mb-5 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative flex items-center gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-5xl border border-white/20">{h.icon}</div>
          <div className="flex-1">
            <p className="text-white/60 text-xs uppercase tracking-widest">Active Hero</p>
            <h2 className="text-3xl font-black text-white">{user.username}</h2>
            <p className="text-white/70 capitalize">{h.name} · Level {level} · {h.subject}</p>
            <p className="text-white/40 text-xs mt-0.5">{h.special}</p>
          </div>
          <div className="w-full md:w-56">
            <div className="flex justify-between text-xs text-white/60 mb-1"><span>Level {level}</span><span>{xp}/{xpNeeded} XP</span></div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          ['⚔️ Wins',   user.stats?.wins            || 0, 'text-emerald-400'],
          ['💀 Losses', user.stats?.losses           || 0, 'text-red-400'   ],
          ['📚 Raids',  user.stats?.raidsCompleted   || 0, 'text-cyan-400'  ],
          ['💥 Damage', user.stats?.totalDamageDealt || 0, 'text-amber-400' ],
        ].map(([k, v, c]) => (
          <div key={k as string} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className={`text-2xl font-black ${c}`}>{v}</p>
            <p className="text-xs text-gray-600 mt-1">{k}</p>
          </div>
        ))}
      </div>

      {/* Skill tree */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5">
        <p className="font-bold text-sm text-gray-300 mb-5">Skill Tree — {h.name}</p>
        <div className="flex items-start gap-1 overflow-x-auto pb-3">
          {skills.map((skill, i) => {
            const unlocked = level >= skill.req;
            const isNext   = level < skill.req && (i === 0 || level >= skills[i-1].req);
            return (
              <div key={i} className="flex items-center gap-1 flex-shrink-0">
                <div className="flex flex-col items-center gap-1.5 w-20">
                  <div className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center transition-all ${
                    unlocked ? 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.3)]' :
                    isNext   ? 'border-amber-400/50 bg-amber-400/5 border-dashed' :
                               'border-gray-700 bg-gray-800 opacity-40'}`}>
                    <span className="text-lg">{unlocked ? skill.icon : '🔒'}</span>
                  </div>
                  <p className={`text-center text-[11px] font-bold leading-tight ${unlocked ? 'text-white' : 'text-gray-600'}`}>{skill.name}</p>
                  <p className={`text-center text-[9px] ${unlocked ? 'text-gray-400' : 'text-gray-700'}`}>Lv {skill.req}</p>
                </div>
                {i < skills.length - 1 && (
                  <div className={`h-0.5 w-5 flex-shrink-0 mb-7 ${unlocked && level >= skills[i+1]?.req ? 'bg-cyan-400' : 'bg-gray-700'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <p className="font-bold text-sm text-gray-300 mb-4">Achievements</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(ACHIEVEMENTS).map(([id, a]) => {
            const earned = MOCK_ACHIEVEMENTS.includes(id) || (id === 'first_blood' && (user.stats?.totalDamageDealt || 0) > 0);
            return (
              <div key={id} className={`rounded-xl p-3 border text-center transition ${earned ? 'border-amber-400/40 bg-amber-400/10' : 'border-gray-800 bg-gray-800/50 opacity-50'}`}>
                <div className="text-2xl mb-1">{a.icon}</div>
                <p className={`text-xs font-bold ${earned ? 'text-white' : 'text-gray-600'}`}>{a.name}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{a.desc}</p>
                {earned && <p className="text-[10px] text-amber-400 mt-1">✓ Earned</p>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <Link href="/raid" className="bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-3 rounded-xl font-black text-sm uppercase tracking-wide hover:scale-[1.01] transition shadow-lg">⚔️ New Raid</Link>
        <Link href="/guild" className="bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-xl font-bold text-sm transition">🏛️ Guild Hall</Link>
      </div>
    </main>
  );
}
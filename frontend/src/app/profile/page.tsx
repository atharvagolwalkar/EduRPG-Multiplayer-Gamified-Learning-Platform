'use client';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { HERO_STATS, xpForLevel } from '@/lib/game';

const SKILL_TREES: Record<string, { name: string; desc: string; requiredLevel: number }[]> = {
  mage:      [{ name:'Arithmetic', desc:'Basic ops', requiredLevel:1 },{ name:'Algebra', desc:'Equations', requiredLevel:2 },{ name:'Geometry', desc:'Shapes', requiredLevel:3 },{ name:'Calculus', desc:'Derivatives', requiredLevel:5 },{ name:'Linear Algebra', desc:'Matrices', requiredLevel:7 }],
  engineer:  [{ name:'JS Basics', desc:'Variables & loops', requiredLevel:1 },{ name:'Data Structures', desc:'Arrays & stacks', requiredLevel:2 },{ name:'Async JS', desc:'Promises', requiredLevel:3 },{ name:'Algorithms', desc:'Sort & search', requiredLevel:5 },{ name:'System Design', desc:'Architecture', requiredLevel:7 }],
  scientist: [{ name:'Mechanics', desc:'Forces', requiredLevel:1 },{ name:'Energy', desc:'Work & KE', requiredLevel:2 },{ name:'Waves', desc:'Frequency', requiredLevel:3 },{ name:'Electricity', desc:"Ohm's law", requiredLevel:5 },{ name:'Quantum', desc:'Modern physics', requiredLevel:7 }],
};

export default function ProfilePage() {
  const { user } = useStore();
  if (!user) return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center"><p className="text-gray-400 mb-4">Create a hero first</p>
        <Link href="/" className="bg-white/10 px-5 py-3 rounded-xl font-semibold hover:bg-white/15">← Home</Link></div>
    </main>
  );

  const s = HERO_STATS[user.heroClass];
  const skills = SKILL_TREES[user.heroClass] || [];
  const xpNeeded = xpForLevel(user.level);
  const xpPrev   = xpForLevel(user.level - 1);
  const pct      = Math.min(100, ((user.xp - xpPrev) / (xpNeeded - xpPrev)) * 100);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="bg-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/15">← Back</Link>
        <h1 className="text-2xl font-black">🧬 Command Deck</h1>
      </div>

      {/* Hero card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-5 mb-4">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-4xl`}>{s.icon}</div>
          <div>
            <p className="text-gray-400 text-sm">Active Hero</p>
            <h2 className="text-3xl font-black">{user.username}</h2>
            <p className="text-gray-400 capitalize">{user.heroClass} · Level {user.level} · {s.subject}</p>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Level {user.level}</span><span>{user.xp} / {xpNeeded} XP</span></div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[['Wins', user.stats?.wins||0], ['Losses', user.stats?.losses||0], ['Raids', user.stats?.raidsCompleted||0], ['Damage', user.stats?.totalDamageDealt||0]].map(([k,v]) => (
          <div key={k} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-black">{v}</p><p className="text-xs text-gray-500 mt-1">{k}</p>
          </div>
        ))}
      </div>

      {/* Skill tree */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <p className="text-gray-400 text-sm mb-5">Skill Tree — {user.heroClass}</p>
        <div className="flex items-start gap-2 overflow-x-auto pb-2">
          {skills.map((skill, i) => {
            const unlocked = user.level >= skill.requiredLevel;
            return (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <div className="flex flex-col items-center gap-1 w-20">
                  <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl transition-all ${unlocked ? 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_12px_rgba(34,211,238,0.3)]' : 'border-gray-700 bg-gray-800 opacity-40'}`}>
                    {unlocked ? '✨' : '🔒'}
                  </div>
                  <p className={`text-center text-xs font-bold leading-tight ${unlocked ? 'text-white' : 'text-gray-600'}`}>{skill.name}</p>
                  <p className={`text-center text-[10px] ${unlocked ? 'text-gray-400' : 'text-gray-700'}`}>Lv {skill.requiredLevel}</p>
                </div>
                {i < skills.length - 1 && <div className={`h-0.5 w-6 flex-shrink-0 mt-[-20px] ${unlocked && user.level >= skills[i+1].requiredLevel ? 'bg-cyan-400' : 'bg-gray-700 border-dashed'}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <Link href="/raid" className="bg-gradient-to-r from-rose-500 to-orange-400 px-5 py-3 rounded-xl font-black text-sm uppercase tracking-wide hover:scale-[1.02] transition">⚔️ New Raid</Link>
        <Link href="/guild" className="bg-white/10 px-5 py-3 rounded-xl font-bold text-sm hover:bg-white/15">🏛️ Guild Hall</Link>
      </div>
    </main>
  );
}
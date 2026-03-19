'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';

const HERO_ICON: Record<string,string> = { mage:'🔮', engineer:'⚙️', scientist:'🧪' };
const MEDALS = ['🥇','🥈','🥉'];

export default function LeaderboardPage() {
  const { user } = useStore();
  const [tab, setTab]   = useState<'global'|'weekly'|'guilds'>('global');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getLeaderboard(tab).then(d => setData(d.leaderboard||[])).catch(()=>setData([])).finally(()=>setLoading(false));
  }, [tab]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="glass px-4 py-2 rounded-xl text-sm hover:bg-white/10">← Back</Link>
        <h1 className="text-2xl font-black">🏆 Rankings</h1>
      </div>

      <div className="flex gap-2 mb-5">
        {(['global','weekly','guilds'] as const).map(t => (
          <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition ${tab===t?'bg-amber-400 text-black':'glass text-slate-300 hover:bg-white/10'}`}>{t}</button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {loading
          ? <p className="text-center text-slate-600 py-12">Loading...</p>
          : data.length === 0
          ? <p className="text-center text-slate-600 py-12">No data yet — complete a raid to appear here!</p>
          : data.map((e, i) => {
            const isYou = user && (e.id === user.id);
            const name  = e.username || e.name || `#${i+1}`;
            const score = e.total_xp || e.xp || 0;
            const icon  = tab==='guilds' ? '🏛️' : (HERO_ICON[e.hero_class||e.heroClass||''] || '⚔️');
            return (
              <div key={e.id||i} className={`flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-0 ${isYou?'bg-cyan-500/10':''}`}>
                <div className="w-8 text-center">{i<3?<span className="text-xl">{MEDALS[i]}</span>:<span className="text-slate-600 font-bold text-sm">#{i+1}</span>}</div>
                <span className="text-xl">{icon}</span>
                <div className="flex-1">
                  <p className="font-bold">{name}{isYou&&<span className="text-cyan-400 text-xs ml-2">(you)</span>}</p>
                  <p className="text-xs text-slate-600 capitalize">{tab==='guilds'?`${e.member_count||0} members`:`Level ${e.level||1} · ${e.hero_class||e.heroClass||'hero'} · ${e.wins||0} wins`}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber-300 font-black">{(score).toLocaleString()}</p>
                  <p className="text-xs text-slate-600">XP</p>
                </div>
              </div>
            );
          })}
      </div>
      <div className="mt-5">
        <Link href="/raid" className="bg-gradient-to-r from-rose-500 to-orange-400 px-5 py-3 rounded-xl font-black text-sm uppercase tracking-wide hover:scale-[1.01] transition inline-block">⚔️ Earn XP Now</Link>
      </div>
    </main>
  );
}
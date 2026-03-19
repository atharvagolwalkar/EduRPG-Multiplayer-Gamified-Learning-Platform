'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/lib/store';
import { api } from '@/lib/api';
import { HERO_STATS } from '@/lib/game';

type Tab = 'global' | 'guilds' | 'weekly';

export default function LeaderboardPage() {
  const { user }  = useGameStore();
  const [tab, setTab]     = useState<Tab>('global');
  const [data, setData]   = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getLeaderboard(tab).then(d => setData(d.leaderboard || [])).catch(() => setData([])).finally(() => setLoading(false));
  }, [tab]);

  const medals = ['🥇','🥈','🥉'];

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="bg-white/10 px-4 py-2 rounded-lg text-sm hover:bg-white/15">← Back</Link>
        <h1 className="text-2xl font-black">🏆 Rankings</h1>
      </div>

      <div className="flex gap-2 mb-5">
        {(['global','weekly','guilds'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition ${tab === t ? 'bg-amber-400 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>{t}</button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? <p className="text-center text-gray-500 py-12">Loading...</p>
        : data.length === 0 ? <p className="text-center text-gray-600 py-12">No data yet — complete a raid!</p>
        : data.map((entry, i) => {
          const isYou = user && (entry.id === user.id || entry.username === user.username);
          const icon  = tab === 'guilds' ? '🏛️' : HERO_STATS[entry.heroClass as keyof typeof HERO_STATS]?.icon || '⚔️';
          const name  = entry.username || entry.name || `#${i+1}`;
          const score = tab === 'guilds' ? entry.xp : (entry.totalXp || entry.xp || 0);
          return (
            <div key={entry.id || i} className={`flex items-center gap-4 px-5 py-4 border-b border-gray-800 last:border-0 ${isYou ? 'bg-cyan-500/10' : ''}`}>
              <div className="w-8 text-center">{i < 3 ? <span className="text-xl">{medals[i]}</span> : <span className="text-gray-600 font-bold">#{i+1}</span>}</div>
              <div className="text-xl">{icon}</div>
              <div className="flex-1">
                <p className="font-bold">{name}{isYou ? <span className="text-cyan-400 text-xs ml-2">(you)</span> : null}</p>
                <p className="text-xs text-gray-500 capitalize">{tab === 'guilds' ? `${entry.memberCount || 0} members` : `Level ${entry.level||1} · ${entry.heroClass||'hero'}`}</p>
              </div>
              <div className="text-right">
                <p className="text-amber-300 font-black">{(score||0).toLocaleString()}</p>
                <p className="text-xs text-gray-600">XP</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <Link href="/raid" className="bg-gradient-to-r from-rose-500 to-orange-400 px-5 py-3 rounded-xl font-black text-sm uppercase tracking-wide hover:scale-[1.02] transition inline-block">⚔️ Earn XP</Link>
      </div>
    </main>
  );
}
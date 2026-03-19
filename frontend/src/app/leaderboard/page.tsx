'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { HERO_STATS, type HeroClass } from '@/lib/game';

type Tab = 'global' | 'guilds' | 'weekly';

const LEAGUES = [
  { name: 'Legend',  icon: '👑', min: 3000, color: 'text-yellow-300 bg-yellow-300/10 border-yellow-300/30' },
  { name: 'Diamond', icon: '💎', min: 2000, color: 'text-cyan-300 bg-cyan-300/10 border-cyan-300/30'       },
  { name: 'Gold',    icon: '🥇', min: 1000, color: 'text-amber-400 bg-amber-400/10 border-amber-400/30'    },
  { name: 'Silver',  icon: '🥈', min: 500,  color: 'text-gray-300 bg-gray-300/10 border-gray-300/30'       },
  { name: 'Bronze',  icon: '🥉', min: 0,    color: 'text-orange-400 bg-orange-400/10 border-orange-400/30' },
];

function getLeague(trophies = 0) {
  return LEAGUES.find(l => trophies >= l.min) || LEAGUES[4];
}

export default function LeaderboardPage() {
  const { user }  = useStore();
  const [tab, setTab]     = useState<Tab>('global');
  const [data, setData]   = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getLeaderboard(tab).then(d => setData(d.leaderboard || [])).catch(() => setData([])).finally(() => setLoading(false));
  }, [tab]);

  const medals = ['🥇', '🥈', '🥉'];
  const myLeague = getLeague(user?.trophies || 100);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm transition">← Back</Link>
        <h1 className="text-2xl font-black">🏆 Rankings</h1>
      </div>

      {/* Your league card */}
      {user && (
        <div className={`rounded-2xl border p-5 mb-6 ${myLeague.color}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-70 mb-1 uppercase tracking-wider">Your League</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{myLeague.icon}</span>
                <div>
                  <p className="text-2xl font-black">{myLeague.name}</p>
                  <p className="text-sm opacity-70">{user.trophies || 100} trophies</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              {LEAGUES.slice(0, -1).map(l => {
                const isNext = myLeague.name !== l.name && (user?.trophies || 0) < l.min;
                const isCurrent = myLeague.name === l.name;
                return (
                  <div key={l.name} className={`text-xs mb-1 ${isCurrent ? 'opacity-100 font-bold' : 'opacity-40'}`}>
                    {l.icon} {l.name} ({l.min}+)
                  </div>
                );
              })}
            </div>
          </div>
          {/* Progress to next league */}
          {myLeague.name !== 'Legend' && (() => {
            const nextLeague = LEAGUES[LEAGUES.findIndex(l => l.name === myLeague.name) - 1];
            const progress   = ((user?.trophies || 0) - myLeague.min) / (nextLeague.min - myLeague.min) * 100;
            return (
              <div className="mt-3">
                <div className="flex justify-between text-xs opacity-70 mb-1">
                  <span>Progress to {nextLeague.name}</span>
                  <span>{user?.trophies || 0} / {nextLeague.min}</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white/60 rounded-full transition-all" style={{ width: `${Math.min(100, progress)}%` }} />
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* League thresholds */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {LEAGUES.map(l => (
          <div key={l.name} className={`rounded-xl border p-2.5 text-center ${user && getLeague(user.trophies || 100).name === l.name ? l.color : 'bg-gray-900 border-gray-800 opacity-50'}`}>
            <div className="text-xl mb-0.5">{l.icon}</div>
            <p className="text-xs font-bold">{l.name}</p>
            <p className="text-[10px] opacity-60">{l.min}+</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['global', 'weekly', 'guilds'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold capitalize transition ${tab === t ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-black shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {t === 'global' ? '🌍 Global' : t === 'weekly' ? '📅 Weekly' : '🏛️ Guilds'}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-500 py-12 animate-pulse">Loading rankings...</p>
        ) : data.length === 0 ? (
          <p className="text-center text-gray-600 py-12">No data yet — complete a raid to appear here!</p>
        ) : data.map((entry, i) => {
          const isYou    = user && (entry.id === user.id || entry.username === user.username);
          const icon     = tab === 'guilds' ? '🏛️' : HERO_STATS[entry.heroClass as HeroClass]?.icon || '⚔️';
          const name     = entry.username || entry.name || `Player ${i + 1}`;
          const score    = tab === 'guilds' ? entry.xp : (entry.totalXp || entry.xp || 0);
          const trophies = entry.trophies || 100;
          const league   = getLeague(trophies);

          return (
            <div key={entry.id || i} className={`flex items-center gap-4 px-5 py-4 border-b border-gray-800 last:border-0 transition ${isYou ? 'bg-amber-500/5 border-l-2 border-l-amber-400' : 'hover:bg-gray-800/50'}`}>
              <div className="w-8 text-center flex-shrink-0">
                {i < 3 ? <span className="text-xl">{medals[i]}</span> : <span className="text-gray-600 font-bold text-sm">#{i + 1}</span>}
              </div>
              <div className="text-xl flex-shrink-0">{icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white truncate">{name}</p>
                  {isYou && <span className="text-cyan-400 text-xs">(you)</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${league.color}`}>{league.icon} {league.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">
                  {tab === 'guilds'
                    ? `${entry.memberCount || 0} members · Lv ${entry.level || 1}`
                    : `Lv ${entry.level || 1} · ${entry.heroClass || 'hero'} · ${trophies} 🏆`}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-amber-300 font-black">{score.toLocaleString()}</p>
                <p className="text-xs text-gray-600">XP</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex gap-3">
        <Link href="/raid" className="bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-3 rounded-xl font-black text-sm uppercase tracking-wide hover:scale-[1.01] transition shadow-lg">
          ⚔️ Earn Trophies
        </Link>
        <Link href="/training" className="bg-gray-800 hover:bg-gray-700 px-5 py-3 rounded-xl font-bold text-sm transition">
          📚 Training Room
        </Link>
      </div>
    </main>
  );
}
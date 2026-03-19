'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useGameStore, type HeroClass } from '@/lib/store';
import { api } from '@/lib/api';
import { HERO_STATS } from '@/lib/game';

export default function HomePage() {
  const { user, setUser, logout } = useGameStore();
  const [username, setUsername]   = useState('');
  const [heroClass, setHeroClass] = useState<HeroClass>('mage');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  async function handleStart() {
    if (!username.trim()) { setError('Enter a username'); return; }
    setLoading(true); setError('');
    try {
      const { user: u } = await api.createUser({ username: username.trim(), heroClass });
      setUser(u);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  if (!user) return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black mb-2">⚔️ EduRPG</h1>
          <p className="text-gray-400">Turn studying into epic multiplayer raids</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold mb-6">Create Your Hero</h2>

          <label className="block text-sm text-gray-400 mb-1">Username</label>
          <input
            value={username} onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            placeholder="Enter username..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 mb-5 text-white outline-none focus:border-cyan-500"
          />

          <label className="block text-sm text-gray-400 mb-2">Hero Class</label>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {(Object.entries(HERO_STATS) as [HeroClass, typeof HERO_STATS[HeroClass]][]).map(([cls, s]) => (
              <button key={cls} onClick={() => setHeroClass(cls)}
                className={`rounded-xl p-4 border-2 text-left transition ${heroClass === cls ? 'border-cyan-400 bg-cyan-400/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="font-bold capitalize">{cls}</div>
                <div className="text-xs text-gray-400">{s.subject}</div>
              </button>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <button onClick={handleStart} disabled={loading || !username.trim()}
            className="w-full bg-gradient-to-r from-amber-400 to-rose-500 text-black font-black py-4 rounded-xl text-sm uppercase tracking-widest disabled:opacity-50 hover:scale-[1.02] transition">
            {loading ? 'Creating hero...' : 'Start Game ⚔️'}
          </button>
        </div>
      </div>
    </main>
  );

  const s = HERO_STATS[user.heroClass];

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero card */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-3xl`}>{s.icon}</div>
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wider">Active Hero</p>
              <h1 className="text-2xl font-black">{user.username}</h1>
              <p className="text-gray-400 capitalize">{user.heroClass} · Level {user.level} · {user.xp} XP</p>
            </div>
          </div>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-400 border border-gray-700 px-4 py-2 rounded-lg transition">
            Logout
          </button>
        </div>
        {/* XP bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Level {user.level}</span>
            <span>{user.xp} / {user.level * user.level * 100} XP</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all"
              style={{ width: `${Math.min(100, (user.xp / (user.level * user.level * 100)) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Nav grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/raid',        icon: '⚔️',  title: 'Raid Arena',    sub: 'Fight bosses together',       color: 'from-rose-500 to-orange-500' },
          { href: '/guild',       icon: '🏛️', title: 'Guild Hall',    sub: 'Join a learning squad',       color: 'from-cyan-500 to-blue-600'   },
          { href: '/leaderboard', icon: '🏆',  title: 'Rankings',      sub: 'See the top players',         color: 'from-amber-400 to-yellow-500'},
          { href: '/profile',     icon: '🧬',  title: 'Profile',       sub: 'Your stats & skill tree',     color: 'from-fuchsia-500 to-rose-500'},
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 hover:-translate-y-1 transition block">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl mb-3`}>{item.icon}</div>
            <p className="font-bold">{item.title}</p>
            <p className="text-xs text-gray-500 mt-1">{item.sub}</p>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {[
          ['Wins',         user.stats?.wins            || 0],
          ['Raids Done',   user.stats?.raidsCompleted  || 0],
          ['Total Damage', user.stats?.totalDamageDealt || 0],
          ['Guild',        user.guildId ? 'Joined' : 'None'],
        ].map(([k, v]) => (
          <div key={k} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-white">{v}</p>
            <p className="text-xs text-gray-500 mt-1">{k}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
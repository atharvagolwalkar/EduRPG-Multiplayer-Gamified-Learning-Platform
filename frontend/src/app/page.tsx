'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';

const HEROES = {
  mage:      { icon: '🔮', name: 'Mage',      subject: 'Mathematics',  desc: 'High spell power. Master of calculus and algebra.', color: 'from-violet-600 to-purple-700', hp: 90,  atk: 30 },
  engineer:  { icon: '⚙️',  name: 'Engineer', subject: 'Programming', desc: 'Solid defense. Expert in algorithms and data.', color: 'from-cyan-600 to-blue-700',    hp: 110, atk: 25 },
  scientist: { icon: '🧪', name: 'Scientist', subject: 'Physics',      desc: 'Balanced build. Commands waves and energy.', color: 'from-emerald-600 to-teal-700', hp: 100, atk: 22 },
} as const;

export default function Home() {
  const { user, token, setUser, setToken, logout } = useStore();
  const [tab,      setTab]      = useState<'login'|'register'>('login');
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [heroClass,setHeroClass]= useState<keyof typeof HEROES>('mage');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleAuth() {
    setLoading(true); setError('');
    try {
      const res = tab === 'login'
        ? await api.login({ email, password })
        : await api.register({ username, email, password, heroClass });
      setToken(res.token);
      setUser({ ...res.user, heroClass: res.user.heroClass || res.user.hero_class || 'mage' });
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  if (!user) return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black mb-2">⚔️ EduRPG</h1>
          <p className="text-slate-400">Turn studying into epic multiplayer raids</p>
        </div>

        <div className="glass rounded-2xl p-8">
          {/* Tab switcher */}
          <div className="flex bg-slate-900 rounded-xl p-1 mb-6">
            {(['login','register'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition ${tab === t ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Username</label>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 text-sm" />
              </div>
            )}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleAuth()}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 text-sm" />
            </div>

            {tab === 'register' && (
              <div>
                <label className="text-xs text-slate-400 mb-2 block">Hero Class</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(HEROES) as [keyof typeof HEROES, typeof HEROES[keyof typeof HEROES]][]).map(([cls, h]) => (
                    <button key={cls} onClick={() => setHeroClass(cls)}
                      className={`p-3 rounded-xl border-2 text-center transition ${heroClass === cls ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                      <div className="text-2xl mb-1">{h.icon}</div>
                      <div className="text-xs font-bold">{h.name}</div>
                      <div className="text-[10px] text-slate-500">{h.subject}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

            <button onClick={handleAuth} disabled={loading || !email || !password}
              className="w-full bg-gradient-to-r from-amber-400 to-rose-500 text-black font-black py-3 rounded-xl text-sm uppercase tracking-widest disabled:opacity-50 hover:scale-[1.01] transition">
              {loading ? '...' : tab === 'login' ? 'Login' : 'Create Hero'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );

  const h = HEROES[user.heroClass as keyof typeof HEROES] || HEROES.mage;
  const xpNeeded = user.level * user.level * 100;
  const pct = Math.min(100, ((user.xp || 0) / xpNeeded) * 100);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero card */}
      <div className="glass rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${h.color} flex items-center justify-center text-3xl shadow-lg`}>{h.icon}</div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Hero</p>
              <h1 className="text-2xl font-black">{user.username}</h1>
              <p className="text-slate-400 text-sm capitalize">{user.heroClass} · Lv {user.level} · {user.totalXp} XP</p>
            </div>
          </div>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-red-400 transition">Logout</button>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Level {user.level}</span><span>{user.xp}/{xpNeeded} XP to next</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[['⚔️ Wins', user.stats?.wins||0], ['💀 Raids', user.stats?.raidsCompleted||0], ['💥 Damage', user.stats?.totalDamageDealt||0], ['🏛️ Guild', user.guildId ? 'Joined' : 'None']].map(([k,v]) => (
          <div key={k as string} className="glass rounded-xl p-3 text-center">
            <p className="text-xl font-black">{v}</p><p className="text-xs text-slate-500 mt-0.5">{k}</p>
          </div>
        ))}
      </div>

      {/* Nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href:'/raid',        icon:'⚔️',  title:'Raid Arena',   sub:'Fight bosses',         grad:'from-rose-500 to-orange-500' },
          { href:'/guild',       icon:'🏛️', title:'Guild Hall',   sub:'Squad up',             grad:'from-cyan-500 to-blue-600'   },
          { href:'/leaderboard', icon:'🏆',  title:'Rankings',     sub:'Top players',          grad:'from-amber-400 to-yellow-500'},
          { href:'/profile',     icon:'🧬',  title:'Profile',      sub:'Stats & skill tree',   grad:'from-fuchsia-500 to-rose-500'},
        ].map(n => (
          <Link key={n.href} href={n.href}
            className="glass rounded-2xl p-5 hover:-translate-y-1 transition block hover:border-white/20">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${n.grad} flex items-center justify-center text-xl mb-3 shadow`}>{n.icon}</div>
            <p className="font-bold text-sm">{n.title}</p>
            <p className="text-xs text-slate-500 mt-1">{n.sub}</p>
          </Link>
        ))}
      </div>

      {/* Hero class card */}
      <div className="glass rounded-2xl p-5 mt-5">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${h.color} flex items-center justify-center text-2xl`}>{h.icon}</div>
          <div>
            <p className="font-black">{h.name} Class · {h.subject}</p>
            <p className="text-sm text-slate-400 mt-0.5">{h.desc}</p>
            <p className="text-xs text-slate-500 mt-1">ATK {h.atk} · HP {h.hp}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
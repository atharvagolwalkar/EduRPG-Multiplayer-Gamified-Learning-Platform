'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { HERO_STATS, type HeroClass } from '@/lib/game';

const LEAGUES = [
  { name: 'Legend',  icon: '👑', min: 3000 },
  { name: 'Diamond', icon: '💎', min: 2000 },
  { name: 'Gold',    icon: '🥇', min: 1000 },
  { name: 'Silver',  icon: '🥈', min: 500  },
  { name: 'Bronze',  icon: '🥉', min: 0    },
];
function getLeague(t = 100) { return LEAGUES.find(l => t >= l.min) || LEAGUES[4]; }

export default function Home() {
  const { user, token, setUser, setToken, logout } = useStore();
  const [tab,       setTab]       = useState<'login' | 'register'>('register');
  const [username,  setUsername]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [heroClass, setHeroClass] = useState<HeroClass>('mage');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [hovered,   setHovered]   = useState<HeroClass | null>(null);
  const [streakInfo, setStreakInfo] = useState<{ streak: number; bonus: number } | null>(null);

  // Daily streak on login
  useEffect(() => {
    if (!user) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/${user.id}/streak`, { method: 'POST' })
      .then(r => r.json())
      .then(d => { if (d.streak > 0) setStreakInfo(d); })
      .catch(() => {});
  }, [user?.id]);

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
    <main className="min-h-screen flex bg-gray-950">
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-gray-900 border-r border-gray-800">
        <div>
          <div className="flex items-center gap-3 mb-16"><span className="text-3xl">⚔️</span><span className="text-xl font-black">EduRPG</span></div>
          <h1 className="text-6xl font-black leading-tight mb-6">Learn.<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-500">Battle.</span><br/>Conquer.</h1>
          <p className="text-gray-400 text-lg leading-8">Transform studying into epic multiplayer boss raids. Answer questions, deal damage, defeat monsters — together in real time.</p>
        </div>
        <div className="space-y-3">
          {[['⚔️','Real-time multiplayer raids with share codes'],['🤖','AI Dungeon Master narrates every battle'],['🏆','Trophy leagues: Bronze → Diamond → Legend'],['📚','Training Room with curated YouTube videos'],['🎖️','Achievements, streaks & skill trees']].map(([i,t]) => (
            <div key={t} className="flex items-center gap-3 text-sm text-gray-400"><span className="text-lg">{i}</span>{t}</div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden"><h1 className="text-4xl font-black mb-1">⚔️ EduRPG</h1><p className="text-gray-500 text-sm">Multiplayer Gamified Learning</p></div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="flex bg-gray-950 rounded-xl p-1 mb-6">
              {(['register','login'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-lg text-sm font-bold capitalize transition ${tab===t?'bg-gray-800 text-white shadow':'text-gray-500 hover:text-gray-300'}`}>
                  {t==='register'?'Create Hero':'Login'}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {tab==='register' && (
                <div><label className="text-xs text-gray-500 mb-1.5 block">Username</label>
                <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="HeroName" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 text-sm transition"/></div>
              )}
              <div><label className="text-xs text-gray-500 mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="hero@edurpg.com" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 text-sm transition"/></div>
              <div><label className="text-xs text-gray-500 mb-1.5 block">Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&handleAuth()} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 text-sm transition"/></div>
              {tab==='register' && (
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Choose Your Class</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(HERO_STATS) as [HeroClass, typeof HERO_STATS[HeroClass]][]).map(([cls,h]) => (
                      <button key={cls} onClick={()=>setHeroClass(cls)} onMouseEnter={()=>setHovered(cls)} onMouseLeave={()=>setHovered(null)}
                        className={`relative p-3 rounded-xl border-2 text-center transition-all ${heroClass===cls?`${h.border} bg-white/5 scale-105`:'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
                        <div className="text-2xl mb-1">{h.icon}</div>
                        <div className="text-xs font-bold">{h.name}</div>
                        <div className="text-[10px] text-gray-500">{h.subject}</div>
                        {heroClass===cls && <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full flex items-center justify-center text-[8px] text-black font-black">✓</div>}
                      </button>
                    ))}
                  </div>
                  {(hovered||heroClass) && (
                    <div className="mt-2 p-3 bg-gray-800 rounded-xl border border-gray-700 text-xs">
                      <p className="text-white font-bold mb-1">{HERO_STATS[hovered||heroClass].special}</p>
                      <p className="text-gray-400">{HERO_STATS[hovered||heroClass].desc}</p>
                    </div>
                  )}
                </div>
              )}
              {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{error}</p>}
              <button onClick={handleAuth} disabled={loading||!email||!password} className="w-full bg-gradient-to-r from-amber-400 to-rose-500 text-black font-black py-3.5 rounded-xl text-sm uppercase tracking-widest disabled:opacity-50 hover:scale-[1.01] transition shadow-lg">
                {loading?'...':(tab==='login'?'Enter the Arena':'Create My Hero')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );

  const h = HERO_STATS[user.heroClass as HeroClass] || HERO_STATS.mage;
  const xpNeeded = user.level * user.level * 100;
  const xpPrev   = (user.level-1)*(user.level-1)*100;
  const pct      = Math.min(100,(((user.xp||0)-xpPrev)/(xpNeeded-xpPrev))*100);
  const league   = getLeague(user.trophies || 100);

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Streak toast */}
      {streakInfo && streakInfo.bonus > 0 && (
        <div className="fixed top-4 right-4 z-50 bg-amber-400 text-black rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-2xl">🔥</span>
          <div><p className="font-black text-sm">{streakInfo.streak}-Day Streak!</p><p className="text-xs">+{streakInfo.bonus} bonus XP earned!</p></div>
          <button onClick={() => setStreakInfo(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="font-black text-lg">⚔️ EduRPG</div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
              <span className="font-bold text-white">{user.username}</span>
              <span className="text-gray-600">·</span>
              <span>{league.icon} {league.name}</span>
              {user.streak > 0 && <span className="text-orange-400">🔥 {user.streak}</span>}
            </span>
            <button onClick={logout} className="text-xs text-gray-600 hover:text-red-400 border border-gray-800 px-3 py-1.5 rounded-lg transition">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero banner */}
        <div className={`rounded-2xl bg-gradient-to-br ${h.color} p-6 mb-6 relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-5xl border border-white/20">{h.icon}</div>
              <div>
                <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Active Hero</p>
                <h1 className="text-3xl font-black text-white">{user.username}</h1>
                <p className="text-white/70 text-sm capitalize">{h.name} · {h.subject} · Lv {user.level}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-white/50 text-xs">{league.icon} {league.name} · {user.trophies||100} 🏆</span>
                  {(user.streak||0) > 0 && <span className="text-orange-300 text-xs">🔥 {user.streak}-day streak</span>}
                </div>
              </div>
            </div>
            <div className="w-48">
              <div className="flex justify-between text-xs text-white/60 mb-1"><span>Lv {user.level}</span><span>{user.xp||0}/{xpNeeded} XP</span></div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white rounded-full transition-all" style={{width:`${pct}%`}}/></div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[['⚔️','Wins',user.stats?.wins||0,'text-emerald-400'],['🏆','Trophies',user.trophies||100,'text-amber-400'],['💥','Damage',user.stats?.totalDamageDealt||0,'text-rose-400'],['🔥','Streak',`${user.streak||0} days`,'text-orange-400']].map(([icon,k,v,c])=>(
            <div key={k as string} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className={`text-2xl font-black ${c}`}>{v}</p>
              <p className="text-xs text-gray-500 mt-1">{icon} {k}</p>
            </div>
          ))}
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            {href:'/raid',        icon:'⚔️',  title:'Raid Arena',   sub:'Real-time battles',       grad:'from-rose-600 to-orange-600'  },
            {href:'/training',    icon:'📚',  title:'Training Room',sub:'Videos per subject',      grad:'from-blue-600 to-indigo-600'  },
            {href:'/guild',       icon:'🏛️', title:'Guild Hall',   sub:'Squad up',                grad:'from-cyan-600 to-blue-600'    },
            {href:'/leaderboard', icon:'🏆',  title:'Rankings',     sub:'Trophy leagues',          grad:'from-amber-500 to-yellow-600' },
            {href:'/profile',     icon:'🧬',  title:'Profile',      sub:'Skills & achievements',   grad:'from-fuchsia-600 to-rose-600' },
          ].map(n=>(
            <Link key={n.href} href={n.href} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:-translate-y-1 transition-all block hover:border-gray-700">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${n.grad} flex items-center justify-center text-xl mb-2.5 shadow`}>{n.icon}</div>
              <p className="font-bold text-sm text-white">{n.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{n.sub}</p>
            </Link>
          ))}
        </div>

        {/* Boss preview */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm text-gray-300">⚔️ Boss Roster</p>
            <Link href="/raid" className="text-xs text-cyan-400 hover:underline">Challenge →</Link>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[{i:'🧮',n:'Calculus Titan',h:100},{i:'👾',n:'Code Demon',h:120},{i:'👻',n:'Physics Phantom',h:90},{i:'🐉',n:'Logic Dragon',h:150},{i:'🐍',n:'Algebra Hydra',h:130}].map(b=>(
              <div key={b.n} className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
                <div className="text-2xl mb-1">{b.i}</div>
                <p className="text-xs font-bold text-white leading-tight">{b.n}</p>
                <div className="mt-1.5 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{width:`${(b.h/150)*100}%`}}/>
                </div>
                <p className="text-[10px] text-rose-400 mt-0.5">{b.h} HP</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
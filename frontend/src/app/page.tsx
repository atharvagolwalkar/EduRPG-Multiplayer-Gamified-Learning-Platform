'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeroCard } from '@/components/HeroCard';
import { HERO_STATS } from '@/lib/gameEngine';
import { useGameStore } from '@/lib/store';
import { useUser } from '@/lib/useAPI';
import { isFirebaseConfigured, missingFirebaseConfig } from '@/lib/firebase';

const DESTINATIONS = [
  {
    href: '/raid',
    title: 'Raid Arena',
    subtitle: 'Team up against knowledge bosses',
    accent: 'from-rose-500 to-orange-400',
    icon: '⚔️',
  },
  {
    href: '/guild',
    title: 'Guild Hall',
    subtitle: 'Find a squad and grow together',
    accent: 'from-cyan-400 to-blue-500',
    icon: '🏛️',
  },
  {
    href: '/leaderboard',
    title: 'Rankings',
    subtitle: 'Track the strongest learners',
    accent: 'from-amber-300 to-yellow-500',
    icon: '🏆',
  },
  {
    href: '/profile',
    title: 'Command Deck',
    subtitle: 'Review your stats and progress',
    accent: 'from-fuchsia-500 to-rose-400',
    icon: '🧬',
  },
] as const;

export default function Home() {
  const { user, setUser } = useGameStore();
  const { createUser } = useUser();
  const [selectedHero, setSelectedHero] = useState<'mage' | 'engineer' | 'scientist' | null>(null);
  const [username, setUsername] = useState('');
  const [showHeroSelect, setShowHeroSelect] = useState(true); // Always start with true to avoid hydration mismatch
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [backendFirebaseMode, setBackendFirebaseMode] = useState<'loading' | 'mock' | 'connected'>('loading');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load Firebase status and sync user state after hydration
  useEffect(() => {
    setIsHydrated(true);
    
    // Update hero select based on current user
    if (user) {
      setShowHeroSelect(false);
    }

    const loadStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/system/firebase-status`);
        const data = await response.json();
        setBackendFirebaseMode(data.firebase?.mode === 'connected' ? 'connected' : 'mock');
      } catch (error) {
        setBackendFirebaseMode('mock');
      }
    };
    loadStatus();
  }, [user]);

  const handleStartGame = async () => {
    if (!username.trim() || !selectedHero) {
      setErrorMessage('Please enter username and select a hero class');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await createUser({
        username: username.trim(),
        email: `${username.trim().toLowerCase().replace(/\s+/g, '')}@edurpg.local`,
        heroClass: selectedHero,
      });
      setShowHeroSelect(false);
    } catch (error) {
      console.error('Error creating user:', error);
      setErrorMessage('Error creating character. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeCharacter = () => {
    setSelectedHero(null);
    setUsername('');
    setShowHeroSelect(true);
    setErrorMessage('');
  };

  const handleLogout = () => {
    localStorage.removeItem('idToken');
    localStorage.removeItem('user');
    setUser(null);
    setShowHeroSelect(true);
    setErrorMessage('');
  };

  // Only render after hydration to prevent mismatch
  if (!isHydrated) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <section className="panel-strong mesh-card animate-lift-in rounded-[36px] p-8 md:p-10">
          <div className="animate-pulse">
            <div className="h-12 w-64 bg-slate-700 rounded-lg mb-4"></div>
            <div className="h-6 w-full bg-slate-700 rounded-lg mb-4"></div>
            <div className="h-6 w-3/4 bg-slate-700 rounded-lg"></div>
          </div>
        </section>
      </main>
    );
  }

  // Hero selection screen
  if (!user || showHeroSelect) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        {backendFirebaseMode === 'mock' && (
          <div className="mb-6 rounded-[20px] border border-amber-500/30 bg-amber-500/10 px-5 py-4">
            <p className="text-sm font-semibold text-amber-200">
              ⚠️ Firebase is running in MOCK mode - data will not persist. Check backend logs or FIREBASE_SETUP.md for configuration.
            </p>
          </div>
        )}
        <section className="panel-strong mesh-card animate-lift-in rounded-[36px] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
            <div className="space-y-6">
              <p className="section-label">Character Selection</p>
              <div>
                <h1 className="headline-gradient text-5xl font-black tracking-tight md:text-7xl">
                  Create Your Hero
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-slate-300 md:text-xl">
                  Choose a hero class and start your learning adventure.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="section-label mb-2 block">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username..."
                    className="w-full rounded-[20px] border border-white/10 bg-slate-950/60 px-5 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/20"
                  />
                </div>

                <div>
                  <label className="section-label mb-2 block">Hero Class</label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(['mage', 'engineer', 'scientist'] as const).map((heroClass) => (
                      <button
                        key={heroClass}
                        onClick={() => setSelectedHero(heroClass)}
                        className={`rounded-[20px] border-2 p-4 text-left transition ${
                          selectedHero === heroClass
                            ? 'border-cyan-300 bg-cyan-300/10'
                            : 'border-white/10 bg-slate-950/60 hover:border-white/20'
                        }`}
                      >
                        <p className="font-black capitalize text-white">{heroClass}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {heroClass === 'mage'
                            ? 'Mathematics Expert'
                            : heroClass === 'engineer'
                              ? 'Programming Expert'
                              : 'Physics Expert'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {errorMessage && (
                  <div className="rounded-[20px] border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                    {errorMessage}
                  </div>
                )}

                <button
                  onClick={handleStartGame}
                  disabled={loading || !username.trim() || !selectedHero}
                  className="w-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-rose-400 px-6 py-4 text-sm font-black uppercase tracking-[0.24em] text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Creating hero...' : 'Start Game'}
                </button>
              </div>

              <p className="text-xs text-slate-400">
                {backendFirebaseMode === 'connected'
                  ? '✅ Firebase connected'
                  : '⚠️ Using local storage (mock mode)'}
              </p>
            </div>

            <div className="panel rounded-[30px] p-6">
              <p className="section-label mb-4">Hero Guide</p>
              <div className="space-y-4">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-lg font-black text-white">🧙 Mage</p>
                  <p className="text-xs text-slate-400 mt-2">Specialize in Mathematics. High attack power, lower HP.</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-lg font-black text-white">⚙️ Engineer</p>
                  <p className="text-xs text-slate-400 mt-2">Specialize in Programming. Balanced attack and high HP.</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-lg font-black text-white">🔬 Scientist</p>
                  <p className="text-xs text-slate-400 mt-2">Specialize in Physics. Moderate attack and HP.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Main hub screen (logged in)
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
      <section className="panel-strong mesh-card animate-lift-in rounded-[36px] p-8 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="space-y-6">
            <p className="section-label">Player Hub</p>
            <div>
              <h1 className="headline-gradient text-5xl font-black tracking-tight md:text-7xl">
                EduRPG
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-slate-300 md:text-xl">
                Turn study sessions into cinematic raid runs, squad-based progress, and visible momentum.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="panel rounded-[24px] p-4">
                <p className="section-label mb-2">Hero</p>
                <p className="text-2xl font-black capitalize text-white">{user?.heroClass}</p>
              </div>
              <div className="panel rounded-[24px] p-4">
                <p className="section-label mb-2">Level</p>
                <p className="text-2xl font-black text-white">{user?.level}</p>
              </div>
              <div className="panel rounded-[24px] p-4">
                <p className="section-label mb-2">XP</p>
                <p className="text-2xl font-black text-white">{user?.xp || 0}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleChangeCharacter}
                className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
              >
                Change Hero
              </button>
              <Link
                href="/raid"
                className="rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-rose-400 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-950 transition hover:scale-[1.02]"
              >
                Launch Raid
              </Link>
            </div>
          </div>

          <div className="panel rounded-[30px] p-6 space-y-4">
            <div>
              <p className="section-label mb-4">Welcome back</p>
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Active profile</p>
                    <h2 className="mt-2 text-3xl font-black text-white">{user?.username}</h2>
                  </div>
                  <div className="text-5xl">
                    {user?.heroClass === 'mage' ? '🔮' : user?.heroClass === 'engineer' ? '⚙️' : '🧪'}
                  </div>
                </div>
                <p className="text-sm leading-7 text-slate-300">
                  Your next run is one tap away. Jump into a raid, join a guild, or push for a new leaderboard rank.
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {DESTINATIONS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="panel mesh-card animate-lift-in rounded-[30px] p-6 transition duration-500 hover:-translate-y-1 hover:border-white/20"
          >
            <div className={`mb-5 inline-flex rounded-3xl bg-gradient-to-br ${item.accent} p-4 text-3xl shadow-2xl`}>
              {item.icon}
            </div>
            <h2 className="text-2xl font-black text-white">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{item.subtitle}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}

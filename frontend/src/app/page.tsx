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
  const { user } = useGameStore();
  const { createUser } = useUser();
  const [selectedHero, setSelectedHero] = useState<'mage' | 'engineer' | 'scientist' | null>(null);
  const [username, setUsername] = useState('');
  const [showHeroSelect, setShowHeroSelect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [backendFirebaseMode, setBackendFirebaseMode] = useState<'loading' | 'mock' | 'connected'>('loading');

  useEffect(() => {
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
  }, []);

  const handleStartGame = async () => {
    if (!username.trim() || !selectedHero) {
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
      setErrorMessage('The backend could not create your hero. Check that the backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  if (user && !showHeroSelect) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
        <section className="panel-strong mesh-card animate-lift-in rounded-[36px] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
            <div className="space-y-6">
              <p className="section-label">Player hub</p>
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
                  <p className="text-2xl font-black capitalize text-white">{user.heroClass}</p>
                </div>
                <div className="panel rounded-[24px] p-4">
                  <p className="section-label mb-2">Level</p>
                  <p className="text-2xl font-black text-white">{user.level}</p>
                </div>
                <div className="panel rounded-[24px] p-4">
                  <p className="section-label mb-2">XP</p>
                  <p className="text-2xl font-black text-white">{user.xp}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowHeroSelect(true)}
                  className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
                >
                  Rebuild hero
                </button>
                <Link
                  href="/raid"
                  className="rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-rose-400 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-slate-950 transition hover:scale-[1.02]"
                >
                  Launch raid
                </Link>
              </div>
            </div>

            <div className="panel rounded-[30px] p-6">
              <p className="section-label mb-4">Welcome back</p>
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Active profile</p>
                    <h2 className="mt-2 text-3xl font-black text-white">{user.username}</h2>
                  </div>
                  <div className="text-5xl">
                    {user.heroClass === 'mage' ? '🔮' : user.heroClass === 'engineer' ? '⚙️' : '🧪'}
                  </div>
                </div>
                <p className="text-sm leading-7 text-slate-300">
                  Your next run is one tap away. Jump into a raid, join a guild, or push for a new leaderboard rank.
                </p>
              </div>
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

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
      <section className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="animate-lift-in space-y-8">
          <div className="space-y-4">
            <p className="section-label">Learning meets boss battles</p>
            <h1 className="headline-gradient max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
              Build a study game that actually feels alive.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Choose a hero class, generate your local profile, and move into raids, guilds, and progression loops.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['Co-op raids', 'Answer fast, stack streaks, and melt bosses.'],
              ['Guild identity', 'Make group progress visible and social.'],
              ['Real momentum', 'Track XP, classes, and progression at a glance.'],
            ].map(([title, description]) => (
              <div key={title} className="panel rounded-[24px] p-5">
                <p className="text-lg font-black text-white">{title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">{description}</p>
              </div>
            ))}
          </div>

          <div className="panel rounded-[24px] p-5">
            <p className="section-label mb-3">Firebase readiness</p>
            <p className="text-sm leading-7 text-slate-300">
              Backend mode: <span className="font-bold text-white">{backendFirebaseMode}</span>
            </p>
            <p className="text-sm leading-7 text-slate-300">
              Frontend config: <span className="font-bold text-white">{isFirebaseConfigured ? 'complete' : 'missing keys'}</span>
            </p>
            {!isFirebaseConfigured && (
              <p className="mt-2 text-xs text-slate-400">
                Missing: {missingFirebaseConfig.join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="panel-strong animate-lift-in rounded-[34px] p-6 md:p-8">
          <div className="mb-6">
            <p className="section-label mb-3">Create your hero</p>
            <label className="mb-3 block text-sm font-bold uppercase tracking-[0.22em] text-slate-300">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your gamer tag"
              className="w-full rounded-[22px] border border-white/10 bg-slate-950/60 px-5 py-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-slate-300">
                Pick your class
              </p>
              {selectedHero && (
                <span className="rounded-full border border-amber-300/30 bg-amber-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
                  {selectedHero}
                </span>
              )}
            </div>
            <div className="grid gap-4 xl:grid-cols-3">
              {(['mage', 'engineer', 'scientist'] as const).map((heroClass) => (
                <HeroCard
                  key={heroClass}
                  name={heroClass.charAt(0).toUpperCase() + heroClass.slice(1)}
                  class={heroClass}
                  stats={HERO_STATS[heroClass]}
                  selected={selectedHero === heroClass}
                  onSelect={() => setSelectedHero(heroClass)}
                />
              ))}
            </div>
          </div>

          {errorMessage && (
            <div className="mt-6 rounded-[22px] border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {errorMessage}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleStartGame}
              disabled={!username.trim() || !selectedHero || loading}
              className="rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-amber-300 px-7 py-4 text-sm font-black uppercase tracking-[0.24em] text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Summoning hero...' : 'Start adventure'}
            </button>
            <p className="text-sm text-slate-400">
              Local mode works even without Firebase credentials now.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/lib/store';
import { useUser } from '@/lib/useAPI';

const HERO_EMOJIS: Record<'mage' | 'engineer' | 'scientist', string> = {
  mage: '🔮',
  engineer: '⚙️',
  scientist: '🧪',
};

const HERO_GRADIENTS: Record<'mage' | 'engineer' | 'scientist', string> = {
  mage: 'from-fuchsia-500/40 via-violet-500/30 to-indigo-500/20',
  engineer: 'from-cyan-400/40 via-sky-500/30 to-blue-500/20',
  scientist: 'from-emerald-400/40 via-teal-500/30 to-lime-500/20',
};

export default function ProfilePage() {
  const { user, setUser } = useGameStore();
  const { getUser } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-8">
        <div className="panel rounded-[30px] p-8 text-center">
          <p className="text-lg text-slate-300">Create a hero first so the profile has something to show.</p>
          <Link href="/" className="mt-6 inline-flex rounded-full bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    setNotice('');

    try {
      const refreshedUser = await getUser(user.id);
      if (refreshedUser) {
        setUser({ ...refreshedUser, guildId: refreshedUser.guildId ?? undefined });
        setNotice('Profile synced with backend data.');
      } else {
        setNotice('No backend profile was found for this user.');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setNotice('Could not refresh right now. Showing local profile data.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <section className="panel-strong mesh-card animate-lift-in rounded-[36px] p-8 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
          <div className={`rounded-[32px] border border-white/10 bg-gradient-to-br ${HERO_GRADIENTS[user.heroClass]} p-8`}>
            <p className="section-label mb-4">Command Deck</p>
            <div className="mb-6 flex items-center gap-5">
              <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-black/20 text-5xl shadow-2xl">
                {HERO_EMOJIS[user.heroClass]}
              </div>
              <div>
                <h1 className="text-4xl font-black text-white md:text-5xl">{user.username}</h1>
                <p className="mt-2 text-sm font-bold uppercase tracking-[0.24em] text-slate-200">
                  {user.heroClass} class
                </p>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-200">
              Your profile is the high-signal summary of how your learning journey is going: class identity, progression, and recent momentum.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Level', `${user.level}`],
              ['XP', `${user.xp}`],
              ['Guild', user.guildId || 'No guild yet'],
              ['Status', 'Ready for next raid'],
            ].map(([label, value]) => (
              <div key={label} className="panel rounded-[24px] p-5">
                <p className="section-label mb-3">{label}</p>
                <p className="text-2xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="panel animate-lift-in rounded-[30px] p-6">
          <p className="section-label mb-4">Achievement track</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { icon: '👋', label: 'First Steps', unlocked: true },
              { icon: '🔥', label: 'Three-hit streak', unlocked: user.xp >= 30 },
              { icon: '🏆', label: 'Top contender', unlocked: user.level >= 5 },
              { icon: '⚡', label: '100 total XP', unlocked: user.xp >= 100 },
              { icon: '🧠', label: 'Knowledge engine', unlocked: user.level >= 3 },
              { icon: '🤝', label: 'Guild-ready', unlocked: Boolean(user.guildId) },
            ].map((achievement) => (
              <div
                key={achievement.label}
                className={`rounded-[24px] border p-4 ${
                  achievement.unlocked
                    ? 'border-amber-300/30 bg-amber-300/10 text-amber-50'
                    : 'border-white/10 bg-white/5 text-slate-400'
                }`}
              >
                <div className="text-3xl">{achievement.icon}</div>
                <p className="mt-3 text-lg font-black">{achievement.label}</p>
                <p className="mt-2 text-sm">{achievement.unlocked ? 'Unlocked' : 'Locked'}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel animate-lift-in rounded-[30px] p-6">
          <p className="section-label mb-4">Recent activity</p>
          <div className="space-y-3">
            {[
              ['⚔️', 'Entered the raid lobby', 'Just now'],
              ['📈', 'Tracked XP progress', 'Today'],
              ['🛡️', `Selected ${user.heroClass} class`, 'Today'],
              ['🧭', 'Opened command deck', 'Session event'],
            ].map(([icon, title, time]) => (
              <div key={title} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{icon}</div>
                  <div>
                    <p className="text-base font-black text-white">{title}</p>
                    <p className="text-sm text-slate-400">{time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {notice && (
            <div className="mt-5 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {notice}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-full bg-gradient-to-r from-fuchsia-300 via-rose-300 to-amber-300 px-6 py-3 text-sm font-black uppercase tracking-[0.22em] text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh profile'}
            </button>
            <Link
              href="/"
              className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white/15"
            >
              Back home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

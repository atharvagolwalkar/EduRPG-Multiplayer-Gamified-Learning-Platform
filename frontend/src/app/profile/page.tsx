'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/lib/store';
import { RaidRecord, useRaid, useUser } from '@/lib/useAPI';

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
  const { getRaidHistory } = useRaid();
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const [raidHistory, setRaidHistory] = useState<RaidRecord[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    const loadHistory = async () => {
      try {
        const raids = await getRaidHistory(user.id);
        if (active) {
          setRaidHistory(raids);
        }
      } catch (error) {
        console.error('Error loading raid history:', error);
      }
    };

    loadHistory();

    return () => {
      active = false;
    };
  }, [getRaidHistory, user]);

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

  const stats = user.stats || {
    wins: 0,
    losses: 0,
    raidsCompleted: 0,
    monsterDefeated: 0,
    totalDamageDealt: 0,
  };

  const achievements = useMemo(
    () => [
      { icon: '👋', label: 'First Steps', unlocked: true },
      { icon: '🔥', label: 'Win streak ready', unlocked: stats.wins >= 1 },
      { icon: '🏆', label: 'Boss breaker', unlocked: stats.monsterDefeated >= 1 },
      { icon: '⚡', label: '100 total XP', unlocked: (user.totalXp || user.xp) >= 100 },
      { icon: '🧠', label: 'Knowledge engine', unlocked: user.level >= 3 },
      { icon: '🤝', label: 'Guild-ready', unlocked: Boolean(user.guildId) },
    ],
    [stats.monsterDefeated, stats.wins, user.guildId, user.level, user.totalXp, user.xp]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    setNotice('');

    try {
      const [refreshedUser, raids] = await Promise.all([getUser(user.id), getRaidHistory(user.id)]);

      if (refreshedUser) {
        setUser({ ...refreshedUser, guildId: refreshedUser.guildId ?? undefined });
        setRaidHistory(raids);
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
              Your profile now pulls actual raid and stat data from the backend so wins, losses, and damage feel like real progression.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Level', `${user.level}`],
              ['Total XP', `${user.totalXp || user.xp}`],
              ['Guild', user.guildId || 'No guild yet'],
              ['Raid wins', `${stats.wins}`],
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
        <div className="space-y-6">
          <div className="panel animate-lift-in rounded-[30px] p-6">
            <p className="section-label mb-4">Achievement track</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {achievements.map((achievement) => (
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
            <p className="section-label mb-4">Performance stats</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['Raids completed', `${stats.raidsCompleted}`],
                ['Losses', `${stats.losses}`],
                ['Monsters defeated', `${stats.monsterDefeated}`],
                ['Total damage dealt', `${stats.totalDamageDealt}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <p className="mt-2 text-2xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel animate-lift-in rounded-[30px] p-6">
          <p className="section-label mb-4">Recent raids</p>
          <div className="space-y-3">
            {raidHistory.length > 0 ? (
              raidHistory.map((raidEntry) => (
                <div key={raidEntry.id} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-black text-white">{raidEntry.monsterName || 'Raid encounter'}</p>
                      <p className="text-sm text-slate-400">
                        {raidEntry.endTime ? new Date(raidEntry.endTime).toLocaleString() : 'Raid in progress'}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] ${
                        raidEntry.status === 'completed'
                          ? 'bg-emerald-400/15 text-emerald-100'
                          : 'bg-amber-300/15 text-amber-100'
                      }`}
                    >
                      {raidEntry.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                No completed raids yet. Run a squad battle to start building history.
              </div>
            )}
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

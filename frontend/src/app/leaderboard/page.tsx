'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GuildRecord, LeaderboardEntry, useLeaderboard } from '@/lib/useAPI';

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, username: 'ShadowMage', xp: 5420, level: 12, guild: 'Elite Squad' },
  { rank: 2, username: 'CodeNinja', xp: 4980, level: 11, guild: 'Debug Hackers' },
  { rank: 3, username: 'MathChampion', xp: 4650, level: 10, guild: 'Equation Solvers' },
  { rank: 4, username: 'PhysicsWizard', xp: 4320, level: 10, guild: 'Force Multipliers' },
  { rank: 5, username: 'DataScience', xp: 3980, level: 9, guild: 'Algorithm Kings' },
];

type Filter = 'global' | 'weekly' | 'guild';

export default function LeaderboardPage() {
  const { fetchGlobal, fetchWeekly, fetchGuilds } = useLeaderboard();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(mockLeaderboard);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>('global');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    const loadLeaderboard = async () => {
      setLoading(true);
      setNotice('');

      try {
        let data: LeaderboardEntry[] = [];

        if (filter === 'global') {
          data = await fetchGlobal();
        } else if (filter === 'weekly') {
          data = await fetchWeekly();
        } else {
          const guilds = await fetchGuilds();
          data = guilds.map((guild: GuildRecord, index) => ({
            rank: index + 1,
            username: guild.name,
            xp: guild.xp,
            level: guild.level,
            guild: `${guild.memberCount} members`,
          }));
        }

        if (active && data.length > 0) {
          setLeaderboard(data);
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        if (active) {
          setNotice('Showing seeded data because the live leaderboard is unavailable.');
          setLeaderboard(mockLeaderboard);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadLeaderboard();

    return () => {
      active = false;
    };
  }, [fetchGlobal, fetchGuilds, fetchWeekly, filter]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
      <section className="panel-strong mesh-card animate-lift-in rounded-[36px] p-8 md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label mb-3">Leaderboard</p>
            <h1 className="headline-gradient text-5xl font-black tracking-tight md:text-7xl">
              Make progress impossible to miss.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Compare learners, track weekly surges, and surface guild progress in one strong visual rhythm.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {(['global', 'weekly', 'guild'] as const).map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-full px-5 py-3 text-sm font-black uppercase tracking-[0.22em] transition ${
                  filter === value
                    ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 text-slate-950'
                    : 'border border-white/10 bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {notice && (
          <div className="mt-6 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            {notice}
          </div>
        )}
      </section>

      <section className="mt-8 panel animate-lift-in overflow-hidden rounded-[34px]">
        <div className="grid grid-cols-[0.9fr_2fr_1fr_1.2fr_1.4fr] gap-4 border-b border-white/10 bg-white/5 px-6 py-4 text-xs font-black uppercase tracking-[0.24em] text-slate-400">
          <div>Rank</div>
          <div>Player</div>
          <div>Level</div>
          <div>XP</div>
          <div>Guild</div>
        </div>

        <div className="divide-y divide-white/10">
          {leaderboard.map((entry) => (
            <div
              key={`${filter}-${entry.rank}-${entry.username}`}
              className="grid grid-cols-1 gap-4 px-6 py-5 transition hover:bg-white/5 md:grid-cols-[0.9fr_2fr_1fr_1.2fr_1.4fr] md:items-center"
            >
              <div className="text-2xl font-black text-white">
                {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-indigo-500 text-lg font-black text-slate-950">
                  {entry.username.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-black text-white">{entry.username}</p>
                  <p className="text-sm text-slate-400">{filter === 'guild' ? 'Guild entry' : 'Player entry'}</p>
                </div>
              </div>
              <div className="text-lg font-black text-white">{entry.level}</div>
              <div className="text-lg font-black text-amber-200">{entry.xp}</div>
              <div className="text-sm font-semibold text-slate-300">{entry.guild || 'Unassigned'}</div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="border-t border-white/10 px-6 py-4 text-sm text-slate-400">
            Refreshing leaderboard...
          </div>
        )}
      </section>

      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white/15"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}

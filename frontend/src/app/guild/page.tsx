'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/lib/store';
import { GuildRecord, UserRecord, useGuild, useUser } from '@/lib/useAPI';

const mockGuilds: GuildRecord[] = [
  {
    id: '1',
    name: 'Elite Squad',
    description: 'Fast-paced learners chasing top ranks.',
    leader: 'ShadowMage',
    members: ['a'],
    memberCount: 28,
    xp: 45000,
    level: 12,
  },
  {
    id: '2',
    name: 'Debug Hackers',
    description: 'Problem-solvers who treat every lesson like a boss mechanic.',
    leader: 'CodeNinja',
    members: ['a'],
    memberCount: 32,
    xp: 42000,
    level: 11,
  },
  {
    id: '3',
    name: 'Equation Solvers',
    description: 'Math-heavy squad built for consistent wins.',
    leader: 'MathChampion',
    members: ['a'],
    memberCount: 18,
    xp: 35000,
    level: 9,
  },
];

export default function GuildPage() {
  const { user } = useGameStore();
  const { createGuild, getGuildList, addMember } = useGuild();
  const { getUsers } = useUser();
  const [guilds, setGuilds] = useState<GuildRecord[]>(mockGuilds);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedGuild, setSelectedGuild] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [guildName, setGuildName] = useState('');
  const [guildDescription, setGuildDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const [guildResponse, userResponse] = await Promise.allSettled([getGuildList(), getUsers()]);

        if (active && guildResponse.status === 'fulfilled' && guildResponse.value.length > 0) {
          setGuilds(guildResponse.value);
        }

        if (active && userResponse.status === 'fulfilled') {
          setUsers(userResponse.value);
        }
      } catch (error) {
        console.error('Error loading guild data:', error);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [getGuildList, getUsers]);

  const selectedGuildRecord = useMemo(
    () => guilds.find((guild) => guild.id === selectedGuild) ?? null,
    [guilds, selectedGuild]
  );

  const userMap = useMemo(
    () => Object.fromEntries(users.map((entry) => [entry.id, entry])),
    [users]
  );

  const selectedMembers = useMemo(() => {
    if (!selectedGuildRecord) {
      return [];
    }

    return selectedGuildRecord.members.map((memberId) => {
      const record = userMap[memberId];
      return {
        id: memberId,
        username: record?.username || memberId,
        heroClass: record?.heroClass || 'unknown',
      };
    });
  }, [selectedGuildRecord, userMap]);

  const resolvedLeader = selectedGuildRecord ? userMap[selectedGuildRecord.leader]?.username || selectedGuildRecord.leader : '';

  const handleCreateGuild = async () => {
    if (!guildName.trim() || !user) {
      return;
    }

    setLoading(true);
    setNotice('');

    try {
      const newGuild = await createGuild({
        name: guildName.trim(),
        description: guildDescription.trim(),
        leaderId: user.id,
      });
      setGuilds((current) => [newGuild, ...current]);
      setSelectedGuild(newGuild.id);
      setShowCreateForm(false);
      setGuildName('');
      setGuildDescription('');
      setNotice('Guild created successfully.');
    } catch (error) {
      console.error('Error creating guild:', error);
      setNotice('The backend could not create the guild. Check that the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGuild = async (guildId: string) => {
    if (!user) {
      setNotice('Create a hero before joining a guild.');
      return;
    }

    setLoading(true);
    setNotice('');

    try {
      const updatedGuild = await addMember(guildId, user.id);
      setGuilds((current) => current.map((guild) => (guild.id === guildId ? updatedGuild : guild)));
      setNotice(`You joined ${updatedGuild.name}.`);
    } catch (error) {
      console.error('Error joining guild:', error);
      setNotice('Could not join the guild right now.');
    } finally {
      setLoading(false);
    }
  };

  const userGuild = guilds.find((guild) => user?.guildId && guild.id === user.guildId) || null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
      <section className="panel-strong mesh-card animate-lift-in rounded-[36px] p-8 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5">
            <p className="section-label">Guild Hall</p>
            <h1 className="headline-gradient text-5xl font-black tracking-tight md:text-7xl">
              Build a team identity around learning.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Guilds now show richer detail: member roster, leader identity, current progress, and your guild status.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ['Active guilds', `${guilds.length}`],
                ['Your guild', userGuild?.name || 'None yet'],
                ['Top reward', 'Shared progression'],
              ].map(([label, value]) => (
                <div key={label} className="panel rounded-[24px] p-4">
                  <p className="section-label mb-2">{label}</p>
                  <p className="text-xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel rounded-[30px] p-6">
            <div className="mb-5 flex items-center justify-between">
              <p className="section-label">Found a squad?</p>
              <button
                type="button"
                onClick={() => setShowCreateForm((value) => !value)}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white/15"
              >
                {showCreateForm ? 'Close form' : 'Create guild'}
              </button>
            </div>

            {showCreateForm ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={guildName}
                  onChange={(event) => setGuildName(event.target.value)}
                  placeholder="Guild name"
                  className="w-full rounded-[20px] border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/20"
                />
                <textarea
                  value={guildDescription}
                  onChange={(event) => setGuildDescription(event.target.value)}
                  placeholder="Describe the guild vibe"
                  rows={4}
                  className="w-full rounded-[20px] border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/20"
                />
                <button
                  type="button"
                  onClick={handleCreateGuild}
                  disabled={!guildName.trim() || !user || loading}
                  className="rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-400 px-6 py-3 text-sm font-black uppercase tracking-[0.22em] text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Launch guild'}
                </button>
              </div>
            ) : selectedGuildRecord ? (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="section-label mb-3">Selected guild</p>
                <h2 className="text-3xl font-black text-white">{selectedGuildRecord.name}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {selectedGuildRecord.description || 'No description yet.'}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[18px] border border-white/10 bg-slate-950/40 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Members</p>
                    <p className="mt-2 text-xl font-black text-white">{selectedGuildRecord.memberCount}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-slate-950/40 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">XP</p>
                    <p className="mt-2 text-xl font-black text-white">{selectedGuildRecord.xp}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/10 bg-slate-950/40 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Leader</p>
                    <p className="mt-2 text-xl font-black text-white">{resolvedLeader}</p>
                  </div>
                </div>
                <div className="mt-5 rounded-[22px] border border-white/10 bg-slate-950/40 p-4">
                  <p className="section-label mb-3">Member roster</p>
                  <div className="space-y-2">
                    {selectedMembers.length > 0 ? (
                      selectedMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between rounded-[18px] bg-white/5 px-3 py-2">
                          <span className="font-semibold text-white">{member.username}</span>
                          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{member.heroClass}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400">Member names will appear here as backend users join.</p>
                    )}
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[22px] border border-white/10 bg-slate-950/40 p-4">
                    <p className="section-label mb-3">Guild rewards</p>
                    <div className="space-y-2">
                      {(selectedGuildRecord.rewards || []).length > 0 ? (
                        selectedGuildRecord.rewards?.map((reward) => (
                          <div key={reward} className="rounded-[18px] bg-white/5 px-3 py-2 text-sm text-white">
                            {reward}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">Reach higher guild levels to unlock rewards.</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-slate-950/40 p-4">
                    <p className="section-label mb-3">Guild achievements</p>
                    <div className="space-y-2">
                      {(selectedGuildRecord.achievements || []).length > 0 ? (
                        selectedGuildRecord.achievements?.map((achievement) => (
                          <div key={achievement} className="rounded-[18px] bg-white/5 px-3 py-2 text-sm text-white">
                            {achievement}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">Complete raids and grow the roster to earn achievements.</p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleJoinGuild(selectedGuildRecord.id)}
                  disabled={loading}
                  className="mt-5 rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 px-6 py-3 text-sm font-black uppercase tracking-[0.22em] text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Join guild'}
                </button>
              </div>
            ) : (
              <p className="text-sm leading-7 text-slate-300">
                Pick a guild card below to inspect it, or open the form to create a new one.
              </p>
            )}

            {notice && (
              <div className="mt-5 rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                {notice}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {guilds.map((guild) => (
          <button
            type="button"
            key={guild.id}
            onClick={() => setSelectedGuild(guild.id)}
            className={`panel mesh-card animate-lift-in rounded-[28px] p-6 text-left transition duration-500 hover:-translate-y-1 ${
              selectedGuild === guild.id ? 'border-cyan-300/40 shadow-[0_20px_60px_rgba(34,211,238,0.15)]' : ''
            }`}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="section-label mb-2">Guild</p>
                <h2 className="text-3xl font-black text-white">{guild.name}</h2>
              </div>
              <div className="rounded-3xl bg-gradient-to-br from-cyan-300 to-sky-500 p-4 text-3xl shadow-2xl">
                🏛️
              </div>
            </div>
            <p className="text-sm leading-7 text-slate-300">
              {guild.description || 'A guild built for competitive learners.'}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-[18px] border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Members</p>
                <p className="mt-2 text-lg font-black text-white">{guild.memberCount}</p>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">XP</p>
                <p className="mt-2 text-lg font-black text-white">{guild.xp}</p>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Level</p>
                <p className="mt-2 text-lg font-black text-white">{guild.level}</p>
              </div>
            </div>
          </button>
        ))}
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

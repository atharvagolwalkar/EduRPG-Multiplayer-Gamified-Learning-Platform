'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { HPBar } from '@/components/HPBar';
import { QuestionCard } from '@/components/QuestionCard';
import { StreakCounter } from '@/components/BattleEffects';
import { HERO_STATS, calculateDamage, generateMockQuestions, getAdaptiveDifficulty } from '@/lib/gameEngine';
import { useGameStore } from '@/lib/store';
import { useMultiplayerRaid } from '@/lib/useMultiplayer';
import { useRaid } from '@/lib/useAPI';
import { getMasterySummary } from '@/lib/progression';

type RaidPlayer = {
  id: string;
  username?: string;
  guildId?: string;
};

type RaidSyncPayload = {
  raid: {
    id: string;
    players: RaidPlayer[];
    monsterName: string;
    monsterHp: number;
    monsterMaxHp: number;
    teamHp: number;
    teamMaxHp: number;
    streak: number;
    status: string;
    playerProgress?: Record<string, { damageDealt: number; correctAnswers: number }>;
  };
  message?: string;
};

type RaidDamagePayload = RaidSyncPayload & {
  type: 'player-attack' | 'monster-attack';
  damage: number;
  playerId?: string;
};

type RaidEndPayload = {
  status: 'victory' | 'defeat';
  xpReward: number;
  totalDamage: number;
  correctAnswers: number;
  raid: RaidSyncPayload['raid'];
};

function generateRaidCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type DungeonMasterBeat = {
  narration: string;
  hint: string;
  explanation: string;
  source: 'fallback' | 'openai';
};

export default function RaidPage() {
  const { user, raid, setRaid, resetRaid } = useGameStore();
  const { startRaid: startRaidAPI, getRaid } = useRaid();
  const { socket, connected, joinRaid, submitAnswer } = useMultiplayerRaid(raid.raidId);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'correct' | 'wrong' | 'result' | 'info' | null>(null);
  const [raidActive, setRaidActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [raidCodeInput, setRaidCodeInput] = useState('');
  const [raidSummary, setRaidSummary] = useState<RaidEndPayload | null>(null);
  const [dungeonBeat, setDungeonBeat] = useState<DungeonMasterBeat | null>(null);
  const [loadingDungeonBeat, setLoadingDungeonBeat] = useState(false);
  const [awaitingNextQuestion, setAwaitingNextQuestion] = useState(false);
  const joinedRaidRef = useRef<string | null>(null);
  const playerProgress = raid.players.map((player) => ({
    ...player,
    progress: raid.playerProgress?.[player.id] || { damageDealt: 0, correctAnswers: 0 },
  }));

  useEffect(() => {
    if (!connected || !user || !raid.raidId || joinedRaidRef.current === raid.raidId) {
      return;
    }

    joinRaid({
      id: user.id,
      username: user.username,
      guildId: user.guildId,
    });
    joinedRaidRef.current = raid.raidId;
  }, [connected, joinRaid, raid.raidId, user]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleSync = (payload: RaidSyncPayload) => {
      setRaid({
        raidId: payload.raid.id,
        players: payload.raid.players.map((player) => ({
          id: player.id,
          username: player.username || player.id,
          heroClass: user?.heroClass || 'mage',
          level: 1,
          xp: 0,
          guildId: player.guildId,
        })),
        monsterHp: payload.raid.monsterHp,
        playerHp: payload.raid.teamHp,
        streak: payload.raid.streak,
        isActive: payload.raid.status === 'active',
        playerProgress: payload.raid.playerProgress,
      });
      if (payload.message) {
        setFeedbackType('info');
        setFeedbackMessage(payload.message);
      }
    };

    const handlePlayerJoined = (payload: RaidSyncPayload) => {
      handleSync(payload);
      setFeedbackType('info');
      setFeedbackMessage(payload.message || 'Raid roster updated.');
    };

    const handleDamage = (payload: RaidDamagePayload) => {
      handleSync(payload);
      setFeedbackType(payload.type === 'player-attack' ? 'correct' : 'wrong');
      setFeedbackMessage(payload.message || 'Raid state updated.');
      // Disable all players' buttons while waiting for next question
      setAwaitingNextQuestion(true);
    };

    const handleRaidEnd = (payload: RaidEndPayload) => {
      handleSync({ raid: payload.raid });
      setRaidSummary(payload);
      setRaidActive(false);
      setFeedbackType('result');
      setFeedbackMessage(
        payload.status === 'victory'
          ? `Victory. Everyone earned ${payload.xpReward} XP.`
          : 'The raid ended in defeat. Regroup and try again.'
      );
      joinedRaidRef.current = null;
    };

    const handlePlayerLeft = (payload: { message?: string }) => {
      setFeedbackType('info');
      setFeedbackMessage(payload.message || 'A player left the raid.');
    };

    socket.on('raid:sync', handleSync);
    socket.on('raid:player-joined', handlePlayerJoined);
    socket.on('raid:damage', handleDamage);
    socket.on('raid:end', handleRaidEnd);
    socket.on('raid:player-left', handlePlayerLeft);

    return () => {
      socket.off('raid:sync', handleSync);
      socket.off('raid:player-joined', handlePlayerJoined);
      socket.off('raid:damage', handleDamage);
      socket.off('raid:end', handleRaidEnd);
      socket.off('raid:player-left', handlePlayerLeft);
    };
  }, [setRaid, socket, user?.heroClass]);

  if (!user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-8">
        <div className="panel rounded-[30px] p-8 text-center">
          <p className="text-lg text-slate-300">Create a hero on the home page before entering the arena.</p>
          <Link href="/" className="mt-6 inline-flex rounded-full bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15">
            Back home
          </Link>
        </div>
      </main>
    );
  }

  const masterySummary = getMasterySummary(user);
  const preferredSubject = HERO_STATS[user.heroClass].subject;
  const adaptiveDifficulty = getAdaptiveDifficulty(masterySummary[preferredSubject], user.level);
  const questions = generateMockQuestions(adaptiveDifficulty, preferredSubject);

  const syncRaidState = (raidData: Awaited<ReturnType<typeof getRaid>>) => {
    if (!raidData) {
      return;
    }

    setRaid({
      raidId: raidData.id,
      players: (raidData.players || []).map((player) => ({
        id: player.id,
        username: player.username || player.id,
        heroClass: player.id === user.id ? user.heroClass : user.heroClass,
        level: 1,
        xp: 0,
        guildId: player.guildId,
      })),
      monsterHp: raidData.monsterHp,
      playerHp: raidData.teamHp,
      streak: raidData.streak,
      isActive: raidData.status === 'active',
      playerProgress: raidData.playerProgress,
    });
  };

  const startRaid = async () => {
    setLoading(true);
    setFeedbackMessage('');
    resetRaid();
    setRaidSummary(null);
    setDungeonBeat(null);

    try {
      const heroStats = HERO_STATS[user.heroClass];
      const raidCode = generateRaidCode();
      const remoteRaid = await startRaidAPI({
        raidId: raidCode,
        leaderId: user.id,
        difficulty: 'medium',
        monsterHp: 100,
        teamHp: heroStats.maxHp,
        players: [{ id: user.id, username: user.username, guildId: user.guildId }],
        monsterName: 'Calculus Titan',
      });

      syncRaidState(remoteRaid);
      setRaidCodeInput(raidCode);
      setCurrentQuestionIndex(0);
      setRaidActive(true);
      setFeedbackType('info');
      setFeedbackMessage(`Raid ${raidCode} created. Share this code so teammates can join.`);
    } catch (error) {
      console.error('Error starting raid:', error);
      setFeedbackType('wrong');
      setFeedbackMessage('The raid could not start. Make sure the backend server is available on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const joinExistingRaid = async () => {
    if (!raidCodeInput.trim()) {
      return;
    }

    setLoading(true);
    setFeedbackMessage('');
    setRaidSummary(null);
    setDungeonBeat(null);

    try {
      const existingRaid = await getRaid(raidCodeInput.trim().toUpperCase());
      if (!existingRaid) {
        setFeedbackType('wrong');
        setFeedbackMessage('No raid was found for that code.');
        return;
      }

      syncRaidState(existingRaid);
      setCurrentQuestionIndex(0);
      setRaidActive(true);
      setFeedbackType('info');
      setFeedbackMessage(`Joined raid ${existingRaid.id}. Waiting for live sync.`);
    } catch (error) {
      console.error('Error joining raid:', error);
      setFeedbackType('wrong');
      setFeedbackMessage('Could not join that raid right now.');
    } finally {
      setLoading(false);
    }
  };


  const fetchDungeonBeat = async (params: {
    isCorrect: boolean;
    streak: number;
    subject: string;
    concept: string;
    difficulty: number;
  }) => {
    setLoadingDungeonBeat(true);
    try {
      const response = await fetch(`${API_URL}/api/ai/dungeon-master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, heroClass: user.heroClass }),
      });
      const data = await response.json();
      if (data?.success && data.beat) {
        setDungeonBeat(data.beat);
      } else if (data?.beat) {
        // Handle case where response doesn't have success flag
        setDungeonBeat(data.beat);
      } else {
        console.warn('Unexpected dungeon master response:', data);
      }
    } catch (error) {
      console.error('Failed to load Dungeon Master beat:', error);
      // Leave previous DM response visible, don't error
    } finally {
      setLoadingDungeonBeat(false);
    }
  };

  const handleAnswer = (selectedIndex: number) => {
    const question = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === question.correctIndex;
    const result = calculateDamage(user.heroClass, isCorrect, raid.streak);
    const nextStreak = isCorrect ? raid.streak + 1 : 0;

    submitAnswer(isCorrect, result.damage, nextStreak, question.subject, question.concept);

    setFeedbackType(isCorrect ? 'correct' : 'wrong');
    setFeedbackMessage(
      isCorrect
        ? `Correct. ${question.explanation}`
        : `Incorrect. ${question.explanation}`
    );

    fetchDungeonBeat({
      isCorrect,
      streak: nextStreak,
      subject: question.subject,
      concept: question.concept,
      difficulty: question.difficulty,
    });

    window.setTimeout(() => {
      setFeedbackMessage('');
      setFeedbackType(null);
      setAwaitingNextQuestion(false);
      setCurrentQuestionIndex((value) => (value + 1 < questions.length ? value + 1 : 0));
    }, 900);
  };

  const statusTone =
    feedbackType === 'correct'
      ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
      : feedbackType === 'wrong'
        ? 'border-rose-300/30 bg-rose-400/10 text-rose-100'
        : feedbackType === 'result'
          ? 'border-amber-300/30 bg-amber-300/10 text-amber-50'
          : 'border-cyan-300/30 bg-cyan-400/10 text-cyan-50';

  if (!raidActive) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <section className="panel-strong mesh-card animate-lift-in rounded-[36px] p-8 md:p-10">
          <div className="mb-6 flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              ← Back Home
            </Link>
            <p className="text-slate-400">|</p>
            <p className="section-label">Raid Arena</p>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <h1 className="headline-gradient text-5xl font-black tracking-tight md:text-7xl">
                Real squad raids with shareable room codes.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Create a raid, share the code with teammates, and let the backend socket room keep every player synced.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Boss', 'Calculus Titan'],
                  ['Hero', user.username],
                  ['Class', user.heroClass],
                  ['Socket', connected ? 'Live' : 'Connecting'],
                  ['Adaptive tier', `${adaptiveDifficulty}`],
                  ['Focus subject', preferredSubject],
                ].map(([label, value]) => (
                  <div key={label} className="panel rounded-[24px] p-4">
                    <p className="section-label mb-2">{label}</p>
                    <p className="text-xl font-black text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="panel rounded-[30px] p-6">
                <p className="section-label mb-4">Create a room</p>
                <p className="mb-4 text-sm leading-7 text-slate-300">
                  Start a fresh raid and get a shareable code for your team.
                </p>
                <button
                  type="button"
                  onClick={startRaid}
                  disabled={loading}
                  className="rounded-full bg-gradient-to-r from-rose-400 via-orange-400 to-amber-300 px-7 py-4 text-sm font-black uppercase tracking-[0.24em] text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Opening arena...' : 'Create raid'}
                </button>
              </div>

              <div className="panel rounded-[30px] p-6">
                <p className="section-label mb-4">Join a room</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={raidCodeInput}
                    onChange={(event) => setRaidCodeInput(event.target.value.toUpperCase())}
                    placeholder="Enter raid code"
                    className="w-full rounded-[20px] border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/20"
                  />
                  <button
                    type="button"
                    onClick={joinExistingRaid}
                    disabled={loading || !raidCodeInput.trim()}
                    className="rounded-full border border-white/10 bg-white/10 px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Join
                  </button>
                </div>
              </div>

              {feedbackMessage && (
                <div className={`rounded-[24px] border px-5 py-4 text-sm leading-7 ${statusTone}`}>
                  {feedbackMessage}
                </div>
              )}

              {raidSummary && (
                <div className="panel rounded-[30px] p-6">
                  <p className="section-label mb-4">Last raid summary</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                      <p className="text-xl font-black text-white capitalize">{raidSummary.status}</p>
                      <p className="mt-2 text-sm text-slate-400">Outcome</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                      <p className="text-xl font-black text-white">{raidSummary.xpReward}</p>
                      <p className="mt-2 text-sm text-slate-400">XP reward</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                      <p className="text-xl font-black text-white">{raidSummary.totalDamage}</p>
                      <p className="mt-2 text-sm text-slate-400">Total damage</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <section className="panel-strong animate-lift-in rounded-[36px] p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              ← Back Home
            </Link>
            <div>
              <p className="section-label mb-2">Live battle</p>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Calculus Titan</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-cyan-50">
              Raid code {raid.raidId}
            </div>
            <div className="rounded-full border border-amber-300/30 bg-amber-300/15 px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-amber-100">
              Question {currentQuestionIndex + 1} / {questions.length}
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="panel rounded-[28px] p-5">
            <HPBar label="Boss HP" current={raid.monsterHp} max={100} color="red" showAnimation />
          </div>
          <div className="panel rounded-[28px] p-5">
            <HPBar
              label="Team HP"
              current={raid.playerHp}
              max={HERO_STATS[user.heroClass].maxHp}
              color="green"
              showAnimation
            />
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {Object.entries(masterySummary).map(([subject, score]) => (
            <div key={subject} className="panel rounded-[22px] p-4">
              <p className="section-label mb-2">{subject}</p>
              <p className="text-xl font-black text-white">{score}%</p>
            </div>
          ))}
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <StreakCounter streak={raid.streak} />

            {feedbackMessage && (
              <div className={`mb-6 rounded-[24px] border px-5 py-4 text-sm font-semibold leading-7 ${statusTone}`}>
                {feedbackMessage}
              </div>
            )}

            <QuestionCard
              question={questions[currentQuestionIndex]}
              onAnswer={handleAnswer}
              disabled={!connected || awaitingNextQuestion || Boolean(feedbackMessage && (feedbackType === 'correct' || feedbackType === 'wrong'))}
            />

            <div className="panel mt-5 rounded-[24px] p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="section-label">AI Dungeon Master</p>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{dungeonBeat?.source || 'offline'} mode</span>
              </div>
              {loadingDungeonBeat ? (
                <p className="text-sm text-slate-300">The Dungeon Master is preparing your next tactical note...</p>
              ) : dungeonBeat ? (
                <div className="space-y-2 text-sm text-slate-200">
                  <p><span className="font-bold text-cyan-100">Narration:</span> {dungeonBeat.narration}</p>
                  <p><span className="font-bold text-emerald-100">Hint:</span> {dungeonBeat.hint}</p>
                  <p><span className="font-bold text-amber-100">Explain:</span> {dungeonBeat.explanation}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-300">Answer a question to receive live narration, hints, and mini explanations.</p>
              )}
            </div>
          </div>

          <div className="panel rounded-[28px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="section-label">Squad roster</p>
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">
                {raid.players.length} players
              </span>
            </div>
            <div className="space-y-3">
              {playerProgress.map((player) => (
                <div key={player.id} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-white">
                        {player.username || player.id}
                        {player.id === user.id ? ' (You)' : ''}
                      </p>
                      <p className="text-sm text-slate-400">{player.guildId ? `Guild ${player.guildId}` : 'No guild'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-200">{player.progress.damageDealt} dmg</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {player.progress.correctAnswers} correct
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

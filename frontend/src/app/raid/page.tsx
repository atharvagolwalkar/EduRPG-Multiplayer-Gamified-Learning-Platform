'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { HPBar } from '@/components/HPBar';
import { QuestionCard } from '@/components/QuestionCard';
import { StreakCounter } from '@/components/BattleEffects';
import { HERO_STATS, calculateDamage, generateMockQuestions } from '@/lib/gameEngine';
import { useGameStore } from '@/lib/store';
import { useRaid } from '@/lib/useAPI';

export default function RaidPage() {
  const { user, raid, setRaid, updateMonsterHp, updatePlayerHp, incrementStreak, resetRaid } = useGameStore();
  const { startRaid: startRaidAPI } = useRaid();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'correct' | 'wrong' | 'result' | null>(null);
  const [raidActive, setRaidActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const questions = useMemo(() => generateMockQuestions(5), []);

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

  const startRaid = async () => {
    setLoading(true);
    setFeedbackMessage('');
    resetRaid();

    try {
      const heroStats = HERO_STATS[user.heroClass];
      const remoteRaid = await startRaidAPI({
        leaderId: user.id,
        difficulty: 'medium',
        monsterHp: 100,
        teamHp: heroStats.maxHp,
        players: [{ id: user.id, username: user.username }],
        monsterName: 'Calculus Titan',
      });

      setRaid({
        raidId: remoteRaid.id,
        players: [user],
        monsterHp: remoteRaid.monsterHp,
        playerHp: heroStats.maxHp,
        streak: 0,
        timeRemaining: 300,
        isActive: true,
      });
      setCurrentQuestionIndex(0);
      setRaidActive(true);
    } catch (error) {
      console.error('Error starting raid:', error);
      setFeedbackType('wrong');
      setFeedbackMessage('The raid could not start. Make sure the backend server is available on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (selectedIndex: number) => {
    const question = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === question.correctIndex;
    const result = calculateDamage(user.heroClass, isCorrect, raid.streak);
    const nextMonsterHp = Math.max(0, raid.monsterHp - result.damage);
    const nextPlayerHp = Math.max(0, raid.playerHp - 20);

    if (isCorrect) {
      updateMonsterHp(nextMonsterHp);
      incrementStreak();
      setFeedbackType(nextMonsterHp === 0 ? 'result' : 'correct');
      setFeedbackMessage(
        nextMonsterHp === 0
          ? `Raid cleared. You dealt ${result.damage} final damage${result.isCritical ? ' with a critical strike.' : '.'}`
          : `Correct answer. You dealt ${result.damage} damage${result.isCritical ? ' and landed a critical hit.' : '.'}`
      );
    } else {
      updatePlayerHp(nextPlayerHp);
      setRaid({ streak: 0 });
      setFeedbackType(nextPlayerHp === 0 ? 'result' : 'wrong');
      setFeedbackMessage(
        nextPlayerHp === 0
          ? 'Your team was defeated. Reset and try another run.'
          : 'Wrong answer. The boss retaliates for 20 damage.'
      );
    }

    const battleEnded = nextMonsterHp === 0 || nextPlayerHp === 0 || currentQuestionIndex === questions.length - 1;

    window.setTimeout(() => {
      if (battleEnded) {
        setRaidActive(false);
        setRaid({ isActive: false });
        return;
      }

      setCurrentQuestionIndex((value) => value + 1);
      setFeedbackMessage('');
      setFeedbackType(null);
    }, 1400);
  };

  if (!raidActive) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
        <section className="panel-strong mesh-card animate-lift-in rounded-[36px] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <p className="section-label">Raid Arena</p>
              <h1 className="headline-gradient text-5xl font-black tracking-tight md:text-7xl">
                Multiplayer feel, solo-ready demo flow.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                This mode launches a local boss fight using the backend raid endpoint, then runs a playable question loop in the UI.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Boss', 'Calculus Titan'],
                  ['Hero', user.username],
                  ['Class', user.heroClass],
                  ['Base HP', `${HERO_STATS[user.heroClass].maxHp}`],
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
                <p className="section-label mb-4">Mission rules</p>
                <div className="space-y-3 text-sm leading-7 text-slate-300">
                  <p>Answer correctly to damage the boss and build a streak multiplier.</p>
                  <p>Wrong answers cost health, so speed without accuracy will punish the run.</p>
                  <p>The backend stores the raid start even in local mock mode.</p>
                </div>
              </div>

              <div className="panel rounded-[30px] p-6">
                <p className="section-label mb-4">Rewards preview</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ['100 XP', 'Victory bonus'],
                    ['Streak', 'Higher burst damage'],
                    ['Practice', 'Playable demo loop'],
                  ].map(([value, label]) => (
                    <div key={value} className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                      <p className="text-xl font-black text-white">{value}</p>
                      <p className="mt-2 text-sm text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {feedbackMessage && (
                <div className={`rounded-[24px] border px-5 py-4 text-sm leading-7 ${
                  feedbackType === 'wrong'
                    ? 'border-rose-300/30 bg-rose-400/10 text-rose-100'
                    : 'border-cyan-300/30 bg-cyan-400/10 text-cyan-50'
                }`}>
                  {feedbackMessage}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={startRaid}
                  disabled={loading}
                  className="rounded-full bg-gradient-to-r from-rose-400 via-orange-400 to-amber-300 px-7 py-4 text-sm font-black uppercase tracking-[0.24em] text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Opening arena...' : 'Start raid'}
                </button>
                <Link
                  href="/"
                  className="rounded-full border border-white/10 bg-white/10 px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:border-white/20 hover:bg-white/15"
                >
                  Back home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <section className="panel-strong animate-lift-in rounded-[36px] p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-label mb-2">Live battle</p>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Calculus Titan</h1>
          </div>
          <div className="rounded-full border border-amber-300/30 bg-amber-300/15 px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-amber-100">
            Question {currentQuestionIndex + 1} / {questions.length}
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="panel rounded-[28px] p-5">
            <HPBar label="Boss HP" current={raid.monsterHp} max={100} color="red" showAnimation />
          </div>
          <div className="panel rounded-[28px] p-5">
            <HPBar
              label={`${user.username} HP`}
              current={raid.playerHp}
              max={HERO_STATS[user.heroClass].maxHp}
              color="green"
              showAnimation
            />
          </div>
        </div>

        <StreakCounter streak={raid.streak} />

        {feedbackMessage && (
          <div
            className={`mb-6 rounded-[24px] border px-5 py-4 text-sm font-semibold leading-7 ${
              feedbackType === 'correct'
                ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
                : feedbackType === 'wrong'
                  ? 'border-rose-300/30 bg-rose-400/10 text-rose-100'
                  : 'border-amber-300/30 bg-amber-300/10 text-amber-50'
            }`}
          >
            {feedbackMessage}
          </div>
        )}

        {currentQuestionIndex < questions.length && raid.playerHp > 0 && raid.monsterHp > 0 && (
          <QuestionCard
            question={questions[currentQuestionIndex]}
            onAnswer={handleAnswer}
            disabled={Boolean(feedbackMessage)}
          />
        )}
      </section>
    </main>
  );
}

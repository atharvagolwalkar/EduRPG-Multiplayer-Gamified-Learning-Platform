'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { HPBar } from '@/components/HPBar';
import { QuestionCard } from '@/components/QuestionCard';
import { StreakCounter } from '@/components/BattleEffects';
import { generateMockQuestions, calculateDamage, HERO_STATS } from '@/lib/gameEngine';
import Link from 'next/link';

export default function RaidPage() {
  const { user, raid, setRaid, updateMonsterHp, updatePlayerHp, incrementStreak } = useGameStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState(generateMockQuestions(1));
  const [raidActive, setRaidActive] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [players, setPlayers] = useState<any[]>([]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Link href="/" className="text-white">
          Go back home
        </Link>
      </div>
    );
  }

  const startRaid = () => {
    setRaidActive(true);
    const heroStats = HERO_STATS[user.heroClass];
    setRaid({
      raidId: Math.random().toString(36).substr(2, 9),
      monsterHp: 100,
      playerHp: heroStats.maxHp,
      streak: 0,
      timeRemaining: 180,
      isActive: true,
    });
    setPlayers([user]);
  };

  const handleAnswer = (selectedIndex: number) => {
    const question = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === question.correctIndex;
    const result = calculateDamage(user.heroClass, isCorrect, raid.streak);

    if (isCorrect) {
      updateMonsterHp(raid.monsterHp - result.damage);
      incrementStreak();
      setFeedbackMessage(`✓ Correct! +${result.damage} ${result.isCritical ? '⚡ CRITICAL' : ''}`);
    } else {
      updatePlayerHp(raid.playerHp - 20);
      setRaid({ ...raid, streak: 0 });
      setFeedbackMessage('✗ Wrong answer! Monster attacks you!');
    }

    // Move to next question
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setFeedbackMessage('');
      } else {
        setRaidActive(false);
        setFeedbackMessage(raid.monsterHp <= 0 ? '🎉 Raid Victory!' : '💀 Raid Defeat!');
      }
    }, 1500);
  };

  if (!raidActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-8">⚔️ Multiplayer Raid</h1>

          <div className="bg-gray-800 rounded-lg p-8 mb-8 border-2 border-gray-600">
            <p className="text-gray-300 mb-6">
              Form a team of 3-5 players to defeat the boss monster! Each correct answer
              deals damage. Work together to win!
            </p>

            <button
              onClick={startRaid}
              className="bg-gradient-to-r from-red-600 to-red-900 hover:shadow-lg text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Start Solo Raid (Demo)
            </button>
          </div>

          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Battle in Progress</h1>
          <div className="text-2xl font-bold text-yellow-400">⏱️ {raid.timeRemaining}s</div>
        </div>

        {/* Battle Arena */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Your Stats */}
          <div className="bg-gray-800 rounded-lg p-6 border-2 border-blue-500">
            <h2 className="text-2xl font-bold text-white mb-4">👤 Your Stats</h2>
            <HPBar
              label="Your Health"
              current={raid.playerHp}
              max={HERO_STATS[user.heroClass].maxHp}
              color="green"
            />
            <p className="text-gray-300 text-sm">
              <span className="font-semibold">{user.username}</span> - Level {user.level}
            </p>
          </div>

          {/* Monster Stats */}
          <div className="bg-gray-800 rounded-lg p-6 border-2 border-red-500">
            <h2 className="text-2xl font-bold text-white mb-4">👹 Boss Monster</h2>
            <HPBar
              label="Monster Health"
              current={raid.monsterHp}
              max={100}
              color="red"
            />
            <p className="text-gray-300 text-sm">
              <span className="font-semibold">Calculus Titan</span> - Boss
            </p>
          </div>
        </div>

        {/* Streak Counter */}
        <StreakCounter streak={raid.streak} />

        {/* Feedback */}
        {feedbackMessage && (
          <div
            className={`
              text-center mb-6 p-4 rounded-lg font-bold text-lg
              ${
                feedbackMessage.includes('Correct')
                  ? 'bg-green-900 text-green-200 border-2 border-green-500'
                  : 'bg-red-900 text-red-200 border-2 border-red-500'
              }
            `}
          >
            {feedbackMessage}
          </div>
        )}

        {/* Question */}
        {currentQuestionIndex < questions.length && (
          <>
            <div className="mb-4 text-gray-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <QuestionCard
              question={questions[currentQuestionIndex]}
              onAnswer={handleAnswer}
              disabled={feedbackMessage !== ''}
            />
          </>
        )}
      </div>
    </div>
  );
}

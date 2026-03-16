'use client';

import React from 'react';
import { useGameStore } from '@/lib/store';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useGameStore();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Link href="/" className="text-white">
          Go back home
        </Link>
      </div>
    );
  }

  const heroEmojis: Record<string, string> = {
    mage: '🔮',
    engineer: '⚙️',
    scientist: '🔬',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">👤 Profile</h1>
          <p className="text-gray-400">View your stats and progress</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-800 rounded-lg p-8 border-2 border-gray-600 mb-8">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{heroEmojis[user.heroClass]}</div>
            <h2 className="text-4xl font-bold text-white mb-2">{user.username}</h2>
            <p className="text-gray-300 capitalize">{user.heroClass} - Level {user.level}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm">Level</p>
              <p className="text-3xl font-bold text-white">{user.level}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm">Experience</p>
              <p className="text-3xl font-bold text-yellow-400">{user.xp}</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm">Raiders</p>
              <p className="text-3xl font-bold text-blue-400">0</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm">Wins</p>
              <p className="text-3xl font-bold text-green-400">0</p>
            </div>
          </div>

          {/* Achievements */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">🏅 Achievements</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <span className="text-3xl">👋</span>
                <p className="text-xs text-gray-400 mt-2">First Steps</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center opacity-50">
                <span className="text-3xl">🔥</span>
                <p className="text-xs text-gray-400 mt-2">3-Streak</p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center opacity-50">
                <span className="text-3xl">🏆</span>
                <p className="text-xs text-gray-400 mt-2">Top 10</p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <Link
          href="/"
          className="text-gray-400 hover:text-white transition-colors font-semibold"
        >
          ← Back Home
        </Link>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { HeroCard } from '@/components/HeroCard';
import { HERO_STATS } from '@/lib/gameEngine';
import { useGameStore } from '@/lib/store';
import Link from 'next/link';

export default function Home() {
  const { user, setUser } = useGameStore();
  const [selectedHero, setSelectedHero] = useState<'mage' | 'engineer' | 'scientist' | null>(null);
  const [username, setUsername] = useState('');
  const [showHeroSelect, setShowHeroSelect] = useState(false);

  const handleHeroSelect = (heroClass: 'mage' | 'engineer' | 'scientist') => {
    setSelectedHero(heroClass);
  };

  const handleStartGame = () => {
    if (username && selectedHero) {
      setUser({
        id: Math.random().toString(36).substr(2, 9),
        username,
        level: 1,
        xp: 0,
        heroClass: selectedHero,
      });
      setShowHeroSelect(false);
    }
  };

  if (user && !showHeroSelect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-2">⚔️ EduRPG</h1>
            <p className="text-gray-300">Welcome, {user.username}!</p>
            <p className="text-sm text-gray-400">
              Level {user.level} • {user.xp} XP • {user.heroClass}
            </p>
          </div>

          {/* Main Menu */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Start Raid */}
            <Link
              href="/raid"
              className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-red-600 to-red-900 p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="relative z-10">
                <div className="text-5xl mb-4">⚔️</div>
                <h2 className="text-3xl font-bold text-white mb-2">Start Raid</h2>
                <p className="text-gray-200">
                  Form a team and defeat monsters together!
                </p>
              </div>
              <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            </Link>

            {/* Guild */}
            <Link
              href="/guild"
              className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 to-blue-900 p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="relative z-10">
                <div className="text-5xl mb-4">🏛️</div>
                <h2 className="text-3xl font-bold text-white mb-2">Guild</h2>
                <p className="text-gray-200">
                  Join or create a guild with other students
                </p>
              </div>
            </Link>

            {/* Leaderboard */}
            <Link
              href="/leaderboard"
              className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-900 p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="relative z-10">
                <div className="text-5xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold text-white mb-2">Leaderboard</h2>
                <p className="text-gray-200">
                  See how you rank against other students
                </p>
              </div>
            </Link>

            {/* Profile */}
            <Link
              href="/profile"
              className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-600 to-purple-900 p-8 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              <div className="relative z-10">
                <div className="text-5xl mb-4">👤</div>
                <h2 className="text-3xl font-bold text-white mb-2">Profile</h2>
                <p className="text-gray-200">
                  View your stats and achievements
                </p>
              </div>
            </Link>
          </div>

          {/* Change Hero Button */}
          <button
            onClick={() => setShowHeroSelect(true)}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
          >
            Change Hero
          </button>
        </div>
      </div>
    );
  }

  // Hero Selection Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">⚔️ EduRPG</h1>
          <p className="text-2xl text-gray-300">Choose Your Hero</p>
          <p className="text-gray-400 mt-2">
            Select a character class and embark on your learning adventure
          </p>
        </div>

        {!user ? (
          <>
            {/* Username Input */}
            <div className="mb-8 max-w-md mx-auto">
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Hero Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <HeroCard
                name="Mage"
                class="mage"
                stats={HERO_STATS.mage}
                selected={selectedHero === 'mage'}
                onSelect={() => handleHeroSelect('mage')}
              />
              <HeroCard
                name="Engineer"
                class="engineer"
                stats={HERO_STATS.engineer}
                selected={selectedHero === 'engineer'}
                onSelect={() => handleHeroSelect('engineer')}
              />
              <HeroCard
                name="Scientist"
                class="scientist"
                stats={HERO_STATS.scientist}
                selected={selectedHero === 'scientist'}
                onSelect={() => handleHeroSelect('scientist')}
              />
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartGame}
              disabled={!selectedHero || !username}
              className={`
                w-full py-4 rounded-lg font-bold text-lg transition-all duration-200
                ${
                  selectedHero && username
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg cursor-pointer'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {selectedHero && username ? 'Start Adventure' : 'Select Hero & Enter Username'}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

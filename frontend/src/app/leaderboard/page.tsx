'use client';

import React from 'react';
import Link from 'next/link';

const mockLeaderboard = [
  { rank: 1, username: 'ShadowMage', xp: 5420, level: 12, guild: 'Elite Squad' },
  { rank: 2, username: 'CodeNinja', xp: 4980, level: 11, guild: 'Debug Hackers' },
  { rank: 3, username: 'MathChampion', xp: 4650, level: 10, guild: 'Equation Solvers' },
  { rank: 4, username: 'PhysicsWizard', xp: 4320, level: 10, guild: 'Force Multipliers' },
  { rank: 5, username: 'DataScience', xp: 3980, level: 9, guild: 'Algorithm Kings' },
  { rank: 6, username: 'ByteHunter', xp: 3650, level: 9, guild: 'Elite Squad' },
  { rank: 7, username: 'LogicMaster', xp: 3420, level: 8, guild: 'Debug Hackers' },
  { rank: 8, username: 'ProofSeeker', xp: 3120, level: 8, guild: 'Equation Solvers' },
  { rank: 9, username: 'SpeedRunner', xp: 2890, level: 7, guild: 'Force Multipliers' },
  { rank: 10, username: 'TruthFinder', xp: 2650, level: 7, guild: 'Algorithm Kings' },
];

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">🏆 Leaderboard</h1>
          <p className="text-gray-400">Top students by experience points</p>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <th className="px-6 py-4 text-left">#</th>
                <th className="px-6 py-4 text-left">Player</th>
                <th className="px-6 py-4 text-center">Level</th>
                <th className="px-6 py-4 text-center">XP</th>
                <th className="px-6 py-4 text-left">Guild</th>
              </tr>
            </thead>
            <tbody>
              {mockLeaderboard.map((entry, index) => (
                <tr
                  key={entry.rank}
                  className={`
                    border-t border-gray-700 transition-colors duration-200 hover:bg-gray-700
                    ${index < 3 ? 'bg-gray-750' : 'bg-gray-800'}
                  `}
                >
                  <td className="px-6 py-4">
                    <span className="text-2xl font-bold">
                      {entry.rank === 1 && '🥇'}
                      {entry.rank === 2 && '🥈'}
                      {entry.rank === 3 && '🥉'}
                      {entry.rank > 3 && entry.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white font-semibold">{entry.username}</td>
                  <td className="px-6 py-4 text-center text-gray-300">
                    <span className="bg-purple-700 px-3 py-1 rounded-full">{entry.level}</span>
                  </td>
                  <td className="px-6 py-4 text-center text-yellow-400 font-bold">{entry.xp}</td>
                  <td className="px-6 py-4 text-gray-300">{entry.guild}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors font-semibold"
          >
            ← Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}

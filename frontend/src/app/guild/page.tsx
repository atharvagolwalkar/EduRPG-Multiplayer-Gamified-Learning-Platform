'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const mockGuilds = [
  { id: 1, name: 'Elite Squad', members: 28, xp: 45000, leader: 'ShadowMage' },
  { id: 2, name: 'Debug Hackers', members: 32, xp: 42000, leader: 'CodeNinja' },
  { id: 3, name: 'Equation Solvers', members: 18, xp: 35000, leader: 'MathChampion' },
  { id: 4, name: 'Force Multipliers', members: 22, xp: 38000, leader: 'PhysicsWizard' },
  { id: 5, name: 'Algorithm Kings', members: 25, xp: 41000, leader: 'DataScience' },
];

export default function GuildPage() {
  const [selectedGuild, setSelectedGuild] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">🏛️ Guilds</h1>
          <p className="text-gray-400">Join a community of learners or create your own</p>
        </div>

        {/* Create Guild Button */}
        <button
          className="w-full bg-gradient-to-r from-green-600 to-green-900 hover:shadow-lg text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 mb-8"
        >
          + Create New Guild
        </button>

        {/* Guild List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockGuilds.map((guild) => (
            <div
              key={guild.id}
              onClick={() => setSelectedGuild(guild.id)}
              className={`
                cursor-pointer p-6 rounded-lg border-2 transition-all duration-200 transform hover:scale-105
                ${
                  selectedGuild === guild.id
                    ? 'bg-blue-900 border-blue-400 shadow-lg'
                    : 'bg-gray-800 border-gray-600 hover:border-blue-400'
                }
              `}
            >
              <h3 className="text-2xl font-bold text-white mb-2">{guild.name}</h3>
              <p className="text-gray-300 mb-4">
                Led by <span className="font-semibold">{guild.leader}</span>
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-400">Members</p>
                  <p className="text-xl font-bold text-white">{guild.members}</p>
                </div>
                <div>
                  <p className="text-gray-400">Guild XP</p>
                  <p className="text-xl font-bold text-yellow-400">{guild.xp}</p>
                </div>
              </div>

              {selectedGuild === guild.id && (
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded transition-colors">
                  Join Guild
                </button>
              )}
            </div>
          ))}
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

import React, { useState } from 'react';
import { useGameStore } from '@/lib/store';

interface HeroCardProps {
  name: string;
  class: 'mage' | 'engineer' | 'scientist';
  stats: { attackPower: number; defense: number; maxHp: number; skill: string };
  selected: boolean;
  onSelect: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  name,
  class: heroClass,
  stats,
  selected,
  onSelect,
}) => {
  const colors: Record<string, string> = {
    mage: 'from-purple-600 to-purple-900',
    engineer: 'from-blue-600 to-blue-900',
    scientist: 'from-green-600 to-green-900',
  };

  const emojis: Record<string, string> = {
    mage: '🔮',
    engineer: '⚙️',
    scientist: '🔬',
  };

  return (
    <div
      onClick={onSelect}
      className={`
        cursor-pointer transform transition-all duration-300 p-6 rounded-lg
        border-2 ${selected ? 'border-yellow-400' : 'border-gray-600'}
        bg-gradient-to-br ${colors[heroClass]}
        hover:scale-105 hover:shadow-xl
      `}
    >
      <div className="text-5xl mb-4">{emojis[heroClass]}</div>
      <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
      <p className="text-gray-200 text-sm capitalize mb-4">{heroClass}</p>
      
      <div className="space-y-2 text-sm text-gray-100">
        <div>⚔️ Attack: {stats.attackPower}</div>
        <div>🛡️ Defense: {stats.defense}</div>
        <div>❤️ HP: {stats.maxHp}</div>
        <div>✨ Skill: {stats.skill}</div>
      </div>

      {selected && (
        <div className="mt-4 text-yellow-300 font-bold animate-pulse">
          ✓ Selected
        </div>
      )}
    </div>
  );
};

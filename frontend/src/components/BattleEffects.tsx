import React from 'react';

interface DamageFloatProps {
  damage: number;
  isCritical: boolean;
  x: number;
  y: number;
}

export const DamageFloat: React.FC<DamageFloatProps> = ({
  damage,
  isCritical,
  x,
  y,
}) => {
  return (
    <div
      className={`
        fixed pointer-events-none font-bold
        ${isCritical ? 'text-yellow-400 text-2xl' : 'text-red-400 text-xl'}
        animate-bounce
      `}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        animation: 'float-up 1s ease-out forwards',
      }}
    >
      {isCritical && '⚡'} {damage}
    </div>
  );
};

export const StreakCounter: React.FC<{ streak: number }> = ({ streak }) => {
  if (streak < 2) return null;

  return (
    <div className="text-center mb-4">
      <div className="inline-block bg-yellow-500 text-black px-6 py-2 rounded-full font-bold text-lg animate-pulse">
        🔥 {streak} Streak Combo!
      </div>
    </div>
  );
};

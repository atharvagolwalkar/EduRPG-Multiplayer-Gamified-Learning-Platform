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
}) => (
  <div
    className={`pointer-events-none fixed font-black ${
      isCritical ? 'text-2xl text-amber-300' : 'text-xl text-rose-300'
    }`}
    style={{
      left: `${x}px`,
      top: `${y}px`,
      animation: 'float-up 1s ease-out forwards',
    }}
  >
    {isCritical ? '⚡' : ''} {damage}
  </div>
);

export const StreakCounter: React.FC<{ streak: number }> = ({ streak }) => {
  if (streak < 2) {
    return null;
  }

  return (
    <div className="mb-4 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-300/15 px-5 py-2 text-sm font-black uppercase tracking-[0.2em] text-amber-100">
        <span>🔥</span>
        <span>{streak} streak combo</span>
      </div>
    </div>
  );
};

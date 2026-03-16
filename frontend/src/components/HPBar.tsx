import React from 'react';

interface HPBarProps {
  current: number;
  max: number;
  label: string;
  color?: 'red' | 'green' | 'blue';
  showAnimation?: boolean;
}

const BAR_STYLES = {
  red: 'from-rose-500 via-red-500 to-orange-400',
  green: 'from-emerald-400 via-green-500 to-lime-400',
  blue: 'from-cyan-400 via-sky-500 to-indigo-500',
} as const;

export const HPBar: React.FC<HPBarProps> = ({
  current,
  max,
  label,
  color = 'red',
  showAnimation = false,
}) => {
  const percentage = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          {label}
        </span>
        <span className="text-sm font-bold text-white">
          {Math.max(0, current)}/{max}
        </span>
      </div>

      <div className="h-4 overflow-hidden rounded-full border border-white/10 bg-slate-950/70">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${BAR_STYLES[color]} transition-all duration-500 ${
            showAnimation ? 'animate-pulse' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {percentage < 25 && (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">
          Low health
        </p>
      )}
    </div>
  );
};

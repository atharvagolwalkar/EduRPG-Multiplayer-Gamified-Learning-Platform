import React from 'react';

interface HPBarProps {
  current: number;
  max: number;
  label: string;
  color?: 'red' | 'green' | 'blue';
  showAnimation?: boolean;
}

export const HPBar: React.FC<HPBarProps> = ({
  current,
  max,
  label,
  color = 'red',
  showAnimation = false,
}) => {
  const percentage = (current / max) * 100;
  const colorClasses: Record<string, string> = {
    red: 'bg-red-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white font-semibold">{label}</span>
        <span className="text-gray-300">
          {current}/{max}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-8 overflow-hidden border-2 border-gray-600">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500 ${
            showAnimation ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.max(0, percentage)}%` }}
        >
          <div className="h-full opacity-50 animate-pulse"></div>
        </div>
      </div>
      {percentage < 25 && (
        <p className="text-red-400 text-sm mt-1">⚠️ Low health!</p>
      )}
    </div>
  );
};

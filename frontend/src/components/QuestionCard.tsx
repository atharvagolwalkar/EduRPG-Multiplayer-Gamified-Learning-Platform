import React, { useState } from 'react';
import { Question } from '@/lib/gameEngine';

interface QuestionCardProps {
  question: Question;
  onAnswer: (selectedIndex: number) => void;
  disabled?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onAnswer,
  disabled = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="panel-strong mesh-card rounded-[30px] p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-label mb-2">Battle prompt</p>
          <h3 className="max-w-3xl text-2xl font-black leading-tight text-white md:text-3xl">
            {question.body}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100">
            Difficulty {question.difficulty}
          </span>
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-100">
            {question.subject}
          </span>
        </div>
      </div>

      <p className="mb-6 text-sm uppercase tracking-[0.2em] text-slate-400">
        Concept: {question.concept}
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {question.options.map((option, index) => {
          const isHovered = hoveredIndex === index;

          return (
            <button
              key={`${question.id}-${index}`}
              type="button"
              onClick={() => !disabled && onAnswer(index)}
              onMouseEnter={() => !disabled && setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              disabled={disabled}
              className={`rounded-[24px] border p-5 text-left transition duration-300 ${
                disabled
                  ? 'cursor-not-allowed border-slate-700 bg-slate-900/50 text-slate-500'
                  : isHovered
                    ? 'border-amber-300/60 bg-gradient-to-br from-amber-300/20 to-rose-300/10 text-white shadow-[0_16px_40px_rgba(251,191,36,0.18)]'
                    : 'border-white/10 bg-white/5 text-slate-100 hover:border-cyan-300/50 hover:bg-cyan-400/10'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-sm font-black text-cyan-100">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-base font-semibold leading-relaxed">{option}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

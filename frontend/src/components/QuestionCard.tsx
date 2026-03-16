import React from 'react';
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
  return (
    <div className="bg-gray-800 rounded-lg p-6 border-2 border-gray-600 mb-6">
      <h3 className="text-xl font-bold text-white mb-6">{question.body}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !disabled && onAnswer(index)}
            disabled={disabled}
            className={`
              p-4 rounded-lg font-semibold transition-all duration-200
              border-2 text-white
              ${
                disabled
                  ? 'bg-gray-700 border-gray-600 cursor-not-allowed opacity-60'
                  : 'bg-gray-700 border-gray-500 hover:border-blue-400 hover:bg-gray-600 cursor-pointer'
              }
            `}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

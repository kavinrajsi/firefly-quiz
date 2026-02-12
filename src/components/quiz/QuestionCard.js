'use client';

import Button from '@/components/ui/Button';

const optionColors = ['bg-kahoot-red', 'bg-kahoot-blue', 'bg-kahoot-yellow', 'bg-kahoot-green', 'bg-kahoot-purple'];
const optionShapes = ['triangle', 'diamond', 'circle', 'square'];

export default function QuestionCard({ question, index, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-kahoot-purple text-white text-xs font-bold px-2 py-1 rounded">
              Q{index + 1}
            </span>
            <span className="text-sm text-gray-500">{question.time_limit}s</span>
            {question.media_url && (
              <span className="text-sm text-gray-500">Has media</span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-3">{question.question_text}</h3>
          <div className="grid grid-cols-2 gap-2">
            {(question.options || []).map((opt, i) => (
              <div
                key={i}
                className={`
                  px-3 py-1.5 rounded text-sm text-white font-medium
                  ${optionColors[i]}
                  ${question.correct_option === i ? 'ring-2 ring-offset-1 ring-black/30' : 'opacity-70'}
                `}
              >
                {opt}
                {question.correct_option === i && ' ✓'}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <button
            onClick={() => onMoveUp?.(index)}
            disabled={isFirst}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            title="Move up"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => onMoveDown?.(index)}
            disabled={isLast}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
            title="Move down"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={() => onEdit?.(index)}
            className="p-1 text-blue-500 hover:text-blue-700"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete?.(index)}
            className="p-1 text-red-500 hover:text-red-700"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

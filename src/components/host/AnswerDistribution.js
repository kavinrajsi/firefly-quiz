'use client';

const barColors = ['bg-kahoot-red', 'bg-kahoot-blue', 'bg-kahoot-yellow', 'bg-kahoot-green', 'bg-kahoot-purple'];

export default function AnswerDistribution({ question, answers }) {
  const optCount = question.options.length;
  const counts = Array(optCount).fill(0);
  answers.forEach((a) => {
    if (a.selected_option >= 0 && a.selected_option < optCount) {
      counts[a.selected_option]++;
    }
  });
  const max = Math.max(...counts, 1);

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-700">Answer Distribution</h3>
      <div className="flex items-end gap-3 h-40">
        {counts.map((count, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-sm font-bold">{count}</span>
            <div
              className={`w-full ${barColors[i % barColors.length]} rounded-t transition-all duration-500 ${
                question.correct_option === i ? 'ring-2 ring-black/20' : ''
              }`}
              style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? '8px' : '0' }}
            />
            <span className="text-xs text-gray-500 text-center truncate w-full">
              {question.options[i]}
              {question.correct_option === i && ' ✓'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

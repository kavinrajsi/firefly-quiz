'use client';

const podiumColors = ['bg-yellow-400', 'bg-gray-300', 'bg-amber-600'];
const podiumLabels = ['1st', '2nd', '3rd'];

export default function LeaderboardDisplay({ participants, limit = 5, showPodium = false }) {
  const sorted = [...participants].sort((a, b) => b.score - a.score);
  const display = limit ? sorted.slice(0, limit) : sorted;

  if (showPodium && display.length >= 3) {
    return (
      <div className="space-y-6">
        {/* Podium top 3 */}
        <div className="flex items-end justify-center gap-4 pt-8">
          {[1, 0, 2].map((idx) => {
            const p = display[idx];
            if (!p) return null;
            const heights = ['h-32', 'h-24', 'h-20'];
            return (
              <div key={p.id} className="flex flex-col items-center animate-in">
                <div className="text-lg font-bold mb-2">{p.nickname}</div>
                <div className="text-sm text-gray-500 mb-1">{p.score} pts</div>
                <div
                  className={`w-24 ${heights[idx]} ${podiumColors[idx]} rounded-t-lg flex items-start justify-center pt-2`}
                >
                  <span className="text-xl font-bold text-white">{podiumLabels[idx]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rest of leaderboard */}
        {display.length > 3 && (
          <div className="space-y-2">
            {display.slice(3).map((p, i) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-bold">
                    {i + 4}
                  </span>
                  <span className="font-medium">{p.nickname}</span>
                </div>
                <span className="font-bold text-kahoot-purple">{p.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {display.map((p, i) => (
        <div
          key={p.id}
          className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm animate-in"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex items-center gap-3">
            <span className={`
              w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold text-white
              ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-200 text-gray-600'}
            `}>
              {i + 1}
            </span>
            <span className="font-medium">{p.nickname}</span>
          </div>
          <span className="font-bold text-kahoot-purple">{p.score}</span>
        </div>
      ))}
    </div>
  );
}

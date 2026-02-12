'use client';

import LeaderboardDisplay from '@/components/shared/LeaderboardDisplay';

export default function Leaderboard({ participants, isFinal = false }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-700">
        {isFinal ? 'Final Leaderboard' : 'Leaderboard'}
      </h3>
      <LeaderboardDisplay
        participants={participants}
        limit={isFinal ? null : 5}
        showPodium={isFinal}
      />
    </div>
  );
}

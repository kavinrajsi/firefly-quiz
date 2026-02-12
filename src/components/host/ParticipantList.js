'use client';

export default function ParticipantList({ participants }) {
  if (participants.length === 0) {
    return (
      <p className="text-gray-400 text-center py-4">Waiting for players to join...</p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-700">
        Players ({participants.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className="bg-kahoot-purple/10 text-kahoot-purple px-3 py-1.5 rounded-full text-sm font-medium animate-in"
          >
            {p.nickname}
          </div>
        ))}
      </div>
    </div>
  );
}

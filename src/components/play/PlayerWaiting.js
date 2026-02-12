'use client';

export default function PlayerWaiting({ nickname, roomCode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16">
      <div className="w-16 h-16 bg-kahoot-purple rounded-full flex items-center justify-center mb-6">
        <span className="text-2xl text-white font-bold">
          {nickname?.[0]?.toUpperCase()}
        </span>
      </div>
      <h2 className="text-2xl font-bold mb-2">You&apos;re in!</h2>
      <p className="text-gray-500 mb-1">
        Playing as <span className="font-semibold text-kahoot-purple">{nickname}</span>
      </p>
      <p className="text-gray-400 text-sm">Room: {roomCode}</p>
      <div className="mt-8">
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Waiting for the host to start...
        </div>
      </div>
    </div>
  );
}

'use client';

export default function PlayerResults({ isCorrect, pointsEarned }) {
  return (
    <div className={`
      flex flex-col items-center justify-center py-12 rounded-xl
      ${isCorrect ? 'bg-green-50' : 'bg-red-50'}
    `}>
      <div className={`
        w-20 h-20 rounded-full flex items-center justify-center mb-4
        ${isCorrect ? 'bg-kahoot-green' : 'bg-kahoot-red'}
      `}>
        {isCorrect ? (
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      <h2 className={`text-2xl font-bold mb-2 ${isCorrect ? 'text-kahoot-green' : 'text-kahoot-red'}`}>
        {isCorrect ? 'Correct!' : 'Wrong!'}
      </h2>

      {isCorrect && (
        <p className="text-3xl font-extrabold text-kahoot-purple animate-bounce-in">
          +{pointsEarned}
        </p>
      )}
    </div>
  );
}

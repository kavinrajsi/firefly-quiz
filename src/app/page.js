import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-5xl sm:text-6xl font-extrabold text-kahoot-purple mb-6">
          Make Learning
          <span className="block text-kahoot-red">Awesome</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto">
          Create interactive quizzes, host live sessions, and engage your team
          with real-time multiplayer learning.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="px-8 py-4 bg-kahoot-purple text-white rounded-lg text-lg font-bold hover:bg-purple-800 transition-all duration-200 hover:scale-105"
          >
            Get Started Free
          </Link>
          <Link
            href="/play"
            className="px-8 py-4 bg-white border-2 border-kahoot-purple text-kahoot-purple rounded-lg text-lg font-bold hover:bg-purple-50 transition-all duration-200 hover:scale-105"
          >
            Join a Game
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-kahoot-purple/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-kahoot-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Create Quizzes</h3>
            <p className="text-gray-600 text-sm">Build engaging quizzes with multiple-choice questions, images, and custom time limits.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-kahoot-red/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-kahoot-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Host Live</h3>
            <p className="text-gray-600 text-sm">Run real-time quiz sessions with a unique room code. See answers come in live.</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="w-12 h-12 bg-kahoot-green/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-kahoot-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Track Results</h3>
            <p className="text-gray-600 text-sm">View detailed analytics, leaderboards, and export results to CSV for reporting.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

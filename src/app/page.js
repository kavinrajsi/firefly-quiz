import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 pt-20 pb-16">
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
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12">
          Everything you need to run engaging quizzes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Quizzes */}
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-kahoot-purple/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-kahoot-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Create Quizzes</h3>
            <p className="text-gray-600 text-sm">
              Build quizzes with multiple-choice questions, image/video attachments, and customizable time limits per question.
            </p>
          </div>

          {/* Bulk Import */}
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-kahoot-blue/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-kahoot-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Bulk Import</h3>
            <p className="text-gray-600 text-sm">
              Import multiple questions at once from JSON format. Quickly set up entire quizzes in seconds.
            </p>
          </div>

          {/* Host Live */}
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-kahoot-red/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-kahoot-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9.172 15.828a4 4 0 010-5.656m5.656 0a4 4 0 010 5.656M12 12h.01" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Host Live Sessions</h3>
            <p className="text-gray-600 text-sm">
              Start a session with a unique room code. Players join instantly from any device — no sign-up required.
            </p>
          </div>

          {/* Real-time Gameplay */}
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-kahoot-yellow/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-kahoot-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Real-time Gameplay</h3>
            <p className="text-gray-600 text-sm">
              Countdown timers, instant answer feedback, and live leaderboards that update as players compete.
            </p>
          </div>

          {/* Speed-based Scoring */}
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-kahoot-green/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-kahoot-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Speed-based Scoring</h3>
            <p className="text-gray-600 text-sm">
              Faster correct answers earn more points (500–1000). Keeps everyone on their toes and rewards quick thinking.
            </p>
          </div>

          {/* Results & Analytics */}
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-kahoot-purple/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-kahoot-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Results & Analytics</h3>
            <p className="text-gray-600 text-sm">
              Detailed per-question breakdowns, answer distributions, accuracy rates, and CSV export for reporting.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-kahoot-purple text-white rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold text-lg mb-2">Create</h3>
              <p className="text-gray-600 text-sm">
                Build your quiz with questions, options, media, and time limits. Or bulk-import from JSON.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-kahoot-red text-white rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold text-lg mb-2">Host</h3>
              <p className="text-gray-600 text-sm">
                Start a live session and share the room code. Players join from any device with just a nickname.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-kahoot-green text-white rounded-full flex items-center justify-center text-2xl font-extrabold mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold text-lg mb-2">Play & Review</h3>
              <p className="text-gray-600 text-sm">
                Questions auto-advance with countdowns. After the game, review results, leaderboards, and export data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Ready to get started?
          </h2>
          <p className="text-gray-600 mb-8">
            Create your first quiz in minutes and host a live session for your team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-kahoot-purple text-white rounded-lg text-lg font-bold hover:bg-purple-800 transition-all duration-200 hover:scale-105"
            >
              Create a Quiz
            </Link>
            <Link
              href="/play"
              className="px-8 py-4 bg-white border-2 border-kahoot-purple text-kahoot-purple rounded-lg text-lg font-bold hover:bg-purple-50 transition-all duration-200 hover:scale-105"
            >
              Join a Game
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

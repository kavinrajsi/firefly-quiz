'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-kahoot-purple">Firefly</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-kahoot-purple font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/reports"
                  className="text-gray-600 hover:text-kahoot-purple font-medium transition-colors"
                >
                  Reports
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-red-600 font-medium transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/play"
                  className="text-gray-600 hover:text-kahoot-purple font-medium transition-colors"
                >
                  Join Game
                </Link>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 bg-kahoot-purple text-white rounded-lg font-semibold hover:bg-purple-800 transition-colors"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

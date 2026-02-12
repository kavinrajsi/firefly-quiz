'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { data } = await supabase
      .from('quiz_sessions')
      .select('*, quizzes(title), participants(count)')
      .eq('host_id', user.id)
      .order('created_at', { ascending: false });

    setSessions(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Session History</h1>
        <Button variant="secondary" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500">No sessions yet. Host a quiz to see analytics here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/results/${s.id}`)}
            >
              <div>
                <h3 className="font-semibold">{s.quizzes?.title}</h3>
                <div className="text-sm text-gray-400 flex gap-3 mt-1">
                  <span>Code: {s.room_code}</span>
                  <span>{s.participants?.[0]?.count ?? 0} players</span>
                  <span className={`font-medium ${
                    s.status === 'finished' ? 'text-kahoot-green' :
                    s.status === 'active' ? 'text-kahoot-blue' : 'text-gray-400'
                  }`}>
                    {s.status}
                  </span>
                  <span>{formatDate(s.created_at)}</span>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

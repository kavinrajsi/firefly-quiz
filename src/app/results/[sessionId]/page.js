'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import LeaderboardDisplay from '@/components/shared/LeaderboardDisplay';
import { exportToCSV, downloadFile, formatDate } from '@/lib/utils';

const optionColors = ['bg-kahoot-red', 'bg-kahoot-blue', 'bg-kahoot-yellow', 'bg-kahoot-green'];

export default function ResultsPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    const [sessRes, partRes, ansRes] = await Promise.all([
      supabase
        .from('quiz_sessions')
        .select('*, quizzes(title, description)')
        .eq('id', sessionId)
        .single(),
      supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionId)
        .order('score', { ascending: false }),
      supabase
        .from('answers')
        .select('*')
        .eq('session_id', sessionId),
    ]);

    if (sessRes.data) {
      setSession(sessRes.data);
      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', sessRes.data.quiz_id)
        .order('sort_order');
      setQuestions(qs || []);
    }

    setParticipants(partRes.data || []);
    setAnswers(ansRes.data || []);
    setLoading(false);
  };

  const handleExportCSV = () => {
    const csv = exportToCSV(participants, answers, questions);
    const title = session?.quizzes?.title || 'quiz';
    downloadFile(csv, `${title.replace(/\s+/g, '_')}_results.csv`);
  };

  const getQuestionStats = (question) => {
    const qAnswers = answers.filter((a) => a.question_id === question.id);
    const correct = qAnswers.filter((a) => a.is_correct).length;
    const total = qAnswers.length;
    const avgTime = total > 0
      ? (qAnswers.reduce((sum, a) => sum + a.time_taken, 0) / total).toFixed(1)
      : 0;

    const distribution = [0, 0, 0, 0];
    qAnswers.forEach((a) => {
      if (a.selected_option >= 0 && a.selected_option < 4) {
        distribution[a.selected_option]++;
      }
    });

    return { correct, total, avgTime, distribution, answers: qAnswers };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Session not found.</p>
        <Button className="mt-4" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{session.quizzes?.title}</h1>
          <p className="text-gray-500">
            {participants.length} players &middot; {questions.length} questions &middot;{' '}
            {formatDate(session.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            Dashboard
          </Button>
        </div>
      </div>

      {/* Leaderboard */}
      {participants.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-center">Leaderboard</h2>
          <LeaderboardDisplay
            participants={participants}
            showPodium={participants.length >= 3}
            limit={null}
          />
        </div>
      )}

      {/* Per-question breakdown */}
      <h2 className="text-xl font-bold mb-4">Question Breakdown</h2>
      <div className="space-y-3">
        {questions.map((q, i) => {
          const stats = getQuestionStats(q);
          const isExpanded = selectedQuestion === i;

          return (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => setSelectedQuestion(isExpanded ? null : i)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="bg-kahoot-purple text-white text-xs font-bold px-2 py-1 rounded">
                      Q{i + 1}
                    </span>
                    <span className="font-medium">{q.question_text}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className={stats.total > 0 && stats.correct / stats.total >= 0.5 ? 'text-kahoot-green font-semibold' : 'text-kahoot-red font-semibold'}>
                      {stats.correct}/{stats.total} correct
                    </span>
                    <span>Avg: {stats.avgTime}s</span>
                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 border-t bg-gray-50">
                  {/* Answer distribution */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {q.options.map((opt, j) => (
                      <div key={j} className="text-center">
                        <div className={`
                          ${optionColors[j]} text-white rounded p-2 text-sm font-medium
                          ${q.correct_option === j ? 'ring-2 ring-black/20' : 'opacity-70'}
                        `}>
                          {opt} {q.correct_option === j && '✓'}
                        </div>
                        <div className="mt-1 text-sm font-bold">{stats.distribution[j]}</div>
                      </div>
                    ))}
                  </div>

                  {/* Individual answers */}
                  <div className="space-y-1">
                    {stats.answers
                      .sort((a, b) => b.points_earned - a.points_earned)
                      .map((a) => {
                        const p = participants.find((p) => p.id === a.participant_id);
                        return (
                          <div key={a.id} className="flex items-center justify-between text-sm bg-white rounded p-2">
                            <span className="font-medium">{p?.nickname}</span>
                            <div className="flex items-center gap-3">
                              <span className={a.is_correct ? 'text-kahoot-green' : 'text-kahoot-red'}>
                                {q.options[a.selected_option]}
                              </span>
                              <span className="text-gray-400">{a.time_taken.toFixed(1)}s</span>
                              <span className="font-bold text-kahoot-purple w-16 text-right">
                                +{a.points_earned}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

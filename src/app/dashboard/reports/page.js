'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import { formatDate, exportToCSV, downloadFile } from '@/lib/utils';

export default function ReportsPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [sessionDetails, setSessionDetails] = useState({});
  const [loadingSession, setLoadingSession] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    // Load all quizzes with their sessions
    const { data: userQuizzes } = await supabase
      .from('quizzes')
      .select('id, title, description')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!userQuizzes?.length) {
      setQuizzes([]);
      setLoading(false);
      return;
    }

    // Load all sessions for these quizzes
    const quizIds = userQuizzes.map((q) => q.id);
    const { data: sessions } = await supabase
      .from('quiz_sessions')
      .select('*, participants(count)')
      .in('quiz_id', quizIds)
      .eq('status', 'finished')
      .order('created_at', { ascending: false });

    // Group sessions by quiz
    const grouped = userQuizzes.map((quiz) => {
      const quizSessions = (sessions || []).filter((s) => s.quiz_id === quiz.id);
      const totalPlayers = quizSessions.reduce(
        (sum, s) => sum + (s.participants?.[0]?.count ?? 0), 0
      );
      return {
        ...quiz,
        sessions: quizSessions,
        totalSessions: quizSessions.length,
        totalPlayers,
      };
    }).filter((q) => q.totalSessions > 0);

    setQuizzes(grouped);
    setLoading(false);
  };

  const loadSessionDetails = async (sessionId) => {
    if (sessionDetails[sessionId]) return;
    setLoadingSession(sessionId);

    const [partRes, ansRes, sessRes] = await Promise.all([
      supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionId)
        .order('score', { ascending: false }),
      supabase
        .from('answers')
        .select('*')
        .eq('session_id', sessionId),
      supabase
        .from('quiz_sessions')
        .select('quiz_id')
        .eq('id', sessionId)
        .single(),
    ]);

    let questions = [];
    if (sessRes.data) {
      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', sessRes.data.quiz_id)
        .order('sort_order');
      questions = qs || [];
    }

    const participants = partRes.data || [];
    const answers = ansRes.data || [];

    // Compute per-question stats
    const questionStats = questions.map((q, i) => {
      const qAnswers = answers.filter((a) => a.question_id === q.id);
      const correct = qAnswers.filter((a) => a.is_correct).length;
      const total = qAnswers.length;
      const avgTime = total > 0
        ? (qAnswers.reduce((sum, a) => sum + a.time_taken, 0) / total).toFixed(1)
        : 0;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      return { ...q, index: i, correct, total, avgTime, accuracy };
    });

    const overallAccuracy = questionStats.length > 0
      ? Math.round(
          questionStats.reduce((sum, q) => sum + q.accuracy, 0) / questionStats.length
        )
      : 0;

    setSessionDetails((prev) => ({
      ...prev,
      [sessionId]: { participants, answers, questions, questionStats, overallAccuracy },
    }));
    setLoadingSession(null);
  };

  const handleExportSession = (sessionId, quizTitle) => {
    const details = sessionDetails[sessionId];
    if (!details) return;
    const csv = exportToCSV(details.participants, details.answers, details.questions);
    downloadFile(csv, `${quizTitle.replace(/\s+/g, '_')}_results.csv`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-gray-500 mt-1">Results from all your quizzes, grouped by title</p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/dashboard')}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Dashboard
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 text-lg">No finished sessions yet</p>
          <p className="text-gray-400 text-sm mt-1">Host a quiz to see reports here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Quiz Header */}
              <button
                onClick={() => setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)}
                className="w-full p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
                    {quiz.description && (
                      <p className="text-gray-500 text-sm mt-0.5">{quiz.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-extrabold text-kahoot-purple">{quiz.totalSessions}</div>
                      <div className="text-xs text-gray-400">Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-extrabold text-kahoot-blue">{quiz.totalPlayers}</div>
                      <div className="text-xs text-gray-400">Total Players</div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedQuiz === quiz.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Expanded Sessions */}
              {expandedQuiz === quiz.id && (
                <div className="border-t">
                  {quiz.sessions.map((session) => {
                    const details = sessionDetails[session.id];
                    const isLoading = loadingSession === session.id;
                    const playerCount = session.participants?.[0]?.count ?? 0;

                    return (
                      <div key={session.id} className="border-b last:border-b-0">
                        {/* Session Row */}
                        <button
                          onClick={() => loadSessionDetails(session.id)}
                          className="w-full px-5 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-kahoot-purple/10 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-kahoot-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {formatDate(session.created_at)}
                              </div>
                              <div className="text-sm text-gray-400">
                                Code: {session.room_code} &middot; {playerCount} players
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {details && (
                              <span className={`text-sm font-semibold ${details.overallAccuracy >= 50 ? 'text-kahoot-green' : 'text-kahoot-red'}`}>
                                {details.overallAccuracy}% accuracy
                              </span>
                            )}
                            {isLoading ? (
                              <Spinner size="sm" />
                            ) : (
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            )}
                          </div>
                        </button>

                        {/* Session Details */}
                        {details && (
                          <div className="px-5 pb-4 bg-gray-50">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                              <div className="bg-white rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-kahoot-purple">{details.participants.length}</div>
                                <div className="text-xs text-gray-400">Players</div>
                              </div>
                              <div className="bg-white rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-kahoot-blue">{details.questions.length}</div>
                                <div className="text-xs text-gray-400">Questions</div>
                              </div>
                              <div className="bg-white rounded-lg p-3 text-center">
                                <div className={`text-lg font-bold ${details.overallAccuracy >= 50 ? 'text-kahoot-green' : 'text-kahoot-red'}`}>
                                  {details.overallAccuracy}%
                                </div>
                                <div className="text-xs text-gray-400">Accuracy</div>
                              </div>
                              <div className="bg-white rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-kahoot-yellow">
                                  {details.participants[0]?.score ?? 0}
                                </div>
                                <div className="text-xs text-gray-400">Top Score</div>
                              </div>
                            </div>

                            {/* Top 3 Players */}
                            {details.participants.length > 0 && (
                              <div className="bg-white rounded-lg p-3 mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Players</h4>
                                <div className="space-y-1.5">
                                  {details.participants.slice(0, 3).map((p, i) => (
                                    <div key={p.id} className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                          i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : 'bg-amber-700'
                                        }`}>
                                          {i + 1}
                                        </span>
                                        <span className="font-medium">{p.nickname}</span>
                                      </div>
                                      <span className="font-bold text-kahoot-purple">{p.score} pts</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Per-Question Accuracy */}
                            <div className="bg-white rounded-lg p-3 mb-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Question Accuracy</h4>
                              <div className="space-y-2">
                                {details.questionStats.map((q) => (
                                  <div key={q.id} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-kahoot-purple bg-kahoot-purple/10 px-1.5 py-0.5 rounded w-8 text-center shrink-0">
                                      Q{q.index + 1}
                                    </span>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-xs text-gray-600 truncate max-w-[200px]">{q.question_text}</span>
                                        <span className={`text-xs font-semibold ${q.accuracy >= 50 ? 'text-kahoot-green' : 'text-kahoot-red'}`}>
                                          {q.accuracy}%
                                        </span>
                                      </div>
                                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full rounded-full transition-all ${q.accuracy >= 50 ? 'bg-kahoot-green' : 'bg-kahoot-red'}`}
                                          style={{ width: `${q.accuracy}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button size="sm" variant="secondary" onClick={() => handleExportSession(session.id, quiz.title)}>
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                Export CSV
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => router.push(`/results/${session.id}`)}>
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                Full Details
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

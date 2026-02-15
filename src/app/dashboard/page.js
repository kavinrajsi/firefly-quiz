'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import Input from '@/components/ui/Input';
import { generateRoomCode, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewQuiz, setShowNewQuiz] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const [quizRes, sessionRes] = await Promise.all([
      supabase.from('quizzes').select('*, questions(count)').eq('user_id', user.id).order('updated_at', { ascending: false }),
      supabase.from('quiz_sessions').select('*, quizzes(title), participants(count)').eq('host_id', user.id).order('created_at', { ascending: false }).limit(10),
    ]);

    if (quizRes.error || sessionRes.error) {
      setError('Failed to load data. Please refresh the page.');
    }

    setQuizzes(quizRes.data || []);
    setSessions(sessionRes.data || []);
    setLoading(false);
  };

  const createQuiz = async () => {
    if (!newTitle.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('quizzes')
      .insert({ title: newTitle.trim(), description: newDesc.trim(), user_id: user.id })
      .select()
      .single();

    if (error) {
      setError('Failed to create quiz. Please try again.');
      return;
    }

    setShowNewQuiz(false);
    setNewTitle('');
    setNewDesc('');
    router.push(`/quiz/${data.id}/edit`);
  };

  const duplicateQuiz = async (quiz) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: newQuiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({ title: `${quiz.title} (copy)`, description: quiz.description, user_id: user.id })
      .select()
      .single();

    if (quizError || !newQuiz) {
      setError('Failed to duplicate quiz.');
      return;
    }

    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('sort_order');

    if (questions?.length) {
      const { error: insertError } = await supabase.from('questions').insert(
        questions.map(({ id, quiz_id, created_at, ...q }) => ({ ...q, quiz_id: newQuiz.id }))
      );
      if (insertError) {
        setError('Quiz duplicated but some questions failed to copy.');
      }
    }
    loadData();
  };

  const deleteQuiz = async (quizId) => {
    if (!confirm('Delete this quiz and all its questions?')) return;
    const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
    if (error) {
      setError('Failed to delete quiz.');
      return;
    }
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
  };

  const deleteSession = async (sessionId) => {
    if (!confirm('Delete this session and all its data (answers, participants)?')) return;
    const { error } = await supabase.from('quiz_sessions').delete().eq('id', sessionId);
    if (error) {
      setError('Failed to delete session.');
      return;
    }
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const startSession = async (quizId) => {
    const { data: { user } } = await supabase.auth.getUser();

    // Retry up to 3 times for room code collision
    for (let attempt = 0; attempt < 3; attempt++) {
      const roomCode = generateRoomCode();
      const { data, error } = await supabase
        .from('quiz_sessions')
        .insert({ quiz_id: quizId, host_id: user.id, room_code: roomCode })
        .select()
        .single();

      if (!error && data) {
        router.push(`/host/${data.id}`);
        return;
      }

      // If not a unique constraint violation, don't retry
      if (error && !error.message?.includes('unique')) {
        setError('Failed to start session. Please try again.');
        return;
      }
    }
    setError('Failed to generate a unique room code. Please try again.');
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
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-2">×</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Quizzes</h1>
        <Button onClick={() => setShowNewQuiz(true)}>
          <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Quiz
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 text-lg mb-4">No quizzes yet</p>
          <Button onClick={() => setShowNewQuiz(true)}>
            <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Create your first quiz
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900">{quiz.title}</h2>
                  {quiz.description && (
                    <p className="text-gray-500 text-sm mt-1">{quiz.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <span>{quiz.questions?.[0]?.count ?? 0} questions</span>
                    <span>Updated {formatDate(quiz.updated_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => startSession(quiz.id)}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9.172 15.828a4 4 0 010-5.656m5.656 0a4 4 0 010 5.656M12 12h.01" /></svg>
                    Host Live
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => router.push(`/quiz/${quiz.id}/edit`)}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => duplicateQuiz(quiz)}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Duplicate
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteQuiz(quiz.id)}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session History */}
      {sessions.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Recent Sessions</h2>
          <div className="grid gap-3">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <span className="font-semibold">{session.quizzes?.title}</span>
                  <div className="text-sm text-gray-400 flex gap-3 mt-1">
                    <span>Code: {session.room_code}</span>
                    <span>{session.participants?.[0]?.count ?? 0} players</span>
                    <span>{session.status}</span>
                    <span>{formatDate(session.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => router.push(`/results/${session.id}`)}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Results
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => deleteSession(session.id)}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Quiz Modal */}
      <Modal isOpen={showNewQuiz} onClose={() => setShowNewQuiz(false)} title="Create New Quiz">
        <div className="space-y-4">
          <Input
            label="Quiz Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g., Q1 Safety Training"
            autoFocus
          />
          <Input
            label="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Brief description..."
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowNewQuiz(false)}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Cancel
            </Button>
            <Button onClick={createQuiz}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Create Quiz
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

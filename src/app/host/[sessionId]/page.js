'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import Timer from '@/components/ui/Timer';
import ParticipantList from '@/components/host/ParticipantList';
import AnswerDistribution from '@/components/host/AnswerDistribution';
import HostControls from '@/components/host/HostControls';
import Leaderboard from '@/components/host/Leaderboard';
import Countdown from '@/components/shared/Countdown';

export default function HostSessionPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('lobby'); // lobby, countdown, question, results, finished
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [questionAnswers, setQuestionAnswers] = useState([]);
  const [channel, setChannel] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const nextQuestionIndexRef = useRef(0);

  // Load session data
  useEffect(() => {
    const load = async () => {
      const { data: sess, error: sessError } = await supabase
        .from('quiz_sessions')
        .select('*, quizzes(title)')
        .eq('id', sessionId)
        .single();

      if (sessError || !sess) { router.push('/dashboard'); return; }
      setSession(sess);

      const { data: qs, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', sess.quiz_id)
        .order('sort_order');
      if (qError) setConnectionError(true);
      setQuestions(qs || []);

      const { data: parts, error: partError } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionId);
      if (partError) setConnectionError(true);
      setParticipants(parts || []);

      setLoading(false);
    };
    load();
  }, [sessionId]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!session) return;

    // Subscribe to new participants
    const partChannel = supabase
      .channel(`participants-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participants', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          setParticipants((prev) => {
            if (prev.find((p) => p.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') setConnectionError(true);
        if (status === 'SUBSCRIBED') setConnectionError(false);
      });

    // Subscribe to answers
    const ansChannel = supabase
      .channel(`answers-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'answers', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          setAnswers((prev) => [...prev, payload.new]);
          setQuestionAnswers((prev) => [...prev, payload.new]);
          // Update participant score
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === payload.new.participant_id
                ? { ...p, score: p.score + payload.new.points_earned }
                : p
            )
          );
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') setConnectionError(true);
      });

    // Broadcast channel for game state
    const bc = supabase.channel(`game-${sessionId}`, {
      config: { broadcast: { self: false } },
    });
    bc.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') setConnectionError(true);
    });
    setChannel(bc);

    return () => {
      supabase.removeChannel(partChannel);
      supabase.removeChannel(ansChannel);
      supabase.removeChannel(bc);
    };
  }, [session]);

  const broadcastState = useCallback(
    (type, data = {}) => {
      channel?.send({ type: 'broadcast', event: 'game_state', payload: { type, ...data } });
    },
    [channel]
  );

  const startQuiz = async () => {
    if (questions.length === 0) return;
    if (participants.length === 0 && !confirm('No players have joined yet. Start anyway?')) return;
    nextQuestionIndexRef.current = 0;
    setPhase('countdown');
    await supabase
      .from('quiz_sessions')
      .update({ status: 'active', current_question_index: 0 })
      .eq('id', sessionId);
    broadcastState('countdown', { questionIndex: 0 });
  };

  const showQuestion = useCallback(
    async (index) => {
      setCurrentIndex(index);
      setQuestionAnswers([]);
      setPhase('question');

      const now = new Date().toISOString();
      await supabase
        .from('quiz_sessions')
        .update({ current_question_index: index, question_started_at: now })
        .eq('id', sessionId);

      broadcastState('question', {
        questionIndex: index,
        startedAt: now,
        question: questions[index],
      });
    },
    [broadcastState, questions, sessionId, supabase]
  );

  const onCountdownComplete = useCallback(() => {
    showQuestion(nextQuestionIndexRef.current);
  }, [showQuestion]);

  const showResults = () => {
    setPhase('results');
    broadcastState('show_results', { questionIndex: currentIndex });
  };

  const nextQuestion = () => {
    const nextIdx = currentIndex + 1;
    nextQuestionIndexRef.current = nextIdx;
    setPhase('countdown');
    broadcastState('countdown', { questionIndex: nextIdx });
  };

  const endQuiz = async () => {
    setPhase('finished');
    await supabase
      .from('quiz_sessions')
      .update({ status: 'finished', ended_at: new Date().toISOString() })
      .eq('id', sessionId);
    broadcastState('game_end');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {connectionError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 text-center">
          Connection lost. Live updates may be delayed. Try refreshing the page.
        </div>
      )}
      {/* Countdown overlay */}
      {phase === 'countdown' && <Countdown from={3} onComplete={onCountdownComplete} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{session?.quizzes?.title}</h1>
          <p className="text-gray-500">
            {phase === 'lobby' ? 'Waiting for players' : `Question ${currentIndex + 1} of ${questions.length}`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-mono font-bold text-kahoot-purple tracking-wider">
            {session?.room_code}
          </div>
          <p className="text-sm text-gray-400">Room Code</p>
        </div>
      </div>

      {/* Lobby */}
      {phase === 'lobby' && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div className="text-center">
            <p className="text-xl text-gray-600 mb-2">
              Share this code with players:
            </p>
            <div className="text-6xl font-mono font-extrabold text-kahoot-purple tracking-[0.3em]">
              {session?.room_code}
            </div>
          </div>
          <ParticipantList participants={participants} />
          <div className="flex justify-center">
            <HostControls
              status="lobby"
              onStart={startQuiz}
              totalQuestions={questions.length}
              currentIndex={currentIndex}
            />
          </div>
        </div>
      )}

      {/* Question phase */}
      {phase === 'question' && currentQuestion && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{currentQuestion.question_text}</h2>
              {currentQuestion.media_url && (
                <img src={currentQuestion.media_url} alt="" className="h-48 rounded-lg object-cover mb-4" />
              )}
              <div className="grid grid-cols-2 gap-3 mt-4">
                {currentQuestion.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`answer-btn ${
                      ['bg-kahoot-red', 'bg-kahoot-blue', 'bg-kahoot-yellow', 'bg-kahoot-green', 'bg-kahoot-purple'][i % 5]
                    }`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
            <div className="ml-6">
              <Timer duration={currentQuestion.time_limit} onComplete={showResults} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-500">
              {questionAnswers.length} / {participants.length} answered
            </p>
            <HostControls
              status="showing_question"
              onShowResults={showResults}
              totalQuestions={questions.length}
              currentIndex={currentIndex}
            />
          </div>
        </div>
      )}

      {/* Results phase */}
      {phase === 'results' && currentQuestion && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-1">{currentQuestion.question_text}</h2>
            <p className="text-kahoot-green font-semibold mb-4">
              Correct: {currentQuestion.options[currentQuestion.correct_option]}
            </p>
            <AnswerDistribution question={currentQuestion} answers={questionAnswers} />
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Leaderboard participants={participants} />
          </div>
          <div className="flex justify-center">
            <HostControls
              status="showing_results"
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              onNextQuestion={nextQuestion}
              onEndQuiz={endQuiz}
            />
          </div>
        </div>
      )}

      {/* Finished */}
      {phase === 'finished' && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-2xl font-bold text-center">Quiz Complete!</h2>
          <Leaderboard participants={participants} isFinal />
          <div className="flex justify-center gap-3">
            <button
              onClick={() => router.push(`/results/${sessionId}`)}
              className="px-6 py-3 bg-kahoot-purple text-white rounded-lg font-bold hover:bg-purple-800 transition-colors"
            >
              View Detailed Results
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

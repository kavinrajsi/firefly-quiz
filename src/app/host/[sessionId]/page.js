'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import ParticipantList from '@/components/host/ParticipantList';
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
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('lobby'); // lobby, countdown, active, finished
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [answerCount, setAnswerCount] = useState(0);
  const [connectionError, setConnectionError] = useState(false);
  const channelRef = useRef(null);
  const nextQuestionIndexRef = useRef(0);
  const autoAdvanceRef = useRef(null);
  const currentIndexRef = useRef(-1);
  const questionsRef = useRef([]);

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

    const ansChannel = supabase
      .channel(`answers-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'answers', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          setAnswerCount((prev) => prev + 1);
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

    const bc = supabase.channel(`game-${sessionId}`, {
      config: { broadcast: { self: false } },
    });
    bc.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') setConnectionError(true);
    });
    channelRef.current = bc;

    return () => {
      supabase.removeChannel(partChannel);
      supabase.removeChannel(ansChannel);
      supabase.removeChannel(bc);
    };
  }, [session]);

  // Keep refs in sync
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  // Cleanup auto-advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  // Skip timer and advance immediately when all players have answered
  useEffect(() => {
    if (phase !== 'active' || participants.length === 0) return;
    if (answerCount >= participants.length) {
      // Cancel the pending timer
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      // Broadcast results to players
      broadcastState('show_results', { questionIndex: currentIndexRef.current });
      // Short pause then advance to next question or end
      autoAdvanceRef.current = setTimeout(() => {
        const nextIdx = currentIndexRef.current + 1;
        if (nextIdx < questionsRef.current.length) {
          nextQuestionIndexRef.current = nextIdx;
          setPhase('countdown');
          broadcastState('countdown', { questionIndex: nextIdx });
        } else {
          endQuizFn();
        }
      }, 3000);
    }
  }, [answerCount, participants.length, phase]);

  const broadcastState = useCallback(
    (type, data = {}) => {
      channelRef.current?.send({ type: 'broadcast', event: 'game_state', payload: { type, ...data } });
    },
    []
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
      currentIndexRef.current = index;
      setAnswerCount(0);
      setPhase('active');

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

      // Auto-advance: after time_limit, broadcast results then move to next question
      const timeLimit = questions[index]?.time_limit || 30;
      autoAdvanceRef.current = setTimeout(() => {
        // Broadcast results to players
        broadcastState('show_results', { questionIndex: index });

        // After 5s pause for players to see results, advance to next or end
        autoAdvanceRef.current = setTimeout(() => {
          const nextIdx = index + 1;
          if (nextIdx < questions.length) {
            nextQuestionIndexRef.current = nextIdx;
            setPhase('countdown');
            broadcastState('countdown', { questionIndex: nextIdx });
          } else {
            // All questions done — end quiz
            endQuizFn();
          }
        }, 5000);
      }, timeLimit * 1000);
    },
    [broadcastState, questions, sessionId, supabase]
  );

  const onCountdownComplete = useCallback(() => {
    showQuestion(nextQuestionIndexRef.current);
  }, [showQuestion]);

  const endQuizFn = async () => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
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
            {phase === 'lobby'
              ? 'Waiting for players'
              : phase === 'finished'
                ? 'Quiz Complete'
                : `Question ${currentIndex + 1} of ${questions.length}`}
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

      {/* Active game — only participant count + live leaderboard */}
      {phase === 'active' && (
        <div className="space-y-6">
          {/* Participant count */}
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-gray-500 text-sm mb-1">Players</p>
            <div className="text-5xl font-extrabold text-kahoot-purple">
              {participants.length}
            </div>
          </div>

          {/* Live leaderboard */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Leaderboard participants={participants} />
          </div>

          {/* End quiz button */}
          <div className="flex justify-center">
            <button
              onClick={endQuizFn}
              className="px-6 py-3 bg-kahoot-red text-white rounded-lg font-bold hover:brightness-110 transition-all"
            >
              End Quiz
            </button>
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

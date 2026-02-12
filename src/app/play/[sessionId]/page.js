'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Spinner from '@/components/ui/Spinner';
import Timer from '@/components/ui/Timer';
import AnswerButtons from '@/components/play/AnswerButtons';
import PlayerWaiting from '@/components/play/PlayerWaiting';
import PlayerResults from '@/components/play/PlayerResults';
import Countdown from '@/components/shared/Countdown';
import LeaderboardDisplay from '@/components/shared/LeaderboardDisplay';
import { calculateScore } from '@/lib/scoring';

export default function PlayerGamePage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('waiting'); // waiting, countdown, question, results, finished
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const scoreRef = useRef(0);
  const [participants, setParticipants] = useState([]);
  const [connectionError, setConnectionError] = useState(false);
  const selectedAnswerRef = useRef(null);
  // Fix #4: track the 800ms delay so it can be cancelled
  const answerDelayRef = useRef(null);

  // Fix #16: Load participant from sessionStorage with validation
  useEffect(() => {
    const stored = sessionStorage.getItem(`participant-${sessionId}`);
    if (!stored) {
      router.push('/play');
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (!parsed?.id || !parsed?.nickname) {
        router.push('/play');
        return;
      }
      setParticipant(parsed);
    } catch {
      router.push('/play');
      return;
    }
    setLoading(false);
  }, [sessionId]);

  // Subscribe to game broadcast
  useEffect(() => {
    if (!participant) return;

    const channel = supabase
      .channel(`game-${sessionId}`, {
        config: { broadcast: { self: false } },
      })
      .on('broadcast', { event: 'game_state' }, ({ payload }) => {
        // Fix #7: wrap in try-catch so malformed payloads don't break subscription
        try {
          // Fix #4: cancel pending answer delay on any broadcast
          if (answerDelayRef.current) {
            clearTimeout(answerDelayRef.current);
            answerDelayRef.current = null;
          }

          switch (payload.type) {
            case 'countdown':
              setPhase('countdown');
              setSelectedAnswer(null);
              selectedAnswerRef.current = null;
              setAnswerResult(null);
              break;

            case 'question':
              setCurrentQuestion(payload.question);
              setQuestionStartedAt(payload.startedAt);
              setSelectedAnswer(null);
              selectedAnswerRef.current = null;
              setAnswerResult(null);
              setPhase('question');
              break;

            case 'show_results':
              if (selectedAnswerRef.current === null) {
                setAnswerResult({ isCorrect: false, pointsEarned: 0 });
              }
              loadParticipants();
              setPhase('results');
              break;

            case 'game_end':
              loadParticipants().then(() => setPhase('finished'));
              break;
          }
        } catch (err) {
          console.error('Error handling broadcast:', err);
        }
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') setConnectionError(true);
        if (status === 'SUBSCRIBED') setConnectionError(false);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [participant, sessionId]);

  // Cleanup answer delay on unmount
  useEffect(() => {
    return () => {
      if (answerDelayRef.current) clearTimeout(answerDelayRef.current);
    };
  }, []);

  // Fix #8: loadParticipants with error handling
  const loadParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionId)
        .order('score', { ascending: false });
      if (error) {
        console.error('Failed to load leaderboard:', error);
        return;
      }
      setParticipants(data || []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  };

  const handleAnswer = async (optionIndex) => {
    if (selectedAnswer !== null || !currentQuestion) return;

    setSelectedAnswer(optionIndex);
    selectedAnswerRef.current = optionIndex;
    const timeTaken = (Date.now() - new Date(questionStartedAt).getTime()) / 1000;
    const isCorrect = optionIndex === currentQuestion.correct_option;
    const points = calculateScore(timeTaken, currentQuestion.time_limit, isCorrect);

    setAnswerResult({ isCorrect, pointsEarned: points });
    // Fix #4: store timeout in ref so it can be cancelled by broadcasts
    answerDelayRef.current = setTimeout(() => {
      answerDelayRef.current = null;
      loadParticipants();
      setPhase('results');
    }, 800);

    if (isCorrect) {
      scoreRef.current += points;
      setTotalScore(scoreRef.current);
    }

    // Submit answer to database
    const { error: answerError } = await supabase.from('answers').insert({
      session_id: sessionId,
      participant_id: participant.id,
      question_id: currentQuestion.id,
      selected_option: optionIndex,
      is_correct: isCorrect,
      time_taken: Math.min(timeTaken, currentQuestion.time_limit),
      points_earned: points,
    });

    if (answerError) {
      console.error('Failed to submit answer:', answerError);
    }

    // Update participant score using ref for accurate value
    if (isCorrect) {
      const { error: scoreError } = await supabase
        .from('participants')
        .update({ score: scoreRef.current })
        .eq('id', participant.id);

      if (scoreError) {
        console.error('Failed to update score:', scoreError);
      }
    }
  };

  const onCountdownComplete = useCallback(() => {
    // Question will arrive via broadcast
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 min-h-[calc(100vh-4rem)]">
      {connectionError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 text-center">
          Connection lost. Try refreshing the page.
        </div>
      )}
      {/* Score bar */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-gray-700">{participant?.nickname}</span>
        <span className="font-bold text-kahoot-purple text-lg">{totalScore} pts</span>
      </div>

      {/* Countdown overlay */}
      {phase === 'countdown' && <Countdown from={3} onComplete={onCountdownComplete} />}

      {/* Waiting */}
      {phase === 'waiting' && (
        <PlayerWaiting nickname={participant?.nickname} roomCode={participant?.roomCode} />
      )}

      {/* Question */}
      {phase === 'question' && currentQuestion && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex-1">{currentQuestion.question_text}</h2>
              <Timer
                duration={currentQuestion.time_limit}
                onComplete={() => {
                  if (selectedAnswerRef.current === null) {
                    setAnswerResult({ isCorrect: false, pointsEarned: 0 });
                    loadParticipants();
                    setPhase('results');
                  }
                }}
                size={60}
              />
            </div>
            {currentQuestion.media_url && (
              <img src={currentQuestion.media_url} alt="" className="w-full h-40 object-cover rounded-lg mb-3" />
            )}
          </div>
          <AnswerButtons
            options={currentQuestion.options}
            onAnswer={handleAnswer}
            disabled={selectedAnswer !== null}
            selected={selectedAnswer}
          />
        </div>
      )}

      {/* Results */}
      {phase === 'results' && answerResult && (
        <div className="space-y-6">
          <PlayerResults
            isCorrect={answerResult.isCorrect}
            pointsEarned={answerResult.pointsEarned}
          />

          {participants.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-bold mb-3">Leaderboard</h3>
              <LeaderboardDisplay participants={participants} limit={5} />
            </div>
          )}
        </div>
      )}

      {/* Game Over */}
      {phase === 'finished' && (
        <div className="space-y-6 text-center">
          <h2 className="text-3xl font-extrabold text-kahoot-purple">Game Over!</h2>
          <p className="text-xl">
            Your score: <span className="font-bold">{totalScore}</span>
          </p>

          {participants.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <LeaderboardDisplay participants={participants} showPodium limit={null} />
            </div>
          )}

          <button
            onClick={() => router.push('/play')}
            className="px-6 py-3 bg-kahoot-purple text-white rounded-lg font-bold hover:bg-purple-800 transition-colors"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

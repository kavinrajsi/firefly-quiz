'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [phase, setPhase] = useState('waiting'); // waiting, countdown, question, answered, results, finished
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionStartedAt, setQuestionStartedAt] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [participants, setParticipants] = useState([]);

  // Load participant from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(`participant-${sessionId}`);
    if (!stored) {
      router.push('/play');
      return;
    }
    setParticipant(JSON.parse(stored));
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
        switch (payload.type) {
          case 'countdown':
            setPhase('countdown');
            setSelectedAnswer(null);
            setAnswerResult(null);
            break;

          case 'question':
            setCurrentQuestion(payload.question);
            setQuestionStartedAt(payload.startedAt);
            setSelectedAnswer(null);
            setAnswerResult(null);
            setPhase('question');
            break;

          case 'show_results':
            if (selectedAnswer === null) {
              // Player didn't answer in time
              setAnswerResult({ isCorrect: false, pointsEarned: 0 });
            }
            // Load updated participants for leaderboard
            loadParticipants();
            setPhase('results');
            break;

          case 'game_end':
            loadParticipants().then(() => setPhase('finished'));
            break;
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [participant, sessionId, phase, selectedAnswer]);

  const loadParticipants = async () => {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('score', { ascending: false });
    setParticipants(data || []);
  };

  const handleAnswer = async (optionIndex) => {
    if (selectedAnswer !== null || !currentQuestion) return;

    setSelectedAnswer(optionIndex);
    const timeTaken = (Date.now() - new Date(questionStartedAt).getTime()) / 1000;
    const isCorrect = optionIndex === currentQuestion.correct_option;
    const points = calculateScore(timeTaken, currentQuestion.time_limit, isCorrect);

    setAnswerResult({ isCorrect, pointsEarned: points });
    // Show selected state briefly before transitioning to result
    setTimeout(() => setPhase('answered'), 800);

    if (isCorrect) {
      setTotalScore((prev) => prev + points);
    }

    // Submit answer to database
    await supabase.from('answers').insert({
      session_id: sessionId,
      participant_id: participant.id,
      question_id: currentQuestion.id,
      selected_option: optionIndex,
      is_correct: isCorrect,
      time_taken: Math.min(timeTaken, currentQuestion.time_limit),
      points_earned: points,
    });

    // Update participant score
    if (isCorrect) {
      await supabase
        .from('participants')
        .update({ score: totalScore + points })
        .eq('id', participant.id);
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
                  if (selectedAnswer === null) {
                    setAnswerResult({ isCorrect: false, pointsEarned: 0 });
                    setPhase('answered');
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

      {/* Answered / Results */}
      {(phase === 'answered' || phase === 'results') && answerResult && (
        <div className="space-y-6">
          <PlayerResults
            isCorrect={answerResult.isCorrect}
            pointsEarned={answerResult.pointsEarned}
          />

          {phase === 'results' && participants.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-bold mb-3">Leaderboard</h3>
              <LeaderboardDisplay participants={participants} limit={5} />
            </div>
          )}

          {phase === 'answered' && (
            <p className="text-center text-gray-400 text-sm">
              Waiting for other players...
            </p>
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

'use client';

import Button from '@/components/ui/Button';

export default function HostControls({
  status,
  currentIndex,
  totalQuestions,
  onStart,
  onNextQuestion,
  onShowResults,
  onEndQuiz,
}) {
  if (status === 'lobby') {
    return (
      <div className="flex gap-3">
        <Button onClick={onStart} size="lg" disabled={totalQuestions === 0}>
          {totalQuestions === 0 ? 'Add questions first' : 'Start Quiz'}
        </Button>
      </div>
    );
  }

  if (status === 'showing_question') {
    return (
      <div className="flex gap-3">
        <Button onClick={onShowResults}>
          Show Results
        </Button>
      </div>
    );
  }

  if (status === 'showing_results') {
    const isLast = currentIndex >= totalQuestions - 1;
    return (
      <div className="flex gap-3">
        {!isLast ? (
          <Button onClick={onNextQuestion}>
            Next Question ({currentIndex + 2}/{totalQuestions})
          </Button>
        ) : (
          <Button onClick={onEndQuiz} variant="success">
            End Quiz & Show Final Results
          </Button>
        )}
      </div>
    );
  }

  return null;
}

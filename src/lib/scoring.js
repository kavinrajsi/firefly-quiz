/**
 * Calculate points for an answer.
 * Formula: base_points * (1 - (time_taken / time_limit) * 0.5)
 * Correct answers: 500-1000 points based on speed
 * Wrong answers: 0 points
 */
export function calculateScore(timeTaken, timeLimit, isCorrect) {
  if (!isCorrect) return 0;
  if (!timeLimit || timeLimit <= 0) return 1000;
  const clamped = Math.max(0, Math.min(timeTaken || 0, timeLimit));
  const speedFactor = 1 - (clamped / timeLimit) * 0.5;
  return Math.max(500, Math.round(1000 * speedFactor));
}
